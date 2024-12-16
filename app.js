var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var axios = require("axios");
var mqtt = require("mqtt");
const Pot = require("./local_db/models/pot");
const Plant = require("./local_db/models/plant");
const Sensor = require("./local_db/models/sensor");
const Alert = require("./local_db/models/alert");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const uri = `mongodb+srv://uy-ja_db:${process.env.DB_PASSWORD}@plntr.18ft2.mongodb.net/?retryWrites=true&w=majority&appName=Plntr`;

async function run() {
  // Connect the client to the server	(optional starting in v4.7)
  await mongoose.connect(uri);
  // Send a ping to confirm a successful connection
  console.log("Pinged your deployment. You successfully connected to MongoDB!");
}

run().catch(console.dir);

const options = {
  port: process.env.BROKER_PORT,
  host: process.env.BROKER_ADDR,
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  protocol: "mqtts",
};

const mqtt_client = mqtt.connect(options);

let rt_sensor = {};

mqtt_client.on("error", (error) => {
  console.error("MQTT Connection Error: ", error);
});

mqtt_client.on("connect", () => {
  console.log("Connected to broker...");
  mqtt_client.subscribe("picow/sensor_data");
});

mqtt_client.on("message", async (topic, message) => {
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
      console.error(`Pot with ID ${pot_id} not found.`);
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

var indexRouter = require("./routes/index");
var registerRouter = require("./routes/register");
var plantRouter = require("./routes/plant");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/register", registerRouter);
app.use("/plant", plantRouter);

// Backend route to handle fetching sensor data
app.get("/sensor-data", (req, res) => {
  try {
    if (Object.keys(rt_sensor).length === 0) {
      return res.status(204).send(); // No Content if no data
    }

    res.status(200).json(rt_sensor);
  } catch (error) {
    console.error("Error fetching sensor data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/plants", async (req, res) => {
  const PERENUAL_API_URL = "https://perenual.com/api/species-list";

  try {
    const { name } = req.query;
    const apiResponse = await axios.get(PERENUAL_API_URL, {
      params: {
        q: name,
        key: process.env.PERENUAL_API_KEY,
      },
    });

    const plants = apiResponse.data.data || [];
    if (plants.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        error: "No plants found.",
      });
    }

    const topResults = plants.slice(0, 5);
    res.status(200).json({ success: true, data: topResults, error: null });
  } catch (error) {
    console.error("Error searching for plants:", error);
    res.status(500).json({
      success: false,
      data: null,
      error: "Error searching for plants.",
    });
  }
});

app.post("/pump/on/:pot_id", (req, res) => {
  const { pot_id } = req.params;
  mqtt_client.publish(`picow/pump/${pot_id}`, "on");
  response.status(200).json({ success: true, data: "Pump on", error: null });
});

app.post("/pump/off/:pot_id", (req, res) => {
  const { pot_id } = req.params;
  mqtt_client.publish(`picow/pump/${pot_id}`, "off");
  response.status(200).json({ success: true, data: "Pump off", error: null });
});

async function pollWeatherAndWaterPlants() {
  try {
    const weather = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?q=Edmonton&appid=${process.env.WEATHER_API_KEY}&units=metric`
    );

    const forecast = weather.data; // Process forecast as needed

    const sensors = await Sensor.find({});
    for (let sensor of sensors) {
      const { pot_id, soilMoisture } = sensor;

      if (soilMoisture < 15) {
        // Example soil moisture threshold
        mqtt_client.publish(`pico/pump/${pot_id}`, "on");
        setTimeout(() => {
          mqtt_client.publish(`pico/pump/${pot_id}`, "off");
        }, 3000); // Pump runs for 3 seconds

        await Pot.findByIdAndUpdate(pot_id, { last_watered: new Date() });
      }
    }
  } catch (error) {
    console.error("Error in weather or watering function:", error);
    await Alert.create({
      pot_id: null,
      message: `Error watering plants: ${error.message}`,
      severity: "high",
    });
  }
}

async function checkSensorDataAndGenerateAlerts() {
  try {
    const pots = await Pot.find({}).populate("plant");
    const sensors = await Sensor.find({});

    sensors.forEach(async (sensor) => {
      const { pot_id, temperature, humidity, soilMoisture, waterLevel } =
        sensor;
      const pots = await Pot.find({ pot_id }).populate("plant");

      if (waterLevel < 300) {
        await Alert.create({
          pot_id,
          message: `Water level low for ${pots.plant.common_name}`,
        });
      }

      if (soilMoisture < 20) {
        // Example threshold
        await Alert.create({
          pot_id,
          message: `Soil moisture is critically low (${soilMoisture}%).`,
        });
      }

      if (temperature > 35) {
        await Alert.create({
          pot_id,
          message: `Temperature is too high (${temperature}°C).`,
        });
      }

      if (humidity < 20) {
        await Alert.create({
          pot_id,
          message: `Ambient humidity is low for `,
        });
      }
    });

    // Clean up alerts older than the 10 most recent for each pot
    pots.forEach(async (pot) => {
      const alerts = await Alert.find({ pot_id: pot._id })
        .sort({ created_at: -1 })
        .skip(10);
      for (let alert of alerts) {
        await Alert.findByIdAndDelete(alert._id);
      }
    });
  } catch (error) {
    console.error("Error checking sensor data:", error);
    await Alert.create({
      pot_id: null,
      message: `Error reading sensor data: ${error.message}`,
      severity: "high",
    });
  }
}

setInterval(checkSensorDataAndGenerateAlerts, 60000); // Run every minute
setInterval(pollWeatherAndWaterPlants, 600000); // Run every 10 minutes

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
