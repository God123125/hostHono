import mongoose, { Schema } from "mongoose";
import * as z from "zod";
export const Product = z.object({
  name: z.string(),
  price: z.number(),
  description: z.string().optional(),
  category: z.string(),
  qty: z.number().optional(),
  image: z.object({
    filename: z.string(),
    mimetype: z.string(),
    data: z.any(), // Buffer
    length: z.number(),
  }),
  isActive: z.boolean(),
  discount: z.number(),
  totalPrice: z.number(),
  store: z.string(),
  image_url: z.string().optional(),
});
export type Product = z.infer<typeof Product>;
const productSchema = new Schema<Product>(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
    },
    category: {
      type: String,
      ref: "categories",
      required: true,
    },
    qty: {
      type: Number,
    },
    image: {
      filename: String,
      mimetype: String,
      data: Buffer,
      length: Number,
    },
    isActive: {
      type: Boolean,
      required: true,
    },
    discount: {
      type: Number,
      required: false,
    },
    totalPrice: {
      type: Number,
    },
    store: {
      type: String,
      ref: "stores",
      required: true,
    },
    image_url: {
      type: String,
    },
  },
  { timestamps: true }
);
export default mongoose.model("products", productSchema);
