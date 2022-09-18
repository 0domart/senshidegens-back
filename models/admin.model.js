const sql = require("./db.js");
const util = require('util');
const query = util.promisify(sql.query).bind(sql);

// constructor
const Admin = function(raffle) {
  this.idraffle = raffle.idraffle;
  this.title = raffle.title;
  this.collection = raffle.collection;
  this.image = raffle.image;
  this.twitter = raffle.twitter;
  this.end_raffle = raffle.end_raffle;
  this.winner_wallet = raffle.winner_wallet;
  this.solscan = raffle.solscan;
  this.price = raffle.price;
  this.maxTickets = raffle.maxTickets;
  this.categorie= raffle.categorie;
  this.numberWinners = raffle.numberWinners;
  this.description = raffle.description;
  this.eth = raffle.eth;
};

Admin.create = async (newRaffle) => {
  await query('INSERT INTO raffle2 SET ?', [newRaffle]);
  return newRaffle;
};

Admin.delete = async (id) => {
  sql.query('DELETE FROM raffle2 WHERE idraffle = ?', [id],
  (err, res) => {
    if (err) {
      return "err";
    }
    if (res.affectedRows == 0) {
      return "not_found";
    }
    return "done"
  });
};

Admin.update = async (id, newRaffle) => {
  sql.query(
    "UPDATE raffle2 SET title = ?, collection = ?, twitter = ?, image = ?, end_raffle = ?, solscan = ?, price = ?, maxTickets= ?, categorie= ?, numberWinners = ?, description = ?, eth = ? WHERE idraffle = ?",
    [newRaffle.title, newRaffle.collection, newRaffle.twitter ,newRaffle.image ,newRaffle.end_raffle ,newRaffle.solscan, newRaffle.price, newRaffle.maxTickets, newRaffle.categorie,newRaffle.numberWinners, newRaffle.description, newRaffle.eth, id],
    (err, res) => {
      if (err) {
        return "err";
      }
      if (res.affectedRows == 0) {
        return "not_found";
      }
      return "done"
    }
  );
};

module.exports = Admin;