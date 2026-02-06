import * as z from "zod";
import mongoose, { Schema } from "mongoose";
export const storeCategory = z.object({
  storeCategory_Id: z.string(),
  image: z.object({
    filename: z.string(),
    mimetype: z.string(),
    data: z.any(), // Buffer
    length: z.number(),
  }),
});
export type storeCategory = z.infer<typeof storeCategory>;
const storeCategoryDocSchema = new Schema<storeCategory>({
  storeCategory_Id: {
    type: String,
    required: true,
  },
  image: {
    filename: String,
    mimetype: String,
    data: Buffer, // Buffer
    length: Number,
  },
});
export default mongoose.model<storeCategory>(
  "storeCate_docs",
  storeCategoryDocSchema,
);
