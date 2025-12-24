import { Hono } from "hono";
import feedbackController from "../../services/mobile/customer-feedback.service.js";
const routes = new Hono();
routes.get("/", feedbackController.getMany);
routes.post("/", feedbackController.create);
routes.get("/:id", feedbackController.getById);
routes.delete("/:id", feedbackController.delete);
export default routes;
