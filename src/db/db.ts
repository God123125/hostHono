import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const dbUri = process.env.DATABASE;

if (!dbUri) {
  throw new Error("❌ DATABASE environment variable is not defined");
}

mongoose
  .connect(dbUri)
  .then(() => console.log("✅ Connected to database"))
  .catch((err) => console.error("❌ Database connection failed:", err.message));