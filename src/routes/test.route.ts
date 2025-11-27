import { Hono } from "hono";
import testService from "../services/test.service.js";
const routes = new Hono();
routes.get("/", testService.get);
routes.post("/", testService.create);
routes.get("/:id", testService.getById);
routes.patch("/:id", testService.update);
routes.delete("/:id", testService.delete);
export default routes;
