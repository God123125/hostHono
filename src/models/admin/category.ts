import mongoose, { Schema } from "mongoose";
import * as z from "zod";
export const Category = z.object({
  name: z.string(),
  description: z.string(),
  isActive: z.boolean(),
  store_id: z.any(),
});
export type Category = z.infer<typeof Category>;
const categorySchema = new Schema<Category>(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    isActive: {
      type: Boolean,
    },
    store_id: {
      type: mongoose.Types.ObjectId,
    },
  },
  { timestamps: true },
);
export default mongoose.model("categories", categorySchema);
