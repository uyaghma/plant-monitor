const express = require("express");
const sensorController = require("../controllers/sensorController");
const router = express.Router();

router.get("/latest/:pot_id", sensorController.getLatestSensorData);
router.post("/range/:pot_id", sensorController.getSensorDataInRange);

module.exports = router;
