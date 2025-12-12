import mongoose, { Schema } from "mongoose";
import * as z from "zod";
export const adminUser = z.object({
  username: z.string().optional(),
  email: z.string(),
  password: z.string().min(8).max(15),
  role: z.string(),
});
export type adminUser = z.infer<typeof adminUser>;
const adminUserSchema = new Schema<adminUser>(
  {
    username: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);
export default mongoose.model<adminUser>("admin_users", adminUserSchema);
