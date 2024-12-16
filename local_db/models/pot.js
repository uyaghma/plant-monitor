const mongoose = require("mongoose");

const potSchema = new mongoose.Schema({
  pot_id: { type: Number, required: true, unique: true },
  plant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Plant",
    default: undefined,
  },
  sensorData: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sensors",
      default: undefined,
    },
  ],
  reg_date: { type: Date, default: Date.now },
  last_watered: { type: Date, default: "" },
});

const Pot = mongoose.model("Pot", potSchema);

module.exports = Pot;
