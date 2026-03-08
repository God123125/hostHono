import mongoose from "mongoose";
import * as z from "zod";
import userModel from "./users.js";
export const Merchant = z.object({
  fullname: z.string(),
  username: z.string(),
  email: z.string(),
  phone: z.string(),
  address: z.string(),
  password: z.string(),
  isActive: z.boolean(),
  profile: z.string(),
  role: z.string(),
  commission_rate: z.number(),
});
export type Merchant = z.infer<typeof Merchant>;
// Reuse the single `users` model to avoid Mongoose OverwriteModelError.
export const merchantModel = userModel;
