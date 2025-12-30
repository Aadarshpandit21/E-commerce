import HttpStatus from "http-status";
import { jwtVerify } from "jose";
import { type Request, type Response, type NextFunction } from "express";
import {
  ERR_MSG,
  JWT_SECRET,
} from "../services/constant.js";
import {
  type AuthenticatedResponse,
  type AccessTokenPayload,
} from "../utils/interface.js";
import { Role } from "../utils/enum.js";

import { SessionToken } from "../entities/session.token.entities.js";
import { MySQLDataSource } from "../data-source.js";

// const accountRepository = MySQLDataSource.getRepository(Accounts);

const sessionTokenRepository = MySQLDataSource.getRepository(SessionToken);

export async function isAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authorization = req.headers.authorization;
  try {
    if (authorization === undefined) {
      res
        .status(HttpStatus.UNAUTHORIZED)
        .json({ message: ERR_MSG.missingToken });
      return;
    }
    const accessToken = authorization.split(" ")[1];
    const sessionExists = await sessionTokenRepository.exists({
      where: { account: { id: res.locals.userId } },
    });

    if (!sessionExists) {
      res.status(HttpStatus.BAD_REQUEST).json({ message: "User Logged Out" });
      return;
    }
    const { payload } = await jwtVerify(accessToken, JWT_SECRET, {});
    res.locals = payload as AccessTokenPayload;
    next();
  } catch (err) {
    console.log("Error:-", { message: (err as Error).message });
    res.status(HttpStatus.UNAUTHORIZED).json({ message: "Session Expired" });
  }
}

export function isAdmin(
  _req: Request,
  res: AuthenticatedResponse,
  next: NextFunction
): void {
  if (res.locals.role === Role.ADMIN) {
    next();
  } else {
    res.status(HttpStatus.FORBIDDEN).json({ message: ERR_MSG.forbidden });
  }
}

export function isEmployee(
  _req: Request,
  res: AuthenticatedResponse,
  next: NextFunction
): void {
  if (res.locals.role === Role.Employee) {
    console.log(res.locals);
    next();
  } else {
    res.status(HttpStatus.FORBIDDEN).json({ message: ERR_MSG.forbidden });
  }
}
