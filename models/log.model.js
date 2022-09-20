const sql = require("./db.js");
const util = require('util');
const query = util.promisify(sql.query).bind(sql);

// constructor
const Log = function(log) {
  this.buyer = log.buyer;
  this.txn = log.txn;
  this.date = log.date;
  this.tickets = log.tickets;
  this.idraffle = log.idraffle;
};


Log.create = async (buyer, tickets, idraffle, txn) => {
  let time = new Date();
  await query('INSERT INTO log3 SET buyer=?, txn=?, date=?, tickets=?, idraffle=?', [buyer, txn, time, tickets, idraffle]);
};

Log.getLogByIdRaffle = async(idRaffle) => {
  return await query('SELECT * FROM log3 where idraffle = ? ORDER BY Date DESC', [idRaffle]);
}

module.exports = Log;