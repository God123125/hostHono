// routes/admin/customer-chat.ts
import { Hono } from "hono";
import { chatController } from "../../services/admin/customer-chat.service.js";

// Export a function that receives upgradeWebSocket
export default (upgradeWebSocket: any) => {
  const routes = new Hono();

  routes.get("/ws", chatController.upgradeSocket(upgradeWebSocket));

  // Protect API routes
  routes.get("/users/:user", chatController.getUserList);
  routes.get("/conversation/:user1/:user2", chatController.getConversation);
  routes.post("/chat", chatController.chat);

  return routes;
};
