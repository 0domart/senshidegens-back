const sql = require("./db.js");
const util = require('util');
const query = util.promisify(sql.query).bind(sql);

// constructor
const Discord = function(discord) {
  this.wallet = discord.wallet;
  this.discord = discord.discord;
};


Discord.save = async (wallet, discord, type) => {

  if(type === "eth"){
    const rows = await query('SELECT * FROM discord where wallet = ?', [wallet]);
    if(rows && rows.length > 0){
      await query("UPDATE discord SET eth= ? WHERE wallet = ?", [discord,wallet]);
    }
    else {
      await query("INSERT INTO discord SET wallet= ?, eth = ?", [wallet,discord]);
    }
  }
  else if(type === "discord"){
    const rows = await query('SELECT * FROM discord where wallet = ?', [wallet]);
    if(rows && rows.length > 0){
      await query("UPDATE discord SET discord= ? WHERE wallet = ?", [discord,wallet]);
    }
    else {
      await query("INSERT INTO discord SET wallet= ?, discord = ?", [wallet,discord]);
    }
  }
  return "Done";
};

Discord.selectAll = async () => {
  return await query('SELECT * FROM discord');
};

module.exports = Discord;