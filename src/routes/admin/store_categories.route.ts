import { Hono } from "hono";
import { storeCategoryController } from "../../services/admin/store_categories.service.js";
const routes = new Hono();
routes.get("/", storeCategoryController.getMany);
routes.post("/", storeCategoryController.create);
routes.patch("/:id", storeCategoryController.update);
routes.get("/:id", storeCategoryController.getById);
export default routes;
