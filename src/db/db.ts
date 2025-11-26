import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
const Mongoose = mongoose;
Mongoose.connect(process.env.DATABASE as string)
  .then((res) => {
    console.log("Database connected successfully");
  })
  .catch((e) => console.log("connect failed", e));
