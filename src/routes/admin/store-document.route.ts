import { Hono } from "hono";
import { storeDocController } from "../../services/admin/stores-document.service.js";
const routes = new Hono();
routes.post("/:id", storeDocController.create);
routes.get("/:id", storeDocController.getByStoreId);
routes.patch("/:id", storeDocController.update);
routes.delete("/:id", storeDocController.delete);
export default routes;
