import { Hono } from "hono";
import testService from "../services/test.service.js";
const routes = new Hono();
routes.get("/", testService.get);
routes.post("/", testService.create);
export default routes;
