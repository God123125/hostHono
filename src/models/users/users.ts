import mongoose, { Schema } from "mongoose";
import * as z from "zod";
export const users = z.object({
  fullname: z.string(),
  username: z.string(),
  email: z.string(),
  phone: z.string().optional(),
  address: z.string().optional(),
  password: z.string(),
  isActive: z.boolean().optional(),
  profile: z.string().optional(),
  role: z.string(),
  commission_rate: z.number().optional(),
  // Merchant-specific fields
  brandImage: z.string().optional(),
  ownerName: z.string().optional(),
  totalProducts: z.number().optional(),
  totalOrders: z.number().optional(),
  totalRevenue: z.number().optional(),
  commissionPaid: z.number().optional(),
  joinDate: z.string().optional(),
  status: z.union([
    z.literal("active"),
    z.literal("inactive"),
    z.literal("suspended"),
    z.literal("pending"),
  ]).optional(),
  rating: z.number().optional(),
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
      // Merchant-specific
      brandImage: { type: String },
      ownerName: { type: String },
      totalProducts: { type: Number, default: 0 },
      totalOrders: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      commissionPaid: { type: Number, default: 0 },
      joinDate: { type: Date },
      status: { type: String, enum: ["active", "inactive", "suspended", "pending"] },
      rating: { type: Number, default: 0 },
  },
  { timestamps: true },
);
export default mongoose.model<users>("users", usersSchema);
