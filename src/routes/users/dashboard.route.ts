import { Hono } from "hono";
import { dashboardController } from "../../services/users/dashboard.service.js";
const routes = new Hono();
routes.get("/mostOrderedUsers", dashboardController.getMostOrderUser);
routes.get("/highIncomeAdmin", dashboardController.getHighIncomeAdmin);
routes.get("/getRecentOrders", dashboardController.getRecentOrders);
export default routes;
