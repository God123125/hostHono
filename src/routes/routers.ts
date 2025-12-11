import { Hono } from "hono";
import categoryRoute from "./admin/category.route.js";
import productRoute from "./admin/products.route.js";
import mobileUserRoute from "./mobile/mobile-user.route.js";
const HonoRoutes = new Hono();
HonoRoutes.route("/categories", categoryRoute);
HonoRoutes.route("/products", productRoute);
HonoRoutes.route("/mobile-users", mobileUserRoute);
export default HonoRoutes;
