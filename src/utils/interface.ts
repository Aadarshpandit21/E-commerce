import { type JWTPayload } from "jose";
import { type Response } from "express";
import { type SessionTokenAction, type Role } from "./enum.js";
import type ejv from "express-joi-validation";
import {
  type FindOptionsSelect,
  type FindOptionsWhere,
  type FindOptionsOrder,
} from "typeorm";

export interface OAuthBody {
  idToken: string;
}

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

export interface Relation {
  populates: string[] | string | undefined;
}
export interface Select<Entity> {
  fields: FindOptionsSelect<Entity> | undefined;
}

export interface ListQuery<Entity> extends Relation, Select<Entity> {
  page: number | undefined;
  limit: number | undefined;
  sort: FindOptionsOrder<Entity>;
  filters: FindOptionsWhere<Entity>;
  orFilters: Record<string, string>;
  type: "mis";
}

export interface ListRequestSchema<Entity> extends ejv.ValidatedRequestSchema {
  [ejv.ContainerTypes.Query]: ListQuery<Entity>;
}

export interface AuthenticatedResponse
  extends Response<unknown, AccessTokenPayload> {}
