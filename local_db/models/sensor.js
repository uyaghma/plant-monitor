const mongoose = require("mongoose");

const sensorSchema = new mongoose.Schema({
  pot_id: { type: mongoose.Schema.Types.ObjectId, ref: "Pot", required: true }, // Reference to the associated pot
  temperature: { type: Number, default: undefined },
  humidity: { type: Number, default: undefined },
  soilMoisture: { type: Number, default: undefined },
  waterLevel: { type: Number, default: undefined },
  timestamp: { type: Date, default: Date.now },
});

const Sensors = mongoose.model("Sensors", sensorSchema);

module.exports = Sensors;
