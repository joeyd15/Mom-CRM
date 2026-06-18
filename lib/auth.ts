/**
 * Simple admin authentication using signed session cookies.
 * No third-party auth library required.
 */

import { cookies } from "next/headers";
import { createHmac } from "crypto";
import { env } from "./env";

const SESSION_COOKIE = "mom_bot_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function sign(value: string): string {
  const hmac = createHmac("sha256", env.sessionSecret);
  hmac.update(value);
  return `${value}.${hmac.digest("hex")}`;
}

function unsign(signed: string): string | null {
  const lastDot = signed.lastIndexOf(".");
  if (lastDot === -1) return null;
  const value = signed.slice(0, lastDot);
  const expected = sign(value);
  if (expected !== signed) return null;
  return value;
}

export async function createSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = sign(`admin_${Date.now()}`);
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function getSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  const value = unsign(token);
  return value !== null && value.startsWith("admin_");
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function requireAuth(): Promise<boolean> {
  return getSession();
}
