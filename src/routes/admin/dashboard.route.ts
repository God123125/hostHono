import { Hono } from "hono";
import { dashboardController } from "../../services/admin/dashboard.service.js";
const routes = new Hono();
routes.get("/mostOrderedUsers", dashboardController.getMostOrderUser);
routes.get("/highIncomeAdmin", dashboardController.getHighIncomeAdmin);
routes.get("/getRecentOrder", dashboardController.getRecentOrders);
export default routes;
