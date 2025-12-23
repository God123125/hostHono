import mongoose, { Schema } from "mongoose";
import * as z from "zod";
export const Order = z.object({
  name: z.string(),
  qty: z.number(),
  size: z.string().optional(),
  price: z.number(),
  subtotal: z.number(),
  user: z.string(),
  product: z.string(),
  delivery_fee: z.number(),
  total: z.number(),
  imageUrl: z.string(),
});
export type Order = z.infer<typeof Order>;
const orderSchema = new Schema<Order>({
  name: {
    type: String,
    required: true,
  },
  qty: {
    type: Number,
    required: true,
  },
  size: String,
  price: {
    type: Number,
    required: true,
  },
  subtotal: {
    type: Number,
    required: true,
  },
  user: {
    type: String,
    ref: "mobile_users",
    required: true,
  },
  product: {
    type: String,
    ref: "products",
    required: true,
  },
  delivery_fee: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
});
export const orderModel = mongoose.model<Order>("orders", orderSchema);
