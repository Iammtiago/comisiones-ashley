import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
export async function applyMigrations(
  client,
  migrations = new URL("../prisma/migrations/", import.meta.url),
) {
  await client.execute(
    'CREATE TABLE IF NOT EXISTS "_AshleyMigrations" ("name" TEXT PRIMARY KEY, "checksum" TEXT NOT NULL, "appliedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)',
  );
  const entries = (await readdir(migrations, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const sql = await readFile(
      new URL(entry.name + "/migration.sql", migrations),
      "utf8",
    );
    const checksum = createHash("sha256").update(sql).digest("hex");
    const tx = await client.transaction("write");
    try {
      const applied = await tx.execute({
        sql: 'SELECT "checksum" FROM "_AshleyMigrations" WHERE "name" = ?',
        args: [entry.name],
      });
      if (applied.rows.length) {
        if (applied.rows[0].checksum !== checksum)
          throw new Error(
            "Una migración aplicada fue modificada: " + entry.name,
          );
      } else {
        await tx.executeMultiple(sql);
        await tx.execute({
          sql: 'INSERT INTO "_AshleyMigrations" ("name", "checksum") VALUES (?, ?)',
          args: [entry.name, checksum],
        });
        console.log("Migración aplicada: " + entry.name);
      }
      await tx.commit();
    } catch (error) {
      await tx.rollback();
      throw error;
    } finally {
      tx.close();
    }
  }
}
