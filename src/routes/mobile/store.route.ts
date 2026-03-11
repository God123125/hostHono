import { Hono } from "hono";
import storeController from "../../services/admin/stores.service.js";
const routes = new Hono();
routes.get("/", storeController.getManyForMobile);
export default routes;
