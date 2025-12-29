import { Router } from "express";
import { createValidator } from "express-joi-validation";
import categories from "../controllers/categories.controller.js";
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
  .route("/categories/create")
  .post(
    validator.body(categories.createCategoryBodySchema),
    categories.createCategory
  );

router
  .route("/categories/:categoryId")
  .patch(
    validator.params(categories.categoryParamBody),
    validator.body(categories.updateCategoryBodySchema),
    categories.updateCategory
  );

router
  .route("/categories")
  .get(validator.query(listQuerySchema), categories.getCategories);

  export default router;