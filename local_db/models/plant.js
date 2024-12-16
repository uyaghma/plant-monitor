const mongoose = require("mongoose");

const plantSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true }, // API plant ID
  common_name: { type: String, required: true, trim: true },
  scientific_name: { type: String, default: "Unknown", trim: true },
  watering: { type: String, default: "Unknown" },
  volume_water: { type: String, default: "Unknown" },
  watering_guide: { type: String, default: "Unknown" },
  sunlight: { type: String, default: "Unknown" },
  image: { type: String, default: "https://via.placeholder.com/150" },
  pot_id: { type: mongoose.Schema.Types.ObjectId, ref: "Pot", required: true }, // Reference to the associated pot
});

const Plant = mongoose.model("Plant", plantSchema);

module.exports = Plant;
