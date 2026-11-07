import { NextResponse } from "next/server";
import { requireSession, login } from "../../../lib/auth.js";
import {
  state,
  saveSale,
  removeSale,
  savePeriod,
  updateSettings,
} from "../../../lib/service.js";
import { db } from "../../../lib/db.js";
import { InputError } from "../../../lib/domain.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function handle(request, { params }) {
  try {
    const { path = [] } = await params;
    const [resource, id] = path;
    const method = request.method;
    if (path.length > 2) throw new InputError("Ruta no encontrada.", 404);
    let body = {};
    if (["POST", "PATCH", "DELETE"].includes(method)) {
      const raw = await request.text();
      if (raw.length > 20000)
        throw new InputError("La solicitud es demasiado grande.", 413);
      try {
        body = raw ? JSON.parse(raw) : {};
      } catch {
        throw new InputError("Solicitud no válida.");
      }
      if (!body || typeof body !== "object" || Array.isArray(body))
        throw new InputError("Solicitud no válida.");
    }
    let result;
    if (resource === "auth" && id === "login" && method === "POST")
      result = await login(body);
    else {
      const session = await requireSession(request);
      if (resource === "state" && method === "GET")
        result = await state(session);
      else if (resource === "auth" && id === "logout" && method === "POST") {
        await db.session.delete({ where: { id: session.id } });
        result = { ok: true };
      } else if (resource === "sales" && method === "POST" && !id)
        result = await saveSale(session, body);
      else if (resource === "sales" && method === "PATCH" && id)
        result = await saveSale(session, body, id);
      else if (resource === "sales" && method === "DELETE" && id)
        result = await removeSale(session, id, body);
      else if (
        resource === "periods" &&
        ((method === "POST" && !id) || (method === "PATCH" && id))
      )
        result = await savePeriod(body, id);
      else if (resource === "settings" && method === "PATCH")
        result = await updateSettings(session, body);
      else throw new InputError("Ruta no encontrada.", 404);
    }
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (!(error instanceof InputError)) console.error("API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof InputError
            ? error.message
            : "No se pudo completar la operación. Intenta de nuevo.",
      },
      {
        status: error instanceof InputError ? error.status : 500,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };
