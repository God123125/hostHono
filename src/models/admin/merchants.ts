import mongoose, { Schema } from "mongoose";
import * as z from "zod";
export const Admin = z.object({
  fullname: z.string(),
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
  commission_rate: z.number(),
});
export type Admin = z.infer<typeof Admin>;
const adminSchema = new Schema<Admin>(
  {
    fullname: {
      type: String,
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
    },
    address: {
      type: String,
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
    commission_rate: {
      type: Number,
    },
    isActive: {
      type: Boolean,
    },
  },
  { timestamps: true },
);
export const adminModel = mongoose.model<Admin>(
  "admins",
  adminSchema,
);
