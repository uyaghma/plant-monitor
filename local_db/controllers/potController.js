const Pot = require("../models/pot");
const Plant = require("../models/plant");
const asyncHandler = require("express-async-handler");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const axios = require("axios");
dotenv.config();

exports.registerPot = asyncHandler(async (req, res, next) => {
  const { pot_id } = req.params;

  console.log(pot_id);
  // Check if the pot exists
  let pot = await Pot.findOne({ pot_id: pot_id }).populate("plant").exec();
  console.log(pot);

  if (pot) {
    // Check if a plant is registered
    if (pot.plant) {
      // Redirect to plant page
      res.render("plant", {
        pot_id: pot.pot_id,
        plant: pot.plant,
        data: [pot], // Add any additional plant data if needed
      });
    } else {
      // Render the registration page
      res.render("register", {
        pot_id: pot.pot_id,
        data: [], // Add plant search data or keep empty
      });
    }
  } else {
    // Create a new pot
    pot = await Pot.create({ pot_id: pot_id });
    console.log(pot_id);
    console.log(pot);
    // Render the registration page for the new pot
    res.render("register", {
      pot_id: pot.pot_id,
      data: [], // Add plant search data or keep empty
    });
  }
});

exports.registerPlant = asyncHandler(async (req, res, next) => {
  const { pot_id, plant_id } = req.body;

  // Check if the pot exists
  const pot = await Pot.findOne({ pot_id }).exec();
  if (!pot) {
    return res.status(404).json({ error: "Pot not found" });
  }

  try {
    // Fetch plant details from the API
    const apiKey = process.env.PERENUAL_API_KEY; // Ensure your API key is in the environment variables
    const apiUrl = `https://perenual.com/api/species/details/${plant_id}?key=${apiKey}`;
    const response = await axios.get(apiUrl);

    if (response.status !== 200 || !response.data) {
      return res
        .status(500)
        .json({ error: "Failed to fetch plant details from the API" });
    }

    const {
      id,
      common_name,
      scientific_name,
      watering,
      volume_water_requirement,
      watering_general_benchmark,
      sunlight,
      default_image,
    } = response.data;

    // Create a new Plant record
    const plant = await Plant.create({
      id,
      common_name,
      scientific_name: scientific_name[0] || "Unknown",
      watering: watering || "Unknown",
      volume_water: volume_water_requirement[0] || "Unknown",
      watering_guide:
        `${watering_general_benchmark.value} ${watering_general_benchmark.unit}` ||
        "Unknown",
      sunlight: sunlight[0] || "Unknown",
      image: default_image.original_url,
      pot_id: pot._id, // Associate the plant with the pot
    });

    // Update the pot to reference the new plant
    pot.plant = plant._id;
    await pot.save();

    // Redirect to the plant page
    res.redirect(`/plant/${pot_id}`);
  } catch (error) {
    console.error("Error registering plant:", error);
    res
      .status(500)
      .json({ error: "An error occurred while registering the plant" });
  }
});

exports.get_all_pots = asyncHandler(async (req, res, next) => {
  try {
    // Retrieve all pots and populate associated plant details
    const pots = await Pot.find().populate("plant");

    // Transform data for the front-end
    const transformedPots = pots.map((pot) => ({
      id: pot.pot_id,
      name: pot.plant?.name || "Unassigned",
      status: determinePlantStatus(pot.sensorData), // Add logic to compute plant status
      last_watered: pot.plant?.last_watered || "Unknown",
      image: pot.plant?.image || "https://via.placeholder.com/150", // Default image if not available
    }));

    // Respond with the transformed data
    res.status(200).json(transformedPots);
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
