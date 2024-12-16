const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const uri = `mongodb+srv://uy-ja_db:${process.env.DB_PASSWORD}@plntr.18ft2.mongodb.net/?retryWrites=true&w=majority&appName=Plntr`;

async function connectDB() {
  try {
    await mongoose.connect(uri);
    console.log("Successfully connected to MongoDB!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

module.exports = connectDB;
