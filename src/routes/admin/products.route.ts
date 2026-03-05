import { Hono } from "hono";
import productController from "../../services/admin/products.service.js";
import { verifyToken } from "../../middleware/authMiddleware.js";
const routes = new Hono();
// routes.use("*", verifyToken);
routes.get("/", verifyToken, productController.getMany);
routes.get(
  "/grouped",
  verifyToken,
  productController.getProductsGroupedByCategory,
);
routes.get("/mobile-products", productController.getMany); // for mobile app
routes.post("/", verifyToken, productController.create);
routes.patch("/update-info/:id", verifyToken, productController.updateInfo);
routes.patch("/update-image/:id", verifyToken, productController.updateImage);
routes.delete("/:id", verifyToken, productController.delete);
routes.get("/img/:id", productController.getImage);
routes.get("/:id", verifyToken, productController.getById);
export default routes;
