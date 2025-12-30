/* eslint-disable @typescript-eslint/no-misused-promises */
import { Router } from "express";
import { createValidator } from "express-joi-validation";
import account from "../controllers/account.controller.js";
// import {
//   isAuth,
//   isAdmin,
//   isSuperAdmin,
//   isAdminOrSuperAdmin,
// } from "../middlewares/auth.js";
// import { singleQuerySchema } from "../services/reports.js";

const router = Router();
const validator = createValidator({
  passError: true, // Ensures errors are passed to the next middleware
  joi: { abortEarly: true }, // Stops after the first error is found
});

/**
 * ********************** Accounts **********************
 */

router
  .route("/accounts")
  .post(validator.body(account.signupJoiSchema), account.signUpAccount);
//   .patch(validator.body(account.updateAccountBodySchema), account.updateAccount)
//   .get(isAuth, validator.query(singleQuerySchema), account.whoami);

router.post("/accounts/continue-with-google", account.continueWithGoogle);

export default router;
