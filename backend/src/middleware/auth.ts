import type { NextFunction, Request, Response } from "express";
import { verifySession } from "../utils/jwt.js";
import { HttpError } from "../utils/httpErrors.js";
import { UserModel, type UserRole } from "../models/User.js";

export type AuthedRequest = Request & {
  user?: {
    id: string;
    role: UserRole;
  };
};

export async function requireAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  try {
    const cookieToken = typeof req.cookies?.session === "string" ? (req.cookies.session as string) : undefined;
    const header = req.header("authorization");
    const bearerToken = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
    const token = bearerToken ?? cookieToken;
    if (!token) throw new HttpError(401, "UNAUTHENTICATED", "Missing session");

    const payload = verifySession(token);
    const userId = payload.sub;
    const user = await UserModel.findById(userId).select({ _id: 1, role: 1 }).lean();
    if (!user) throw new HttpError(401, "UNAUTHENTICATED", "Invalid session");

    req.user = { id: String(user._id), role: user.role as UserRole };
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthedRequest, _res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role || !roles.includes(role)) return next(new HttpError(403, "FORBIDDEN", "Forbidden"));
    next();
  };
}

