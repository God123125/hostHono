import * as z from "zod";
import mongoose, { Schema } from "mongoose";
export const storeDoc = z.object({
  store_id: z.string(),
  image: z.object({
    filename: z.string(),
    mimetype: z.string(),
    data: z.any(), // Buffer
    length: z.number(),
  }),
});
export type storeDoc = z.infer<typeof storeDoc>;
const storeDocSchema = new Schema<storeDoc>({
  store_id: {
    type: String,
    required: true,
  },
  image: {
    filename: String,
    mimetype: String,
    data: Buffer,
    length: Number,
  },
});
export default mongoose.model<storeDoc>("store_docs", storeDocSchema);
