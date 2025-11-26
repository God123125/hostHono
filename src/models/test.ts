import mongoose, { Schema } from "mongoose";
import * as z from "zod";
export const Category = z.object({
  category: z.string(),
  desc: z.string(),
  status: z.boolean(),
});
const categorySchema = new Schema(
  {
    category: {
      type: String,
      required: true,
    },
    desc: {
      type: String,
    },
    status: {
      type: Boolean,
    },
  },
  { timestamps: true }
);
export default mongoose.model("categories", categorySchema);
