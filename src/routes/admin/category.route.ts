import { Hono } from "hono";
import categoryController from "../../services/admin/category.service.js";
const routes = new Hono();
routes.get("/", categoryController.get);
routes.post("/", categoryController.create);
routes.get("/:id", categoryController.getById);
routes.patch("/:id", categoryController.update);
routes.delete("/:id", categoryController.delete);
export default routes;
