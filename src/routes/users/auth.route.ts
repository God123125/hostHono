import { Hono } from "hono";
import { authController } from "../../services/users/auth.service.js";

const routes = new Hono();

routes.post("/login", authController.login);
export default routes;
