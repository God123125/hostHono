import mongoose, { Schema } from "mongoose";
import * as z from "zod";
export const users = z.object({
  fullname: z.string(),
  username: z.string(),
  email: z.string(),
  phone: z.string(),
  address: z.string(),
  password: z.string(),
  isActive: z.boolean(),
  profile: z.string(),
  role: z.string(),
  commission_rate: z.number(),
});
export type users = z.infer<typeof users>;
const usersSchema = new Schema<users>(
  {
    username: {
      type: String,
      required: false,
    },
    fullname : {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
    },
    address: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    profile: {
      type: String,
    },
    isActive: {
      type: Boolean,
    },
    role: {
      type: String,
      required: true,
    },
    commission_rate: {
      type: Number,
    },
  },
  { timestamps: true },
);
export default mongoose.model<users>("users", usersSchema);
