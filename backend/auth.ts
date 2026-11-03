import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { NextFunction, Request, Response } from "express";
import { db } from "./db";

const scrypt = promisify(scryptCallback);
const COOKIE_NAME = "lab_session";
const SESSION_DAYS = 7;

export type AuthUser = { id: number; username: string; displayName: string };
declare global { namespace Express { interface Request { user?: AuthUser } } }

function cookieValue(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  const item = header.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : undefined;
}
function tokenHash(token: string) { return createHash("sha256").update(token).digest("hex"); }
function setCookie(res: Response, token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${secure}`);
}
export function clearCookie(res: Response) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure}`);
}
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}
export async function verifyPassword(password: string, stored: string) {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const derived = await scrypt(password, salt, 64) as Buffer;
  const expected = Buffer.from(key, "hex");
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}
export async function createSession(res: Response, userId: number) {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000);
  await db.query("INSERT INTO user_sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)", [userId, tokenHash(token), expires]);
  setCookie(res, token);
}
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = cookieValue(req, COOKIE_NAME);
    if (!token) { res.status(401).json({ error: "Connectez-vous pour effectuer cette action." }); return; }
    const result = await db.query(
      `SELECT u.id, u.username, u.display_name AS "displayName"
       FROM user_sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.expires_at > NOW()`, [tokenHash(token)]
    );
    if (!result.rowCount) { clearCookie(res); res.status(401).json({ error: "Votre session a expiré. Reconnectez-vous." }); return; }
    req.user = { id: Number(result.rows[0].id), username: result.rows[0].username, displayName: result.rows[0].displayName };
    next();
  } catch (error) { next(error); }
}
