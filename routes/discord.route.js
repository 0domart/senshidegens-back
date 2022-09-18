const discord = require("../controllers/discord.controller.js");

var router = require("express").Router();

router.post("/", discord.save);

module.exports = router;