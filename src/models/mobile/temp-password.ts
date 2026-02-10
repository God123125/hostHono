import mongoose, { Schema } from "mongoose";
import * as z from "zod";
import { required } from "zod/mini";
export const tempPass = z.object({
  code: z.number(),
  email: z.string(),
});
export type tempPass = z.infer<typeof tempPass>;
const tempPassSchema = new Schema<tempPass>({
  code: {
    type: Number,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
});
export default mongoose.model<tempPass>("temp_password", tempPassSchema);
