import { Hono } from "hono";
import { dashboardController } from "../../services/admin/dashboard.service.js";
import { verifyToken } from "../../middleware/authMiddleware.js";
const routes = new Hono();
routes.get("/mostOrderedUsers", dashboardController.getMostOrderUser);
routes.get("/highIncomeAdmin", dashboardController.getHighIncomeAdmin);
routes.get("/getRecentOrders", dashboardController.getRecentOrders);
routes.get(
  "/overAllStatsForAdmin",
  dashboardController.getOverallStatsForAdminDashboard,
);
routes.get(
  "/each-store-product",
  dashboardController.getOverallStatForAdminBarChart,
);
routes.get(
  "/each-category-product",
  verifyToken,
  dashboardController.getOverallStatForMerchantBarChart,
);
routes.get(
  "overAllStatsForMerchant",
  dashboardController.getOverallStatForMerchantStatCard,
);
export default routes;
