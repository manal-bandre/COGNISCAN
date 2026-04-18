import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export type SessionTokenPayload = {
  sub: string;
  role: "patient" | "caretaker" | "doctor";
};

export function signSession(payload: SessionTokenPayload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });
}

export function verifySession(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as SessionTokenPayload & jwt.JwtPayload;
}

