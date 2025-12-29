import { Router } from "express";
import { createValidator } from "express-joi-validation";
import products from "../controllers/products.controller.js";
import { listQuerySchema } from "../services/common.js";

const router = Router();
const validator = createValidator({
  passError: true,
  joi: { abortEarly: true },
});

/**
 * ********************** Category **********************
 */

router
  .route("/products/create")
  .post(
    validator.body(products.createProductBodySchema),
    products.createProduct
  );

router
  .route("/products/:productId")
  .patch(
    validator.params(products.productParamSchema),
    validator.body(products.updateProductBodySchema),
    products.updateProduct
  );

router
  .route("/products")
  .get(validator.query(listQuerySchema), products.getProducts);

export default router;
