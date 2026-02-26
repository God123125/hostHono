import mongoose, { Schema } from "mongoose";
import * as z from "zod";
export const Merchant = z.object({
  name: z.string(),
  username: z.string(),
  email: z.string(),
  phone: z.string(),
  address: z.string(),
  password: z.string(),
  isActive: z.boolean(),
  profile: z
    .object({
      filename: z.string(),
      mimetype: z.string(),
      data: z.any(),
      length: z.number(),
    })
    .optional(),
  role: z.string(),
  commision_rate: z.number().optional(),
});
export type Merchant = z.infer<typeof Merchant>;
const merchantSchema = new Schema<Merchant>(
  {
    name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    profile: {
      filename: String,
      mimetype: String,
      data: Buffer,
      length: Number,
    },
    role: {
      type: String,
      required: true,
    },
    commision_rate: {
      type: Number,
    },
  },
  { timestamps: true },
);
export const merchantModel = mongoose.model<Merchant>(
  "merchants",
  merchantSchema,
);
