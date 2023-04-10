// Discord Bot
let removeAllRoles = true;
const Discord = require("discord.js");
const client = new Discord.Client({
    intents: [ Discord.GatewayIntentBits.Guilds ]
});
global.client = client;
const { main, getBalance, fetchAllAccounts } = require("./functions.js");
const { token, guildID, roleIds } = require("./config.json");
client.login(token);
client.on("ready", () => {
    console.log("Bot is ready!");
    registerCommands()

    setInterval(() => {
        fetchAllAccounts()
    }, 60 * 60 * 1000)
});

client.on("interactionCreate", async (interaction) => {
    // client.application.commands.delete()
    if (!interaction.guild) return;
    if (!interaction.isChatInputCommand()) return;
    if (!interaction.guild.id) return;
    if (interaction.commandName === "auth") {
        const link = await main(interaction.user.id);
        interaction.reply({ content: `Please authenticate your Xumm wallet by clicking this link: ${link}`, ephemeral: true });
    }

});

process.on("Balances", async (data, userID) => {
    // console.log("Balances event received", data, userID)
    const guild = await client.guilds.fetch(guildID);
    const member = await guild.members.fetch(userID);
    const duckCoin = global.coins.find(r => r.name == "Duck").issuer;
    const balance = data.find(r => r.issuer == duckCoin).value;
  
    if (balance == 0) {
      // Remove all roles
      await member.roles.remove(roleIds.map(r => r.role));
    } else if (removeAllRoles == true) {
      // Remove all roles
      await member.roles.remove(roleIds.map(r => r.role));
  
      // Add the correct token role
      const role = roleIds.filter(r => r.tokens <= balance).pop();
      member.roles.add(role.role);
    } else {
      // Add all roles before the correct token role
      const roles = roleIds.filter(r => r.tokens < balance);
      member.roles.add(roles.map(r => r.role));
    }
  });
  

  async function registerCommands() {
    const command = new Discord.SlashCommandBuilder().setName("auth").setDescription("Authenticate your Xumm wallet");
    await client.guilds.cache.get(guildID).commands.set([command.toJSON()])
    return true;
  }
process.on("uncaughtException", () => {});
process.on("unhandledRejection", () => {});

//   registerCommands()