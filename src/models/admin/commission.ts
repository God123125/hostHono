import mongoose, { Schema } from "mongoose";
import * as z from "zod";
export const Commision = z.object({
  merchant: z.string(),
  amount: z.number(),
  rate: z.number(),
  status: z.string(),
});
export type Commision = z.infer<typeof Commision>;
const commissionSchema = new Schema<Commision>(
  {
    merchant: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    rate: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);
export const commissionModel = mongoose.model<Commision>(
  "commission",
  commissionSchema,
);
