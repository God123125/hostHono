import * as z from "zod";
import mongoose, { Schema } from "mongoose";
export const productDoc = z.object({
  product_id: z.string(),
  image: z.object({
    filename: z.string(),
    mimetype: z.string(),
    data: z.any(), // Buffer
    length: z.number(),
  }),
});
export type productDoc = z.infer<typeof productDoc>;
const productDocumentSchema = new Schema<productDoc>({
  product_id: {
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
export default mongoose.model<productDoc>(
  "product_docs",
  productDocumentSchema,
);
