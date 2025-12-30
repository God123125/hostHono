import type { Context } from "hono";
import { chatModel } from "../../models/admin/customer-chat.js";
const clients = new Map<string, WebSocket>();
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
        onOpen(event: any, ws: any) {
          const userId = c.req.query("id");

          // Store ws, not event - ws is the actual WebSocket connection
          clients.set(userId!, ws);
          console.log(userId, "connected");
          console.log("All connected clients:", Array.from(clients.keys()));
        },

        async onMessage(event: any, ws: any) {
          console.log("Raw message:", event.data);

          try {
            const data = JSON.parse(event.data);
            console.log("Parsed data:", data);

            const receiver = clients.get(data.to);

            if (receiver) {
              console.log("Receiver readyState:", receiver.readyState);
              console.log("WebSocket.OPEN constant:", WebSocket.OPEN); // Should be 1

              // Try sending without the readyState check first
              try {
                receiver.send(
                  JSON.stringify({ from: data.from, message: data.message })
                );
                console.log(`✓ Message sent from ${data.from} to ${data.to}`);
              } catch (sendError) {
                console.error("Error sending message:", sendError);
              }
            } else {
              console.log(`✗ Receiver ${data.to} not connected`);
            }
          } catch (err) {
            console.error("Invalid JSON:", event.data);
            return;
          }
        },

        onClose(ws: WebSocket) {
          clients.delete(userId!);
          console.log(userId, "disconnected");
        },
      };
    }),
};
