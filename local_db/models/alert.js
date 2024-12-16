const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema({
  pot_id: { type: mongoose.Schema.Types.ObjectId, ref: "Pot", required: true },
  message: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
});

const Alert = mongoose.model("Alert", alertSchema);

module.exports = Alert;
