import { Hono } from "hono";
import { dashboardController } from "../../services/super-admin/dashboard.service.js";
const routes = new Hono();
routes.get("/mostOrderedUsers", dashboardController.getMostOrderUser);
routes.get("/highIncomeAdmin", dashboardController.getHighIncomeAdmin);
routes.get("/getRecentOrders", dashboardController.getRecentOrders);
export default routes;
