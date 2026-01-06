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
    const { user } = c.req.param();
    const currentUser = c.get("user");
    const currentUserId = currentUser?._id || currentUser?.id || currentUser;

    if (!user || !currentUserId) {
      return c.json({ error: "Missing parameters or unauthenticated" }, 400);
    }

    // Determine who is who
    // We assume the 'user' param is the OTHER party (the customer)

    const messages = await chatModel
      .find({
        $or: [
          { senderId: currentUserId, receiverId: user },
          { senderId: user, receiverId: currentUserId }, // user here is the customerId
        ],
      })
      .sort({ createdAt: 1 })
      .populate("senderId") // This will populate only if the ID exists in mobile_users collection
      .populate("receiverId")
      .lean();

    const formattedMessages = messages.map((msg: any) => {
      // Check if senderId was populated. If it's a string, it wasn't populated (likely Admin).
      // If it's an object, it was populated (Customer).
      const isSenderAdmin = typeof msg.senderId === 'string' || msg.senderId._id?.toString() === currentUserId;

      return {
        ...msg,
        // Explicitly tell frontend who sent/received
        senderType: isSenderAdmin ? "admin" : "user",
        isOwner: msg.senderId?._id?.toString() === currentUserId || msg.senderId === currentUserId,
        // If population failed (admin), we might want to manually set a "name" or keep it as ID
        // "populate it except admin" -> satisfied because mobile_users ref won't find admin.
      };
    });

    return c.json({
      list: formattedMessages,
    });
  },

  getUserList: async (c: Context) => {
    const currentUser = c.get("user");
    const currentUserId = currentUser?._id || currentUser?.id || currentUser;

    if (!currentUserId) {
      return c.json({ error: "Unauthenticated" }, 401);
    }

    // Aggregate to find unique users interacting with this admin
    const users = await chatModel.aggregate([
      {
        $match: {
          $or: [{ senderId: currentUserId }, { receiverId: currentUserId }]
        }
      },
      {
        $group: {
          _id: null,
          senders: { $addToSet: "$senderId" },
          receivers: { $addToSet: "$receiverId" }
        }
      },
      {
        $project: {
          // Merge both arrays to get all unique IDs encountered
          allUsers: { $setUnion: ["$senders", "$receivers"] }
        }
      }
    ]);

    if (!users.length || !users[0].allUsers) return c.json({ list: [] });

    // Filter out the current user (admin) to get only the customers
    const uniqueUserIds = users[0].allUsers.filter((id: string) => id.toString() !== currentUserId.toString());

    // Fetch user details for these customers
    const userDetails = await mobileUserModel.find({
      _id: { $in: uniqueUserIds }
    });

    return c.json({
      list: userDetails
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
