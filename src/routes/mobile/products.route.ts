import { Hono } from "hono";
import productController from "../../services/admin/products.service.js";
const routes = new Hono();
routes.get("/", productController.getManyForMobile);
export default routes;
