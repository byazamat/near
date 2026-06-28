import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";

export type Role = "admin" | "user";

export interface JWTPayload {
  userId: string;
  role: Role;
  username: string;
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const JWT_EXPIRES_IN = "7d";
export const AUTH_COOKIE_NAME = "token";

export async function signJWT(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(JWT_SECRET);
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const { userId, role, username } = payload as Record<string, unknown>;
    if (typeof userId !== "string" || typeof username !== "string") return null;
    if (role !== "admin" && role !== "user") return null;
    return { userId, role, username };
  } catch {
    return null;
  }
}

export async function getAuthUser(
  request: NextRequest
): Promise<JWTPayload | null> {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyJWT(token);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
