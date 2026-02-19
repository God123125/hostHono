import { Hono } from "hono";
import { dashboardController } from "../../services/admin/dashboard.service.js";
const route = new Hono();
route.get("/mostOrderedUsers", dashboardController.getMostOrderUser);
export default route;
