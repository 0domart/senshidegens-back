const sql = require("./db.js");
const util = require('util');
const query = util.promisify(sql.query).bind(sql);

// constructor
const Transactions = function(transactions) {
  this.wallet = transactions.wallet;
  this.amount = transactions.amount;
  this.time = transactions.time;
  this.event = transactions.event;
};


Transactions.create = async (wallet, amount, event) => {
  let time = new Date();
  await query('INSERT INTO Transactions3 SET wallet=?, amount=?, time=?, event=?', [wallet, amount, time, event]);
};


module.exports = Transactions;