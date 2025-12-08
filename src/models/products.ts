import mongoose, { Schema } from "mongoose";
import * as z from "zod";
export const Product = z.object({
  name: z.string(),
  price: z.number(),
  description: z.string(),
  category: z.string(),
  qty: z.number(),
  image: z.string(),
  status: z.boolean(),
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
      required: true,
    },
    category: {
      type: String,
      ref: "categories",
      required: true,
    },
    qty: {
      type: Number,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    status: {
      type: Boolean,
      required: true,
    },
  },
  { timestamps: true }
);
export default mongoose.model("products", productSchema);
