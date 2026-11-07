import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { db } from "./db.js";
import { InputError } from "./domain.mjs";
export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(password, salt, 64).toString("hex");
}
export function verifyPassword(password, stored) {
  if (typeof password !== "string" || password.length > 256) return false;
  const [salt, digest] = stored.split(":");
  const result = scryptSync(password, salt, 64);
  const expected = Buffer.from(digest, "hex");
  return result.length === expected.length && timingSafeEqual(result, expected);
}
export const tokenHash = (token) =>
  createHash("sha256").update(token).digest("hex");
export async function account() {
  return db.account.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      username: "ashley",
      passwordHash: hashPassword("ashley"),
      editHash: hashPassword("1111"),
    },
  });
}
export async function requireSession(request) {
  const auth = request.headers.get("authorization") || "";
  if (!/^Bearer [a-f0-9]{64}$/.test(auth))
    throw new InputError("Inicia sesión para continuar.", 401);
  const session = await db.session.findUnique({
    where: { tokenHash: tokenHash(auth.slice(7)) },
    include: { account: true },
  });
  if (!session)
    throw new InputError("Tu sesión se cerró. Vuelve a entrar.", 401);
  return session;
}
export async function throttle(key, limit = 10) {
  const now = new Date();
  const attempt = await db.attempt.findUnique({ where: { key } });
  if (attempt && attempt.resetAt > now && attempt.count >= limit)
    throw new InputError(
      "Demasiados intentos. Espera 15 minutos y vuelve a intentar.",
      429,
    );
  if (!attempt || attempt.resetAt <= now)
    await db.attempt.upsert({
      where: { key },
      update: { count: 1, resetAt: new Date(+now + 900000) },
      create: { key, count: 1, resetAt: new Date(+now + 900000) },
    });
  else
    await db.attempt.update({
      where: { key },
      data: { count: { increment: 1 } },
    });
}
export async function editAccess(session, password) {
  const key = "edit:" + session.accountId;
  await throttle(key);
  if (!verifyPassword(password, session.account.editHash))
    throw new InputError("La contraseña de edición no es correcta.", 403);
  await db.attempt.deleteMany({ where: { key } });
}
export async function login(body) {
  await throttle("login");
  const user = await account();
  if (
    body.username !== user.username ||
    !verifyPassword(body.password, user.passwordHash)
  )
    throw new InputError("Usuario o contraseña incorrectos.", 401);
  const token = randomBytes(32).toString("hex");
  await db.session.create({
    data: {
      id: randomBytes(16).toString("hex"),
      tokenHash: tokenHash(token),
      accountId: 1,
    },
  });
  await db.attempt.deleteMany({ where: { key: "login" } });
  return { token };
}
