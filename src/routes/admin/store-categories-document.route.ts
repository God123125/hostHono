import { Hono } from "hono";
import { storeCateDocController } from "../../services/admin/store-categories-document.service.js";
const routes = new Hono();
routes.post("/:cateId", storeCateDocController.create);
routes.get("/:cateId", storeCateDocController.getByStoreCateId);
routes.patch("/:cateId", storeCateDocController.update);
routes.delete("/:cateId", storeCateDocController.delete);
export default routes;
