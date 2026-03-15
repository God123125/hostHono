import { Hono } from "hono";
import { storeCategoryController } from "../../services/admin/store_categories.service.js";
const routes = new Hono();
routes.get("/", storeCategoryController.getMany);
routes.get("/search", storeCategoryController.search);
routes.get("/overall", storeCategoryController.getOverallStats);
routes.get(
  "/overall-dashboard",
  storeCategoryController.countStoreForDashboard,
);
routes.post("/", storeCategoryController.create);
routes.patch("/update-info/:id", storeCategoryController.updateInfo);
routes.patch("/update-image/:id", storeCategoryController.updateImg);
routes.get("/img/:id", storeCategoryController.getImage);
routes.delete("/:id", storeCategoryController.delete);
routes.get("/:id", storeCategoryController.getById);
export default routes;
