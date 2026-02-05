import { Hono } from "hono";
import { productDocController } from "../../services/admin/product-document.service.js";
const route = new Hono();
route.post("/:proId", productDocController.create);
route.get("/:proId", productDocController.getByProductId);
route.delete("/:proId", productDocController.delete);
route.patch("/:proId", productDocController.update);
export default route;
