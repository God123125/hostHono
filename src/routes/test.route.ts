import { Hono } from "hono";
import testService from "../services/test.service.js";
const routes = new Hono();
routes.get("/:id", testService.get);
export default routes;
