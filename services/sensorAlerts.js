const Sensor = require("../local_db/models/sensor");
const Alert = require("../local_db/models/alert");

async function checkSensorDataAndGenerateAlerts() {
  try {
    const sensors = await Sensor.find({});
    for (const sensor of sensors) {
      const { pot_id, temperature, humidity, soilMoisture, waterLevel } =
        sensor;

      if (waterLevel < 300) {
        await Alert.create({ pot_id, message: "Low water level detected." });
      }
      if (soilMoisture < 20) {
        await Alert.create({ pot_id, message: "Low soil moisture detected." });
      }
      if (temperature > 35) {
        await Alert.create({ pot_id, message: "High temperature detected." });
      }
      if (humidity < 20) {
        await Alert.create({ pot_id, message: "Low humidity detected." });
      }
    }
  } catch (error) {
    console.error("Error generating alerts:", error);
  }
}

module.exports = checkSensorDataAndGenerateAlerts;
