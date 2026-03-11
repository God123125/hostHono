import { Hono } from "hono";
import categoryController from "../../services/admin/category.service.js";
const routes = new Hono();
routes.get("/", categoryController.getManyForMobile);
export default routes;
