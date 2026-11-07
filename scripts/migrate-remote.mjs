import "dotenv/config";
import { createClient } from "@libsql/client";
import { applyMigrations } from "../lib/migrations.mjs";
const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) {
  console.error(
    "Configura TURSO_DATABASE_URL y TURSO_AUTH_TOKEN antes de desplegar. No se usará una base local en Vercel.",
  );
  process.exit(1);
}
if (!/^(libsql|https):\/\//.test(url)) {
  console.error(
    "TURSO_DATABASE_URL debe ser una URL remota libsql:// o https://.",
  );
  process.exit(1);
}
const client = createClient({ url, authToken });
try {
  await applyMigrations(client);
  console.log("Base remota preparada; ventas existentes conservadas.");
} finally {
  client.close();
}
