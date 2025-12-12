export const PORT = parseInt(process.env.PORT ?? "3000");
export const HOST = process.env.HOST ?? "0.0.0.0";

export const ACCESS_TOKEN_EXPIRE_IN_MS =
  1000 * 60 * parseInt(process.env.JWT_EXPIRY as string);
export const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export const MYSQL_HOST = process.env.MYSQL_HOST as string;
export const MYSQL_PORT = parseInt(process.env.MYSQL_PORT ?? "3306");
export const MYSQL_DATABASE = process.env.MYSQL_DATABASE as string;
export const MYSQL_USER = process.env.MYSQL_USER as string;
export const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD as string;
export const IS_PROD = process.env.NODE_ENV === "production";

export const corsOrigin = process.env.CORS_DOMAIN?.split(",") || [];
export const NAME = process.env.NAME ?? "E-Commerce";
export const ENV = process.env.NODE_ENV as string;
export const ENDPOINT = process.env.ENDPOINT ?? "http://localhost:3000";

export const RateLimiterDuration = parseInt(
  process.env.RateLimiterDuration ?? "500"
);
export const RateLimiterPoints = parseInt(process.env.RateLimiterPoints ?? "5");

export const ERR_MSG = {
  ise: "something went wrong at server. please report this issue",
  notFound: "route not found",
  rateLimiter: "Too many requests, please try again later",
  validation: "validation failed",
  invalidPassword: "password validation failed",
  invalidCurrentPassword: "current password validation failed",
  currentPassNotMatched: "current password not matched",
  invalidNextPassword: "next password validation failed",
  userAlreadyExist: "user already exist",
  userNotExist: "user not exist",
  invalidCredential: "invalid credential",
  userDisabled: "user is disabled",
  forbidden: "not allowed",
  missingToken: "authorization header is missing",
  invalidAction: "invalid session token action",
  msgString: "message must be string",
  msgNull: "message must be string",
  preCondition: "some condition failed at backend level",
  conflict: "already exist",
  notImplemented: "functionality not implemented",
  emailAlreadyExist: "email already exist",
  mobileAlreadyExist: "mobile already exist",
  sessionExpired: "Session Expired",
  otpExpired: "Otp Expired",
};

export const SMTP_HOST = process.env.SMTP_HOST as string;
export const SMTP_SECURE = process.env.SMTP_SECURE === "true";
export const SMTP_PORT = parseInt(process.env.SMTP_PORT ?? "");
export const SMTP_FROM = process.env.SMTP_FROM as string;
export const SMTP_REPLY_TO = process.env.SMTP_REPLY_TO as string;
export const SMTP_USER = process.env.SMTP_USER as string;
export const SMTP_PASS = process.env.SMTP_PASS as string;
