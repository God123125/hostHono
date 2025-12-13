import mongoose, { Schema } from "mongoose";
import * as z from "zod";
export const Store = z.object({
  name: z.string(),
  owner_name: z.string(),
  gender: z.string(),
  email: z.email(),
  phone: z.string(),
  user: z.string(),
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
  user: {
    type: String,
    ref: "admin_users",
    required: true,
  },
});
export default mongoose.model<Store>("stores", storeSchema);
