import http from "node:http";
import path from "node:path";
import "dotenv/config";
import "reflect-metadata";
import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import bodyParser from "body-parser";
import morgan from "morgan";
import helmet from "helmet";

import { ENV, HOST, NAME, PORT } from "./services/constant.js";
import { MySQLDataSource } from "./data-source.js";
import { corsOptions } from "./services/cors.service.js";
import routes from "./routes/index.js";
import { errorHandler, rateLimiter } from "./middlewares/common.js";

import cookieParser from "cookie-parser";

const app = express();

app.disable("etag");
app.disable("x-powered-by");
app.enable("trust proxy");

// View engine setup
app.set("view engine", "ejs");

// Security Headers
app.use(helmet.hsts());
app.use(helmet.frameguard({ action: "sameorigin" }));
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      frameAncestors: ["'self'"],
    },
  }),
);
app.use(helmet.referrerPolicy({ policy: "same-origin" }));
app.use(helmet.xssFilter());
app.use(helmet.noSniff());

app.use((_req, res, next) => {
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  next();
});

app.use(cors(corsOptions));

app.use(bodyParser.json({ limit: "100mb" }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
// app.use(fileUpload({ limits: { fileSize: 5 * 1024 * 1024 } })); // 5 mb

app.use(morgan("short"));

app.use(
  express.static(path.join(process.cwd(), "public"), {
    dotfiles: "allow",
    lastModified: false,
    etag: false,
  }),
);

app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.secure) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }
  next();
});

app.use(rateLimiter);

app.use("/api/", routes);

app.use(errorHandler);

async function Bootstrap(): Promise<void> {
  try {
    await MySQLDataSource.initialize();
    console.log("Environment is " + ENV);

    http.createServer(app).listen(PORT, HOST, () => {
      console.log(`${NAME} HTTP server listening on port: ${PORT}`);
    });
  } catch (error) {
    console.error("Bootstrap Error: ", error);
  }
}

Bootstrap().catch((error) => {
  console.error("Unhandled error in Bootstrap:", error);
});
