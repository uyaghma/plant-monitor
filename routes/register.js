var express = require("express");
var dotenv = require("dotenv");
var router = express.Router();
const potController = require("../local_db/controllers/potController");
dotenv.config();

/* GET register page. */
router.get("/:pot_id", potController.registerPot);

router.post("/add", potController.registerPlant);

module.exports = router;
