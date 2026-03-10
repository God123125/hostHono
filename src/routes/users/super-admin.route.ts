import { Hono } from "hono";
import { superAdminController } from "../../services/users/super-admin.service.js";
const routes = new Hono();
routes.get("/", superAdminController.getUsers);
routes.get("/search", superAdminController.search);
routes.post("/", superAdminController.create);
routes.get("/profile/:id", superAdminController.getUserProfile);
routes.patch("/update-info/:id", superAdminController.updateAccountInfo);
routes.patch("/update-profile/:id", superAdminController.updateProfile);
routes.delete("/:id", superAdminController.delete);
routes.get("/:id", superAdminController.getById);
routes.patch("/update-password", superAdminController.updatePassword);

export default routes;
