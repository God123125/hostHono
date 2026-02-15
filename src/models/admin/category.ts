import mongoose, { Schema } from "mongoose";
import * as z from "zod";
export const Category = z.object({
  name: z.string(),
  desc: z.string(),
  isActive: z.boolean(),
});
export type Category = z.infer<typeof Category>;
const categorySchema = new Schema<Category>(
  {
    name: {
      type: String,
      required: true,
    },
    desc: {
      type: String,
    },
    isActive: {
      type: Boolean,
    },
  },
  { timestamps: true },
);
export default mongoose.model("categories", categorySchema);
