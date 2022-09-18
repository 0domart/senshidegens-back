const admin = require("../controllers/admin.controller.js");

var router = require("express").Router();

router.get("/login=:password", admin.login);
router.post("/create", admin.create);
router.delete("/delete", admin.delete);


module.exports = router;