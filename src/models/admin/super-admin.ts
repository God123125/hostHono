import mongoose, { Schema } from "mongoose";
import * as z from "zod";
export const superAdmin = z.object({
  fullName: z.string(),
  username: z.string(),
  email: z.string(),
  phone: z.string(),
  address: z.string(),
  password: z.string(),
  isActive: z.boolean(),
  profile: z
    .object({
      filename: z.string(),
      mimetype: z.string(),
      data: z.any(),
      length: z.number(),
    })
    .optional(),
  role: z.string(),
  commission_rate: z.number(),
});
export type superAdmin = z.infer<typeof superAdmin>;
const superAdminSchema = new Schema<superAdmin>(
  {
    fullName: {
      type: String,
    },
    username: {
      type: String,
      required: false,
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
      filename: String,
      mimetype: String,
      data: Buffer,
      length: Number,
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
  },
  { timestamps: true },
);
export default mongoose.model<superAdmin>("super_admins", superAdminSchema);
