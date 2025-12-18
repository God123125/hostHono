import mongoose, { Schema } from "mongoose";
import * as z from "zod";
export const advertising = z.object({
  image: z.object({
    filename: z.string(),
    mimetype: z.string(),
    data: z.any(),
    length: z.number(),
  }),
  des: z.string(),
  isActive: z.boolean(),
});
export type advertising = z.infer<typeof advertising>;
const advertisingSchema = new Schema<advertising>(
  {
    image: {
      filename: String,
      mimetype: String,
      data: Buffer,
      length: Number,
    },
    des: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      required: true,
    },
  },
  { timestamps: true }
);
export default mongoose.model<advertising>("advertisings", advertisingSchema);
