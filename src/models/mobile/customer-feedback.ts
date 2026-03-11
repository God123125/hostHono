import mongoose, { Schema } from "mongoose";
import * as z from "zod";
export const feedback = z.object({
  star: z.number(),
  description: z.string(),
  user: z.string(),
  store: z.string(),
  img_feedback: z.object({
    filename: z.string(),
    mimetype: z.string(),
    data: z.any(), // Buffer
    length: z.number(),
  }),
});
export type feedback = z.infer<typeof feedback>;
const feedbackSchema = new Schema<feedback>(
  {
    star: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    user: {
      type: String,
      ref: "admins",
      required: true,
    },
    store: {
      type: String,
      ref: "stores",
      required: true,
    },
    img_feedback: {
      filename: String,
      mimetype: String,
      data: Buffer,
      length: Number,
    },
  },
  { timestamps: true },
);
export const feedbackModel = mongoose.model<feedback>(
  "customer_feedbacks",
  feedbackSchema,
);
