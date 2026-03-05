import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
const dbUri = process.env.DATABASE;

if (!dbUri) {
  console.error("❌ DATABASE environment variable is not defined in .env");
  process.exit(1);
}

mongoose.connect(dbUri)
  .then(() => {
    console.log("✅ Database connected successfully");
  })
  .catch((e) => {
    console.error("❌ Database connection failed:", e.message);
  });

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected. Attempting to reconnect...");
});
