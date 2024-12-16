const Sensors = require("../models/sensor");
const asyncHandler = require("express-async-handler");

exports.getLatestSensorData = asyncHandler(async (req, res) => {
  const { pot_id } = req.params;

  // Find the latest sensor data for the given pot
  const latestSensorData = await Sensors.findOne({ pot_id })
    .sort({ timestamp: -1 })
    .exec();

  if (!latestSensorData) {
    return res
      .status(404)
      .json({ error: "No sensor data found for this pot." });
  }

  res.json(latestSensorData);
});

exports.getSensorDataInRange = asyncHandler(async (req, res) => {
  const { pot_id } = req.params;
  const { start, end } = req.body;

  const sensorData = await Sensors.find({
    pot_id,
    timestamp: { $gte: new Date(start), $lte: new Date(end) },
  });

  if (!sensorData.length) {
    return res
      .status(404)
      .json({ error: "No sensor data found in the provided date range." });
  }

  res.json(sensorData);
});
