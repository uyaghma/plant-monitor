var express = require("express");
var router = express.Router();
var axios = require("axios");
var dotenv = require("dotenv");
var Pot = require("../local_db/models/pot");
var Alert = require("../local_db/models/alert");

dotenv.config();

router.get("/", async (req, res, next) => {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const date = new Date();
  const dateString = `${days[date.getDay()]}, ${
    months[date.getMonth()]
  } ${date.getDate()}, ${date.getFullYear()}`;

  try {
    // Fetch current weather
    const weatherResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=Edmonton&appid=${process.env.WEATHER_API_KEY}&units=metric`
    );
    const weather = weatherResponse.data;

    // Fetch all pots and associated plant data
    const pots = await Pot.find().populate("plant");

    const transformedPots = pots.map((pot) => ({
      id: pot.pot_id,
      name: pot.plant?.common_name || "Unassigned",
      status: determinePlantStatus(pot.sensorData),
      last_watered: pot.last_watered || "Unknown",
      image: pot.plant?.image || "https://via.placeholder.com/150",
    }));

    const alerts = await Alert.find({}).sort({ created_at: -1 });

    // Render the index page with dynamic data
    res.render("index", {
      user: "Uyghur",
      date: dateString,
      temp: Math.round(weather.main.temp) + " °C",
      weather: weather.weather[0].description,
      icon: weather.weather[0].icon,
      plants: transformedPots,
      alerts: alerts,
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to determine plant status based on sensor data
const determinePlantStatus = (sensorData) => {
  if (!sensorData || sensorData.length === 0) return "Unknown";

  // Example logic: Check the latest sensor data for soil moisture or water levels
  const latestSensor = sensorData[sensorData.length - 1];
  if (latestSensor.soilMoisture < 30) return "Needs Water";
  if (latestSensor.soilMoisture >= 30 && latestSensor.soilMoisture <= 60)
    return "Healthy";
  return "Unhealthy";
};

module.exports = router;
