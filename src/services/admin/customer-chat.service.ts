import type { Context } from "hono";
import { chatModel } from "../../models/admin/customer-chat.js";
const clients = new Map();
export const chatController = {
  chat: async (c: Context) => {
    const body = await c.req.json();

    const msg = await chatModel.create({
      senderId: body.senderId,
      receiverId: body.receiverId,
      message: body.message,
    });

    return c.json(msg);
  },
  getMessage: async (c: Context) => {
    const { user1, user2 } = c.req.param();

    const messages = await chatModel
      .find({
        $or: [
          { senderId: user1, receiverId: user2 },
          { senderId: user2, receiverId: user1 },
        ],
      })
      .sort({ createdAt: 1 });

    return c.json(messages);
  },
  upgradeSocket: (upgradeWebSocket: any) =>
    upgradeWebSocket((c: Context) => {
      const userId = c.req.query("id");

      return {
        onOpen(ws: any) {
          clients.set(userId, ws);
          console.log(userId, "connected");
        },

        async onMessage(ws: any, message: any) {
          const data = JSON.parse(message.toString());

          const saved = await chatModel.create({
            senderId: data.from,
            receiverId: data.to,
            message: data.message,
          });

          const receiver = clients.get(data.to);
          if (receiver) receiver.send(JSON.stringify(saved));
        },

        onClose() {
          clients.delete(userId);
          console.log(userId, "disconnected");
        },
      };
    }),
};
