import mongoose, { Schema } from "mongoose";
import * as z from "zod";
export const Chat = z.object({
  senderId: z.string(),
  receiverId: z.string(),
  message: z.string(),
});
export type Chat = z.infer<typeof Chat>;
const chatSchema = new Schema<Chat>(
  {
    senderId: {
      type: String,
      required: true,
    },
    receiverId: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);
export const chatModel = mongoose.model<Chat>("chats", chatSchema);
