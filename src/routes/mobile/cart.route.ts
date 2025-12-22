import { Hono } from "hono";
import { cartController } from "../../services/mobile/cart.service.js";
const routes = new Hono();
routes.get("/", cartController.getMany);
routes.post("/", cartController.create);
routes.get("/:id", cartController.getById);
routes.patch("/:id", cartController.update);
routes.delete("/:id", cartController.delete);
export default routes;
