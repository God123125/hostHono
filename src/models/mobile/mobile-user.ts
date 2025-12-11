import mongoose, { Schema } from "mongoose";
import * as z from "zod";
export const mobileUser = z.object({
  name: z.string().optional(),
  email: z.string(),
  password: z.string().min(8).max(15),
});
export type mobileUser = z.infer<typeof mobileUser>;
const mobileUserSchema = new Schema<mobileUser>(
  {
    name: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);
export default mongoose.model<mobileUser>("mobile_users", mobileUserSchema);
