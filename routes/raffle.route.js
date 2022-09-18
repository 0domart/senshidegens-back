const raffle = require("../controllers/raffle.controller.js");

var router = require("express").Router();

router.get("/participants=:id", raffle.getParticipants);

router.get("/wallet=:wallet", raffle.getStatut);

router.get("/:idraffle/wallet=:wallet", raffle.getStatutByIdRaffle);

router.post("/register", raffle.register);

// Withdraw Step 1 - Intructions
router.post("/register1", raffle.withdraw);

// Withdraw Step 2 - Send Token
router.post("/register2", raffle.withdraw2);

router.get("/check/id=:id", raffle.check);


module.exports = router;