import { Hono } from "hono";
import storeController from "../../services/admin/store.service.js";
const routes = new Hono();
routes.get("/", storeController.getMany);
routes.post("/", storeController.create);
routes.get("/:id", storeController.getById);
routes.patch("/:id", storeController.update);
routes.delete("/:id", storeController.delete);
export default routes;
