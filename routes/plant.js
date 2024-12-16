const express = require("express");
const router = express.Router();
const plantController = require("../local_db/controllers/plantController");

// GET plant page based on pot_id
router.get("/:pot_id", plantController.get_plant);

module.exports = router;
