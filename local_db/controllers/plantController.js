const Plant = require("../models/plant");
const Pot = require("../models/pot");
const asyncHandler = require("express-async-handler");

exports.get_plant = asyncHandler(async (req, res, next) => {
  const { pot_id } = req.params;

  // Find the pot by pot_id
  const pot = await Pot.findOne({ pot_id }).populate("plant");

  if (!pot) {
    return res.status(404).render("error", {
      message: "Pot not found",
      error: { status: 404 },
    });
  }

  if (!pot.plant) {
    return res.status(404).render("error", {
      message: "Plant not found for this pot",
      error: { status: 404 },
    });
  }

  // Render the plant page with plant data
  res.render("plant", {
    pot_id,
    plant: {
      id: pot.plant._id,
      common_name: pot.plant.common_name,
      scientific_name: pot.plant.scientific_name,
      watering: pot.plant.watering,
      volume_water: pot.plant.volume_water,
      watering_guide: pot.plant.watering_guide,
      sunlight: pot.plant.sunlight,
      last_watered: "Not Available", // Add real watering data if tracked
      image: pot.plant.image || "https://via.placeholder.com/150", // Default image if none provided
    },
  });
});
