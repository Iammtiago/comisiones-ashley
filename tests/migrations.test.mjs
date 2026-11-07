import test from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@libsql/client";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { applyMigrations } from "../lib/migrations.mjs";
test("libsql migrations are repeatable, preserve records, reject changed history and roll back SQL errors", async (t) => {
  const dir = await mkdtemp("/tmp/ashley-migrations-");
  const client = createClient({ url: "file:" + dir + "/test.db" });
  t.after(async () => {
    client.close();
    await rm(dir, { recursive: true, force: true });
  });
  await applyMigrations(client);
  await client.execute({
    sql: "INSERT INTO Period (id,name,start,end) VALUES (?,?,?,?)",
    args: ["test", "Mi quincena", "2026-11-01", "2026-11-15"],
  });
  await applyMigrations(client);
  assert.equal(
    (await client.execute("SELECT count(*) AS n FROM Period")).rows[0].n,
    1,
  );
  const base = dir + "/migrations/";
  await mkdir(base + "001", { recursive: true });
  await writeFile(
    base + "001/migration.sql",
    "CREATE TABLE Example(id TEXT PRIMARY KEY);",
  );
  await applyMigrations(client, pathToFileURL(base));
  await writeFile(base + "001/migration.sql", "CREATE TABLE Example(id INT);");
  await assert.rejects(
    applyMigrations(client, pathToFileURL(base)),
    /modificada/,
  );
  await mkdir(base + "002");
  await writeFile(
    base + "001/migration.sql",
    "CREATE TABLE Example(id TEXT PRIMARY KEY);",
  );
  await writeFile(
    base + "002/migration.sql",
    "CREATE TABLE MustRollback(id INT); INSERT INTO MissingTable VALUES (1);",
  );
  await assert.rejects(applyMigrations(client, pathToFileURL(base)));
  assert.equal(
    (
      await client.execute(
        "SELECT name FROM sqlite_master WHERE name='MustRollback'",
      )
    ).rows.length,
    0,
  );
});
