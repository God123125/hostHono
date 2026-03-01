import mongoose, { Schema, Types } from "mongoose";
import * as z from "zod";
export const Store = z.object({
  name: z.string(),
  merchant: z.any(),
  store_category: z.string(),
  isActive: z.boolean(),
  store_img: z
    .object({
      filename: z.string(),
      mimetype: z.string(),
      data: z.any(), // Buffer
      length: z.number(),
    })
    .optional(),
});
export type Store = z.infer<typeof Store>;
const storeSchema = new Schema<Store>({
  name: {
    type: String,
    required: true,
  },
  store_category: {
    type: String,
    ref: "store_categories",
    required: true,
  },
  isActive: {
    type: Boolean,
  },
  store_img: {
    filename: String,
    mimetype: String,
    data: Buffer,
    length: Number,
  },
  merchant: {
    type: mongoose.Types.ObjectId,
    ref: "merchants",
    required: true,
  },
});
export const storeModel = mongoose.model<Store>("stores", storeSchema);
