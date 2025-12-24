import mongoose, { Schema } from "mongoose";
import * as z from "zod";
export const feedback = z.object({
  star: z.number(),
  desc: z.string(),
  user: z.string(),
  store: z.string(),
});
export type feedback = z.infer<typeof feedback>;
const feedbackSchema = new Schema<feedback>(
  {
    star: {
      type: Number,
      required: true,
    },
    desc: {
      type: String,
      required: true,
    },
    user: {
      type: String,
      ref: "mobile_users",
      required: true,
    },
    store: {
      type: String,
      ref: "stores",
      required: true,
    },
  },
  { timestamps: true }
);
export const feedbackModel = mongoose.model<feedback>(
  "customer_feedbacks",
  feedbackSchema
);
