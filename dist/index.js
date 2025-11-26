import { serve } from "@hono/node-server";
import { Hono } from "hono";
import testRoutes from "./routes/test.route.js";
import { logger } from "hono/logger";
const app = new Hono();
const PORT = process.env.PORT || 3000;
app.use(logger());
app.route("/test", testRoutes);
serve({
    fetch: app.fetch,
    port: PORT,
}, (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
});
