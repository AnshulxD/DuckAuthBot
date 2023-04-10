const xrplClient = require('xrpl')
const { XummSdk } = require('xumm-sdk')
const Sdk = new  XummSdk('a683b936-42b7-4ec5-ac1e-9f83f69241d1','9ad2b989-ed78-454b-8d2d-4fd72d28eea8')
const xrplTX = require('xrpl-txdata')
const txd = new xrplTX.TxData()
const xrpl = new xrplClient.Client("wss://s1.ripple.com");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
global.coins = [
  { name: "Duck", issuer: "rw5Nvt8tBXS3bCbGvJsLneXy9ekLh2pXkg" }
]
const getBalances = async (account, userID) => {
try {

  const balances = await xrpl.getBalances(account);
  const filteredBalances = balances.filter(balance => {
    return global.coins.some(coin => coin.issuer == balance.issuer);
  });
  if (filteredBalances.length > 0) {
    process.emit("Balances", filteredBalances, userID)
  }
  // global.client.users.cache.get(userID).send(`You have ${filteredBalances[0].value} DUCK coins`);
  return filteredBalances;
} catch(e) {
  // console.log(e)
}
}

const getBalance = async (account, userID) => {
  try {
  
    const balances = await xrpl.getBalances(account);
    const filteredBalances = balances.filter(balance => {
      return global.coins.some(coin => coin.issuer == balance.issuer);
    });
    if (filteredBalances.length > 0) {
      process.emit("Balances", filteredBalances, userID)
    }
    global.client.users.cache.get(userID).send(`You have ${filteredBalances[0].value} DUCK coins`);
    return filteredBalances;
  } catch(e) {
    // console.log(e)
  }
  }

const accountExists = async (account) => {
  try {
    await xrpl.request({
      command: 'account_info',
      account: account
    });
    return true;
  } catch (error) {
    return false;
  }
}

const subscribeToPayload = async (userID) => {
  const subscription = await Sdk.payload.createAndSubscribe({
    txjson: {
      TransactionType: "SignIn",
    },
    options: {
      submit: true
    }
  }, async event => {
    // console.log('New payload event:', event.data)

    if (event.data.signed === true) {
      Sdk.payload.get(event.data.payload_uuidv4).then(async res => {
        if (!res.response.txid) return;
        const account = res.response.account
        if (await accountExists(account)) {
          db.set(userID, account);
          global.client.users.cache.get(userID).send(`Your account has been linked.`)
          await getBalance(account, userID);
         
            } else {
          console.log(`Account ${account} does not exist.`);
        }
      })
    }

    if (event.data.signed === false) {
      console.log('The sign request was rejected :(')
      return false
    }
  });
  // subscription.unsubscribe();
  return subscription.created;
}

const main = async (userID) => {

  // await xrpl.connect()

  const appInfo = await Sdk.ping()
  console.log(appInfo.application.name)

  const subscriptionCreated = await subscribeToPayload(userID);
  return subscriptionCreated.next.always;
}

const fetchAllAccounts = async () => {
  const accounts = await db.all();
  // console.log(accounts)
  for (const account of accounts) {
    const userID = account.id;
    const xrplAccount = account.value;
    await getBalances(xrplAccount, userID);
  }
}

// main()
( async () => {
  await xrpl.connect()
// const link = await main();
// console.log(`84 `+link);
// console.log(await getBalance("rUi8HuaH1fiATHH6jHPtwCWQWDasG3Pds2"))

})()

module.exports = {
  main,
  getBalance,
  fetchAllAccounts
}