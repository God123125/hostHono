import { Hono } from "hono";
import { adminController } from "../../services/admin/merchant.service.js";
import { verifyToken } from "../../middleware/authMiddleware.js";
const routes = new Hono();
routes.get("/", adminController.getMany);
routes.get("/display", adminController.getManyUserForDisplay); // to display in merchant table
routes.get("/search", adminController.search);
routes.get("/get-detail", verifyToken, adminController.getAdminDetail);
routes.get("/order-info", verifyToken, adminController.getOrderInfo);
routes.get("/overall-stats", adminController.getMerchantOverallStats);
routes.get("/overall", adminController.getOverallStats); // for display stat cards on front-end admin
routes.get("/commissions", adminController.getCommissions);
routes.post("/", adminController.createMerchant);
routes.post("/login", adminController.login);
routes.get("/order-detail/:id", adminController.getDetailOrderInfo);
routes.patch("/update-info/:id", adminController.updateAccountInfo);
routes.patch("/update-profile/:id", adminController.updateProfile);
routes.patch("/update-password/:id", adminController.updatePassword);
routes.patch("/update-commissions/:id", adminController.updateComission);
routes.delete("/:id", adminController.delete);
routes.get("/profile/:id", adminController.getProfile);
routes.get("/:id", adminController.getById);
export const adminRoute = routes;
