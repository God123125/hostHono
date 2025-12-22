import mongoose, { Schema } from "mongoose";
import * as z from "zod";
export const Cart = z.object({
  name: z.string(),
  qty: z.number(),
  size: z.string().optional(),
});
