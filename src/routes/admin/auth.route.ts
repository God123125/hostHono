import { Hono } from "hono";
import { authController } from "../../services/admin/auth.service.js";

const routes = new Hono();

routes.post("/login", authController.login);
routes.get("/me", authController.me);

export default routes;
