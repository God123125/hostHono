import mongoose, { Schema } from "mongoose";
import * as z from "zod";
export const mobileUser = z.object({
  name: z.string().optional(),
  email: z.string(),
  profile: z.object({
    filename: z.string(),
    mimetype: z.string(),
    data: z.any(), // Buffer
    length: z.number(),
  }),
  password: z.string().min(8).max(15),
  phone: z.string().max(10).min(9),
  address: z.array(
    z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      province: z.string().optional(),
      country: z.string().optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
    })
  ),
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
    profile: {
      filename: String,
      mimetype: String,
      data: Buffer,
      length: Number,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: [
      {
        street: String,
        city: String,
        province: String,
        country: String,
        lat: Number,
        lng: Number,
      },
    ],
  },
  { timestamps: true }
);
export default mongoose.model<mobileUser>("mobile_users", mobileUserSchema);
