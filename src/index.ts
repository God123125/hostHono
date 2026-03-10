import dotenv from "dotenv";
dotenv.config();
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import testRoutes from "./routes/test.route.js";
import { logger } from "hono/logger";
import { connectDatabase } from "./db/db.js";
import { cors } from "hono/cors";
import honoRoutes from "./routes/routers.js";
import { createNodeWebSocket } from "@hono/node-ws";
import chatRoute from "./routes/users/customer-chat.route.js";
const app = new Hono();
const PORT = process.env.PORT || 3000;
const { upgradeWebSocket, injectWebSocket } = createNodeWebSocket({ app });

app.use("*", logger());
app.use("*", cors());
// app.get(
//   "/ws",
//   upgradeWebSocket((c) => {
//     return {
//       onOpen: (evt, ws) => {
//         console.log("Connection opened");
//       },
//       onMessage: (event, ws) => {
//         console.log("Message:", event.data);
//         ws.send("Echo: " + event.data);
//       },
//     };
//   })
// );
app.get("/", (c) => {
  return c.text("hello from Hono");
});
app.route("/test", testRoutes);
app.route("/api", honoRoutes);
app.route("/api/chat", chatRoute(upgradeWebSocket));
async function start() {
  try {
    await connectDatabase();
  } catch (e) {
    console.error("Failed to connect to database. Server will still start, but DB operations will fail.", e);
  }

  const server = serve(
    {
      fetch: app.fetch,
      port: PORT as number,
    },
    (info) => {
      console.log(`Server is running on http://localhost:${info.port}`);
    },
  );
  injectWebSocket(server);
}

start().catch((e) => console.error("Startup error:", e));
