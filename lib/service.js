import { db } from "./db.js";
import {
  InputError,
  validateSale,
  validatePeriod,
  validDate,
  text,
} from "./domain.mjs";
import { editAccess, hashPassword, verifyPassword, throttle } from "./auth.js";
export async function state(session) {
  const [periods, sales] = await Promise.all([
    db.period.findMany({ orderBy: { start: "desc" } }),
    db.sale.findMany({ orderBy: [{ date: "desc" }, { createdAt: "desc" }] }),
  ]);
  const { username, hideTotal, timezone } = session.account;
  return {
    settings: { username, hideTotal, timezone, currency: "USD" },
    periods,
    sales,
  };
}
export async function saveSale(session, body, id) {
  if (id) await editAccess(session, body.password);
  const data = validateSale(body);
  return db.$transaction(async (tx) => {
    if (id && !(await tx.sale.findUnique({ where: { id } })))
      throw new InputError("No se encontró la venta.", 404);
    const period = await tx.period.findFirst({
      where: { start: { lte: data.date }, end: { gte: data.date } },
    });
    if (!period)
      throw new InputError(
        "Primero crea una quincena que incluya la fecha de esta venta.",
      );
    const duplicate = await tx.sale.findFirst({
      where: { invoice: data.invoice, ...(id ? { id: { not: id } } : {}) },
    });
    if (duplicate && !body.allowDuplicate)
      throw new InputError(
        "Ya hay una venta con esa factura. Confirma si quieres guardar otra.",
        409,
      );
    const entry = { ...data, periodId: period.id };
    return id
      ? tx.sale.update({ where: { id }, data: entry })
      : tx.sale.create({ data: entry });
  });
}
export async function removeSale(session, id, body) {
  await editAccess(session, body.password);
  if (!(await db.sale.findUnique({ where: { id } })))
    throw new InputError("No se encontró la venta.", 404);
  await db.sale.delete({ where: { id } });
  return { ok: true };
}
export async function savePeriod(body, id) {
  const data = validatePeriod(body);
  return db.$transaction(async (tx) => {
    const previous = id ? await tx.period.findUnique({ where: { id } }) : null;
    if (id && !previous) throw new InputError("Quincena no encontrada.", 404);
    const overlap = await tx.period.findFirst({
      where: {
        start: { lte: data.end },
        end: { gte: data.start },
        ...(id ? { id: { not: id } } : {}),
      },
    });
    if (overlap)
      throw new InputError(`Estas fechas coinciden con «${overlap.name}».`);
    if (
      id &&
      (await tx.sale.count({
        where: {
          periodId: id,
          OR: [{ date: { lt: data.start } }, { date: { gt: data.end } }],
        },
      }))
    )
      throw new InputError(
        "Hay ventas fuera de estas fechas. Conserva un intervalo que las incluya.",
      );
    const closed =
      body.closed === undefined
        ? (previous?.closed ?? false)
        : Boolean(body.closed);
    return id
      ? tx.period.update({ where: { id }, data: { ...data, closed } })
      : tx.period.create({ data: { ...data, closed } });
  });
}
export async function updateSettings(session, body) {
  const data = {};
  if (body.hideTotal !== undefined) {
    if (typeof body.hideTotal !== "boolean")
      throw new InputError("Preferencia inválida.");
    data.hideTotal = body.hideTotal;
  }
  if (body.timezone !== undefined) {
    try {
      new Intl.DateTimeFormat("es", { timeZone: body.timezone }).format();
    } catch {
      throw new InputError("Zona horaria no válida.");
    }
    data.timezone = text(body.timezone, 80);
  }
  if (body.newPassword !== undefined || body.newEditPassword !== undefined) {
    await throttle("settings:" + session.accountId);
    if (!verifyPassword(body.currentPassword, session.account.passwordHash))
      throw new InputError(
        "La contraseña actual de acceso no es correcta.",
        403,
      );
    for (const [key, target] of [
      ["newPassword", "passwordHash"],
      ["newEditPassword", "editHash"],
    ])
      if (body[key] !== undefined) {
        if (
          typeof body[key] !== "string" ||
          body[key].length < 4 ||
          body[key].length > 128
        )
          throw new InputError(
            "La contraseña debe tener entre 4 y 128 caracteres.",
          );
        data[target] = hashPassword(body[key]);
      }
    await db.$transaction(async (tx) => {
      await tx.account.update({ where: { id: 1 }, data });
      if (data.passwordHash)
        await tx.session.deleteMany({ where: { id: { not: session.id } } });
      await tx.attempt.deleteMany({
        where: { key: "settings:" + session.accountId },
      });
    });
  } else await db.account.update({ where: { id: 1 }, data });
  return { ok: true };
}
