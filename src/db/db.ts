import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
const dbUri = process.env.DATABASE;

if (!dbUri) {
  console.error("❌ DATABASE environment variable is not defined in .env");
  process.exit(1);
}

// Recommended Mongoose connection options
const connectOptions: mongoose.ConnectOptions = {
  // control how long the driver will try to find a suitable server
  serverSelectionTimeoutMS: 10000,
  // how long to try to connect before timing out
  connectTimeoutMS: 10000,
};

// Retry connection with exponential backoff
async function connectWithRetry(retries = 5, delay = 2000): Promise<void> {
  try {
    await mongoose.connect(dbUri!, connectOptions);
    console.log("✅ Database connected successfully");
  } catch (e: any) {
    console.error("❌ Database connection failed:", e.message || e);
    if (retries <= 0) {
      console.error("Exceeded maximum retries to connect to the database.");
      throw e;
    }
    const nextDelay = Math.min(delay * 2, 30000);
    console.warn(`Retrying database connection in ${delay}ms... (${retries} retries left)`);
    await new Promise((res) => setTimeout(res, delay));
    return connectWithRetry(retries - 1, nextDelay);
  }
}

// Optional: avoid prolonged buffering if connection not available
mongoose.set("bufferCommands", true);

export async function connectDatabase(retries = 5, delay = 2000): Promise<void> {
  await connectWithRetry(retries, delay);
}

// connection event handlers (log only)
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected.");
});
