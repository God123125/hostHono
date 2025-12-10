import dotenv from "dotenv";
dotenv.config();
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import testRoutes from "./routes/test.route.js";
import { logger } from "hono/logger";
import "./db/db.js";
import { cors } from "hono/cors";
import honoRoutes from "./routes/routers.js";
const app = new Hono();
const PORT = process.env.PORT || 3000;
app.use("*", logger());
app.use("*", cors());
app.get("/", (c) => {
  return c.text("hello from Hono");
});
app.route("/test", testRoutes);
app.route("/api", honoRoutes);
serve(
  {
    fetch: app.fetch,
    port: PORT as number,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
