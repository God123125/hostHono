import { Hono } from "hono";
import { mobileUserController } from "../../services/mobile/mobile-user.service.js";
import { verifyToken } from "../../middleware/authMiddleware.js";
import { mobileUser } from "../../models/mobile/mobile-user.js";
const routes = new Hono();
routes.get("/", mobileUserController.getUsers);
routes.get("/personal-info", verifyToken, mobileUserController.getById);
routes.get("/profile/:id", mobileUserController.getUserProfile);
routes.post("/register", mobileUserController.requestRegister);
routes.post("/verify", mobileUserController.verifyRegister);
routes.post("/resend-code", mobileUserController.resendCode);
routes.post("/login", mobileUserController.login);
routes.patch("/update-password", mobileUserController.updatePassword);
routes.post("/request-to-email", mobileUserController.requestUpdateToEmail);
routes.patch("/verify-code", mobileUserController.verifyUpdatePassword);
routes.patch(
  "/update-account",
  verifyToken,
  mobileUserController.updateAccount,
);
routes.patch(
  "/update-profile",
  verifyToken,
  mobileUserController.updateProfile,
);
routes.delete("/:id", mobileUserController.delete);
export default routes;
