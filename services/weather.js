const axios = require("axios");
const Pot = require("../local_db/models/pot");
const Sensor = require("../local_db/models/sensor");
const mqttClient = require("../config/mqtt");

async function pollWeatherAndWaterPlants() {
  try {
    const weather = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?q=Edmonton&appid=${process.env.WEATHER_API_KEY}&units=metric`
    );

    const sensors = await Sensor.find({});
    for (let sensor of sensors) {
      const { pot_id, soilMoisture } = sensor;

      if (soilMoisture < 15) {
        mqttClient.publish(`pico/pump/${pot_id}`, "on");
        setTimeout(() => {
          mqttClient.publish(`pico/pump/${pot_id}`, "off");
        }, 3000);
        await Pot.findByIdAndUpdate(pot_id, { last_watered: new Date() });
      }
    }
  } catch (error) {
    console.error("Error in weather or watering function:", error);
  }
}

module.exports = pollWeatherAndWaterPlants;
