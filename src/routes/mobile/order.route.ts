import { Hono } from "hono";
import { orderController } from "../../services/mobile/order.service.js";
import { verifyToken } from "../../middleware/authMiddleware.js";
const routes = new Hono();
routes.use("*", verifyToken);
routes.get("/", orderController.getList); // get all order basically it is used for admin side
routes.get("/order-pending", orderController.getOrder); // view order that is on process
routes.post("/checkout", orderController.checkOut); // check out when user decide to buy
// routes.patch("/order/:id", orderController.order);
routes.patch("/end-order/:id", orderController.endOrder); // when user confirm order update status
routes.delete("/:id", orderController.deleteOrder);
export default routes;
