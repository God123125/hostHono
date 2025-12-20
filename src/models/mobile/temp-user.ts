import mongoose from "mongoose";

const tempUserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    code: {
      type: Number,
      required: true,
    },

    expire: {
      type: Number,
      required: true,
    },

    resendCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const tempUserModel = mongoose.model("temp_users", tempUserSchema);
