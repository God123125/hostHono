import mongoose, { Schema } from "mongoose";
import * as z from "zod";
export const storeCategory = z.object({
  name: z.string(),
  des: z.string(),
  image: z.object({
    filename: z.string(),
    mimetype: z.string(),
    data: z.any(), // Buffer
    length: z.number(),
  }),
});
export type storeCategory = z.infer<typeof storeCategory>;
const storeCategorySchema = new Schema<storeCategory>(
  {
    name: {
      type: String,
      required: true,
    },
    des: {
      type: String,
      required: true,
    },
    image: {
      filename: String,
      mimetype: String,
      data: Buffer,
      length: Number,
    },
  },
  { timestamps: true },
);
export const storeCategoryModel = mongoose.model<storeCategory>(
  "store_categories",
  storeCategorySchema,
);
