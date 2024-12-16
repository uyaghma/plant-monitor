const axios = require("axios");

async function searchPlants(query) {
  const PERENUAL_API_URL = "https://perenual.com/api/species-list";

  try {
    const apiResponse = await axios.get(PERENUAL_API_URL, {
      params: { q: query, key: process.env.PERENUAL_API_KEY },
    });

    return apiResponse.data.data.slice(0, 5); // Return top 5 results
  } catch (error) {
    throw new Error("Error searching for plants.");
  }
}

module.exports = searchPlants;
