import { Hono } from "hono";
import categoryRoute from "./category.route.js";
import productRoute from "./products.route.js";
const HonoRoutes = new Hono();
HonoRoutes.route("/categories", categoryRoute);
HonoRoutes.route("/products", productRoute);
export default HonoRoutes;
