// import { Router } from "express";
// import { createValidator } from "express-joi-validation";
// import productReview from "../controllers/products.reviews.controller.js";
// import { listQuerySchema } from "../services/common.js";

// const router = Router();
// const validator = createValidator({
//   passError: true,
//   joi: { abortEarly: true },
// });

// router
//   .route("/products/reviews/create")
//   .post(
//     validator.body(productReview.createReviewBodySchema),
//     productReview.createReview
//   );

// router
//   .route("/products/reviews/:reviewId")
//   .patch(
//     validator.params(productReview.reviewParamSchema),
//     validator.body(productReview.updateReviewBodySchema),
//     productReview.updateReview
//   );


//   router
//     .route("/reviews")
//     .get(validator.query(listQuerySchema), productReview.getReviews);

// export default router;
