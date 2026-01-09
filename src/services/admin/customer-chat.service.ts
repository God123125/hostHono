import type { Context } from "hono";
import { chatModel } from "../../models/admin/customer-chat.js";
import { mobileUserModel } from "../../models/mobile/mobile-user.js";
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
  getConversation: async (c: Context) => {
    const { user1, user2 } = c.req.param();
    // const currentUser = c.get("user");
    const messages = await chatModel
      .find({
        $or: [
          { senderId: user1, receiverId: user2 },
          { senderId: user2, receiverId: user1 },
        ],
      })
      .sort({ createdAt: 1 })
      .lean();
    const formattedChat = messages.map((el) => ({
      ...el,
      isInbox: el.senderId == user1,
    }));

    return c.json({
      list: formattedChat,
    });
  },

  getUserList: async (c: Context) => {
    const { user } = c.req.param();

    const mobile_users = await mobileUserModel.find().lean();
    const mobileUserIds = new Set(
      mobile_users.map((u: any) => u._id.toString())
    );

    const messages = await chatModel
      .find({
        $or: [{ senderId: user }, { receiverId: user }],
      })
      .populate("senderId")
      .populate("receiverId")
      .sort({ timestamp: -1 })
      .lean();

    const userMap = new Map();

    messages.forEach((msg: any) => {
      // Skip if either sender or receiver is null (not populated)
      if (!msg.senderId || !msg.receiverId) {
        return;
      }

      const receiverId = msg.receiverId._id.toString();
      const senderId = msg.senderId._id.toString();

      const isReceiver = receiverId === user;
      const partner = isReceiver ? msg.senderId : msg.receiverId;
      const partnerId = isReceiver ? senderId : receiverId;

      // Only include if partner is in mobile_users
      if (!mobileUserIds.has(partnerId)) {
        return;
      }

      if (!userMap.has(partnerId)) {
        userMap.set(partnerId, {
          userId: partner._id,
          username: partner.username,
          email: partner.email,
          profile: partner.profile,
          lastMessage: msg.message,
          lastMessageTime: msg.timestamp,
          read: msg.read,
          unreadCount: 0,
        });
      }

      if (isReceiver && !msg.read) {
        const existingData = userMap.get(partnerId);
        if (existingData) {
          existingData.unreadCount++;
        }
      }
    });

    const userList = Array.from(userMap.values());

    return c.json({
      list: userList,
    });
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
