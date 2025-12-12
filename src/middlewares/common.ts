import { type Request, type Response, type NextFunction } from "express";
import HttpStatus from "http-status";
import type ejv from "express-joi-validation";
import { errors } from "jose";
import { RateLimiterMemory } from "rate-limiter-flexible";
import rateLimit from "express-rate-limit";

import {
  ERR_MSG,
  RateLimiterDuration,
  RateLimiterPoints,
} from "../services/constant.js";

const ejvTypes = ["body", "query", "headers", "fields", "params"];
const rateLimiterMemory = new RateLimiterMemory({
  points: RateLimiterPoints,
  duration: RateLimiterDuration,
});

export function errorHandler(
  err: Error | ejv.ExpressJoiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (
    typeof err === "object" &&
    ejvTypes.includes((err as ejv.ExpressJoiError).type)
  ) {
    const { error, type }: ejv.ExpressJoiError = err as ejv.ExpressJoiError;

    if (type === "body" && error !== undefined) {
      const errorMessage = error.details
        .map((detail) => {
          const field = detail.path[detail.path.length - 1] as string;
          let msg = detail.message;
          if (msg.includes(field)) {
            msg = msg.split('" ')[1]; // Remove extra quotes
          }

          // **Find the array index dynamically**
          const arrayIndex = detail.path.find((p) => typeof p === "number");

          return arrayIndex !== undefined
            ? `At row ${arrayIndex + 1}, field "${field}": ${msg}`
            : `Field "${field}": ${msg}`;
        })
        .join("; ");

      res.status(HttpStatus.BAD_REQUEST).json({
        message: errorMessage || ERR_MSG.validation,
        error: type,
      });
      return;
    }

    res.status(HttpStatus.BAD_REQUEST).json({
      message: error?.message ?? ERR_MSG.validation,
      // error: type,
    });
    return;
  }

  if (
    err instanceof errors.JWSSignatureVerificationFailed ||
    err instanceof errors.JWSInvalid ||
    err instanceof errors.JWTInvalid ||
    err instanceof errors.JWTExpired ||
    err instanceof errors.JWTClaimValidationFailed
  ) {
    res
      .status(HttpStatus.UNAUTHORIZED)
      .json({ message: err.message, error: "jwt" });
    return;
  }

  // Log the full error including stack trace
  console.error("Full Error Details:", err);

  // Default to internal server error for unhandled cases
  res
    .status(HttpStatus.INTERNAL_SERVER_ERROR)
    .json({ message: (err as Error)?.message ?? ERR_MSG.ise });
  return;
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(HttpStatus.NOT_FOUND).json({ message: ERR_MSG.notFound }).end();
}

export async function rateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await rateLimiterMemory.consume(req.ip as string);
    next();
  } catch (_e) {
    res
      .status(HttpStatus.TOO_MANY_REQUESTS)
      .json({ message: ERR_MSG.rateLimiter });
  }
}

export const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute in milliseconds
  max: 500, // 100 requests per minute
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
