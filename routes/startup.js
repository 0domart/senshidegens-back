const express = require("express");
var raffle = require("../routes/raffle.route.js");
var admin = require("../routes/admin.route.js");
var log = require("../routes/log.route.js");
var discord = require("../routes/discord.route.js");

var cors = require('cors');

module.exports = function(app) {
  app.use(express.json());
  app.use(cors({origin: true}));

  app.use("/raffle", raffle);
  app.use("/admin", admin);
  app.use("/log", log);
  app.use("/discord", discord);
};