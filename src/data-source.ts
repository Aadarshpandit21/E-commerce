import path from "node:path";

import { DataSource } from "typeorm";

import {
  IS_PROD,
  MYSQL_DATABASE,
  MYSQL_HOST,
  MYSQL_PASSWORD,
  MYSQL_PORT,
  MYSQL_USER,
} from "./services/constant.js";

export const MySQLDataSource = new DataSource({
  type: "mysql",
  host: MYSQL_HOST,
  port: MYSQL_PORT,
  username: MYSQL_USER,
  password: MYSQL_PASSWORD,
  database: MYSQL_DATABASE,
  synchronize: true,
  migrationsRun: false,
  logging: !IS_PROD,
  entities: [
    "src/entities/*" + path.extname(process.argv[1]),
    "dist/entities/*.js",
  ],
  subscribers: [
    "src/subscribers/*" + path.extname(process.argv[1]),
    "dist/subscribers/*.js",
  ],
  migrations: [
    "src/migrations/*" + path.extname(process.argv[1]),
    "dist/migrations/*.js",
  ],
});
