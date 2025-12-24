import mongoose, { Schema, Types } from "mongoose";
import * as z from "zod";
export const Store = z.object({
  name: z.string(),
  owner_name: z.string(),
  gender: z.string(),
  email: z.email(),
  phone: z.string(),
  user: z.string(),
  store_type: z.string(),
  isActive: z.boolean(),
  store_img: z.object({
    filename: z.string(),
    mimetype: z.string(),
    data: z.any(), // Buffer
    length: z.number(),
  }),
});
export type Store = z.infer<typeof Store>;
const storeSchema = new Schema<Store>({
  name: {
    type: String,
    required: true,
  },
  owner_name: {
    type: String,
    required: true,
  },
  gender: {
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
  store_type: {
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
  user: {
    type: String,
    ref: "admin_users",
    required: true,
  },
});
export default mongoose.model<Store>("stores", storeSchema);
