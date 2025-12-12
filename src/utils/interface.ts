import { type JWTPayload } from "jose";
import { type SessionTokenAction, type Role } from "./enum.js";
export interface RefreshTokenPayload extends JWTPayload {
  userId: number;
}

export interface SessionTokenPayload extends RefreshTokenPayload {
  action: SessionTokenAction;
  email: string;
}

export interface AccessTokenPayload extends RefreshTokenPayload {
  role: Role;
}
