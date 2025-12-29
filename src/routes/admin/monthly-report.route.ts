import { Hono } from "hono";
import { monthlyReport } from "../../services/admin/monthly-report.service.js";
const route = new Hono();
route.get("/", monthlyReport.monthlyReport);
export default route;
