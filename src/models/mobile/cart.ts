import mongoose, { Schema } from "mongoose";
import * as z from "zod";
export const Cart = z.object({
  name: z.string(),
  qty: z.number(),
  size: z.string().optional(),
  price: z.number(),
  total: z.number(),
  user: z.string().optional(),
  product: z.string(),
  store: z.string(),
  imageUrl: z.string(),
});
export type Cart = z.infer<typeof Cart>;
const cartSchema = new Schema<Cart>(
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
    total: {
      type: Number,
      required: true,
    },
    user: {
      type: String,
      ref: "mobile_users",
    },
    product: {
      type: String,
      ref: "products",
      required: true,
    },
    store: {
      type: String,
      ref: "stores",
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);
export const cartModel = mongoose.model<Cart>("carts", cartSchema);
