const {
    sign
} = require('tweetnacl');
const Raffle = require("../models/raffle.model.js");
const Log = require("../models/log.model.js");

exports.getLogByRaffle = async (req, res) => {
    const logs = await Log.getLogByIdRaffle(req.params.idraffle);
    res.status(200).send(logs);
}