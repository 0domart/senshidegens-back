const sql = require("./db.js");
const util = require('util');
const query = util.promisify(sql.query).bind(sql);

// constructor
const Raffle = function(raffle) {
  this.idraffle = raffle.idraffle;
  this.wallet = raffle.wallet;
  this.tickets = raffle.tickets;
};

Raffle.register = async (wallet, idRaffle, tickets) => {

  const rows = await query('SELECT * FROM raffle_entries3 where wallet = ? and idraffle = ?', [wallet,idRaffle]);
  if(rows && rows.length > 0){
    await query("UPDATE raffle_entries3 SET tickets= ? + tickets WHERE wallet = ? and idraffle = ?", [tickets,wallet,idRaffle]);
  }
  else {
    await query("INSERT INTO raffle_entries3 SET tickets= ?, wallet = ?, idraffle = ?", [tickets,wallet,idRaffle]);
  }
  return "Done";
};

Raffle.registerReverse = async (wallet, idRaffle, tickets) => {

  const rows = await query('SELECT * FROM raffle_entries3 where wallet = ? and idraffle = ?', [wallet,idRaffle]);
  if(rows && rows.length > 0){
    await query("UPDATE raffle_entries3 SET tickets= tickets - ? WHERE wallet = ? and idraffle = ?", [tickets,wallet,idRaffle]);
  }
  return "Done";
};

Raffle.updateWinner = async (wallet, nbTickets, idRaffle) => {
  await query("UPDATE raffle3 SET winner_wallet= ?, winner_nb_tickets = ? WHERE idraffle = ?", [wallet,nbTickets, idRaffle]);
};

Raffle.getEntriesRaffleById = async(idRaffle) => {
  return await query('SELECT * FROM raffle_entries3 where idraffle = ?', [idRaffle]);
}

Raffle.getCountEntriesUserRaffleById = async(idRaffle, wallet) => {
  let currentTickets = 0;
  const total = await query('SELECT SUM(tickets) as total FROM raffle_entries3 where idraffle = ? and wallet = ?', [idRaffle, wallet]);
  if(total[0].total != null){
    currentTickets = total[0].total;
  }
  return currentTickets;
}

Raffle.getRaffles = async () => {
  return await query('SELECT * FROM raffle3 ORDER BY end_raffle DESC');
};

Raffle.getRaffleById = async (idRaffle) => {
  return await query('SELECT * FROM raffle3 WHERE idraffle = ?', [idRaffle]);
};

Raffle.isRaffleExist = async(idraffle) => {
  const rows = await query('SELECT * FROM raffle3 where idraffle = ?', [idraffle]);
  if(rows && rows.length === 1){
    return true
  }
  else {
    return false;
  }
}

Raffle.isRaffleOpen = async(idraffle, tickets, wallet) => {
  const rows = await query('SELECT * FROM raffle3 where idraffle = ?', [idraffle]);
  if(rows && rows.length === 1){
    if(rows[0].end_raffle > Date.now()){
      const currentNBTickets = await Raffle.getCountEntriesUserRaffleById(idraffle, wallet);
      if(currentNBTickets + tickets <= rows[0].maxTickets * Number(process.env.REACT_APP_RAFFLE_MAX_TICKETS_PER_USER)){
        return [true, rows[0].price];
      }
      else return [false];
    }
    else return [false];
  }
  else {
    return [false];
  }
}

Raffle.create = async (newRaffle) => {
  await query('INSERT INTO raffle3 SET ?', [newRaffle]);
  return newRaffle;
};

module.exports = Raffle;