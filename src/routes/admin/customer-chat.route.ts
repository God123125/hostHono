// routes/admin/customer-chat.ts
import { Hono } from "hono";
import { chatController } from "../../services/admin/customer-chat.service.js";

// Export a function that receives upgradeWebSocket
export default (upgradeWebSocket: any) => {
  const routes = new Hono();

  routes.get("/ws", chatController.upgradeSocket(upgradeWebSocket));
  routes.get("/chat/:user", chatController.getMessage);
  routes.post("/chat", chatController.chat);
  return routes;
};
