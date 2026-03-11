import { Hono } from "hono";
import { favoriteItemController } from "../../services/mobile/favorite-item.service.js";
import { verifyToken } from "../../middleware/authMiddleware.js";
const routes = new Hono();
routes.get("/", verifyToken, favoriteItemController.getMany);
routes.post("/", verifyToken, favoriteItemController.create);
routes.delete("/:id", verifyToken, favoriteItemController.delete);
export default routes;
