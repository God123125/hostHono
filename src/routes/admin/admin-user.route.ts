import { Hono } from "hono";
import { adminUserController } from "../../services/admin/admin-user.service.js";
const routes = new Hono();
routes.get("/", adminUserController.getUsers);
routes.post("/", adminUserController.create);
routes.get("/:id", adminUserController.getById);
routes.patch("/:id", adminUserController.update);
routes.delete("/:id", adminUserController.delete);
export default routes;
