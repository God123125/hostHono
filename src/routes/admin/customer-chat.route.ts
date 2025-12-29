import { Hono } from "hono";
import { chatController } from "../../services/admin/customer-chat.service.js";
const routes = new Hono();
routes.get("/ws", chatController.upgradeSocket);
routes.get("/chat/:user1/:user2", chatController.getMessage);
routes.post("/chat", chatController.chat);
export default routes;
