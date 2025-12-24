import mongoose, { Schema } from "mongoose";
import * as z from "zod";
export const Order = z.object({
  user: z.string(),
  total: z.number(),
  delivery_fee: z.number(),
  status: z.string(),
  payment_method: z.string(),
  products: z.array(
    z.object({
      name: z.string(),
      qty: z.number(),
      size: z.string().optional(),
      price: z.number(),
      subtotal: z.number(),
      product: z.string(),
      imageUrl: z.string(),
    })
  ),
});
export type Order = z.infer<typeof Order>;
const orderSchema = new Schema<Order>({
  user: {
    type: String,
    ref: "mobile_users",
    required: true,
  },
  products: [
    {
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
      imageUrl: {
        type: String,
        required: true,
      },
      product: {
        type: String,
        required: true,
      },
    },
  ],
  delivery_fee: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  payment_method: {
    type: String,
    required: true,
  },
});
export const orderModel = mongoose.model<Order>("orders", orderSchema);
