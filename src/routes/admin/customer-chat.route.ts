// routes/admin/customer-chat.ts
import { Hono } from "hono";
import { chatController } from "../../services/admin/customer-chat.service.js";
import { verifyToken } from "../../middleware/authMiddleware.js";

// Export a function that receives upgradeWebSocket
export default (upgradeWebSocket: any) => {
  const routes = new Hono();

  routes.get("/ws", chatController.upgradeSocket(upgradeWebSocket));

  // Protect API routes
  routes.get("/users", verifyToken, chatController.getUserList);
  routes.get("/conversation/:user", verifyToken, chatController.getConversation);
  routes.post("/chat", verifyToken, chatController.chat);

  return routes;
};
