const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

const connectDB = require("./config/mongo");
const mqttClient = require("./config/mqtt");
const errorHandler = require("./middleware/errorHandler");
const Pot = require("./local_db/models/pot");
const Plant = require("./local_db/models/plant");
const Sensors = require("./local_db/models/sensor");
const pollWeatherAndWaterPlants = require("./services/weather");
const checkSensorDataAndGenerateAlerts = require("./services/sensorAlerts");

// Connect to MongoDB
connectDB();

// MQTT client setup
mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker...");
  mqttClient.subscribe("picow/sensor_data");
});

mqttClient.on("message", async (topic, message) => {
  try {
    const msg = message.toString();
    const data = JSON.parse(msg);
    rt_sensor = data;

    // Check if the required fields exist
    const { pot_id, temperature, humidity, soil_moisture, water_level } = data;

    if (!pot_id) {
      console.error("Pot ID missing in sensor data.");
      return;
    }

    // Find the pot using pot_id
    const pot = await Pot.findOne({ pot_id });
    if (!pot) {
      console.error("Pot with ID ${pot_id} not found.");
      return;
    }

    // Save sensor data to the database
    const sensorData = await Sensors.create({
      pot_id: pot._id,
      temperature: temperature,
      humidity: humidity,
      soilMoisture: soil_moisture,
      waterLevel: water_level,
    });

    // Associate sensor data with the pot
    pot.sensorData.push(sensorData._id);
    await pot.save();

    console.log("Sensor data saved:", sensorData);
  } catch (error) {
    console.error("Error processing MQTT message:", error);
  }
});

// Express app setup
const app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

const indexRouter = require("./routes/index");
const registerRouter = require("./routes/register");
const plantRouter = require("./routes/plant");

app.use("/", indexRouter);
app.use("/register", registerRouter);
app.use("/plant", plantRouter);

// Backend route to fetch sensor data
app.get("/sensor-data", (req, res) => {
  res.json(rt_sensor || {});
});

// Error handler
app.use(errorHandler);

// Start background tasks
setInterval(checkSensorDataAndGenerateAlerts, 60000);
setInterval(pollWeatherAndWaterPlants, 600000);

module.exports = app;
