export class InputError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
export function moneyToCents(value) {
  if (!["string", "number"].includes(typeof value))
    throw new InputError("Escribe un importe válido.");
  const str = String(value).trim().replace(",", ".");
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(str))
    throw new InputError(
      "Usa un importe positivo con hasta dos decimales (máximo 9.999.999,99).",
    );
  const [whole, part = ""] = str.split(".");
  return Number(whole) * 100 + Number(part.padEnd(2, "0"));
}
export function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const d = new Date(value + "T12:00:00Z");
  return (
    Number.isFinite(+d) &&
    d.toISOString().slice(0, 10) === value &&
    value >= "2000-01-01" &&
    value <= "2100-12-31"
  );
}
export function text(value, max = 200) {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") throw new InputError("Texto no válido.");
  if (value.trim().length > max)
    throw new InputError(`El texto no puede superar ${max} caracteres.`);
  return value.trim();
}
export function validateSale(body) {
  const invoice = text(body.invoice, 80);
  if (!invoice) throw new InputError("El número de factura es obligatorio.");
  if (!validDate(body.date))
    throw new InputError("Selecciona una fecha válida.");
  const payment = text(body.payment, 30);
  if (!["", "Efectivo", "Transferencia", "Cachea"].includes(payment))
    throw new InputError("Método de pago no válido.");
  return {
    invoice,
    commission: moneyToCents(body.commission),
    customer: text(body.customer, 120),
    description: text(body.description, 1000),
    total:
      body.total == null || body.total === "" ? null : moneyToCents(body.total),
    payment,
    date: body.date,
  };
}
export function validatePeriod(body) {
  const name = text(body.name, 80);
  if (!name) throw new InputError("Dale un nombre a la quincena.");
  if (!validDate(body.start) || !validDate(body.end) || body.start > body.end)
    throw new InputError("Revisa el inicio y fin de la quincena.");
  return { name, start: body.start, end: body.end };
}
export function todayIn(timezone = "America/Caracas", now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  return ["year", "month", "day"]
    .map((k) => parts.find((p) => p.type === k).value)
    .join("-");
}
export const usd = (cents) =>
  new Intl.NumberFormat("es-VE", {
    style: "currency",
    currency: "USD",
    currencyDisplay: "narrowSymbol",
  }).format((cents || 0) / 100);
export const shortDate = (date) =>
  new Intl.DateTimeFormat("es", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(date + "T12:00:00Z"));
export function csvCell(value) {
  let s = String(value ?? "");
  if (/^[\s]*[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
}
