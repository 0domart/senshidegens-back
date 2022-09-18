const log = require("../controllers/log.controller.js");

var router = require("express").Router();

router.get("/:idraffle", log.getLogByRaffle);

module.exports = router;