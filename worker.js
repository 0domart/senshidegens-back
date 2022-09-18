let throng = require('throng');
let Queue = require("bull");
const Raffle = require("./models/raffle.model.js");
const Transactions = require("./models/transactions.model.js");
const Log = require("./models/log.model.js");
const {
    web3
} = require("@project-serum/anchor");

const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

// Connect to a local redis instance locally, and the Heroku-provided URL in production
let REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

// Spin up multiple processes to handle jobs to take advantage of more CPU cores
// See: https://devcenter.heroku.com/articles/node-concurrency for more info
let workers = process.env.WEB_CONCURRENCY || 2;

// The maximum number of jobs each worker should process at once. This will need
// to be tuned for your application. If each job is mostly waiting on network 
// responses it can be much higher. If each job is CPU-intensive, it might need
// to be much lower.
let maxJobsPerWorker = 500;

function start() {
    console.log("Start of the worker");
  // Connect to the named work queue
  let workQueue = new Queue('ddddddd', REDIS_URL);

  workQueue.process(maxJobsPerWorker, async (job) => {
    console.log("Job Start");
    const data = job.data;
    const walletReceiver = data.walletReceiver;
    const idRaffle = data.idRaffle;
    const tickets = data.tickets;
    const signature = data.signature;
    const NUMBER_OF_COINS = data.numberCoins;
    // Connection
    console.log(process.env.REACT_APP_RPC_URL);
    const connection = new web3.Connection(process.env.REACT_APP_RPC_URL, {
        commitment: "confirmed",
        confirmTransactionInitialTimeout: 60 * 6 * 1000
    });

    try {
        console.log("Test0");
        const res = await connection.confirmTransaction(signature, "confirmed");
        console.log(res);
        await Raffle.register(walletReceiver, idRaffle, tickets);
        await Log.create(walletReceiver, tickets, idRaffle, signature);
        console.log("Job End");
    }
    catch (error) {
        console.log(error);
        console.log("Job Problem " + walletReceiver + " " + signature + " idraffle " + idRaffle + " tickets " + tickets);
        //await Raffle.registerReverse(walletReceiver, idRaffle, tickets);
        await Transactions.create(walletReceiver, NUMBER_OF_COINS, "Raffle delete " + + idRaffle + " " + signature);
    }

    return { value: "This will be stored" };
  });
}

// Initialize the clustered worker process
// See: https://devcenter.heroku.com/articles/node-concurrency for more info
throng({ workers, start });