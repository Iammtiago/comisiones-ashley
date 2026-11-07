import test from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const folder = mkdtempSync(join(tmpdir(), "ashley-test-"));
const env = {
  ...process.env,
  DATABASE_URL: "file:" + join(folder, "test.db"),
  PORT: "3101",
  NEXT_TELEMETRY_DISABLED: "1",
};
const migrate = spawnSync(
  process.execPath,
  ["node_modules/prisma/build/index.js", "migrate", "deploy"],
  { env, encoding: "utf8" },
);
assert.equal(migrate.status, 0, migrate.stderr);
let server;
let output = "";
function start() {
  server = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "start", "-p", "3101"],
    { env, stdio: ["ignore", "pipe", "pipe"] },
  );
  server.stdout.on("data", (d) => (output += d));
  server.stderr.on("data", (d) => (output += d));
}
async function ready() {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch("http://127.0.0.1:3101")).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw Error(output);
}
async function stop() {
  if (server.exitCode !== null) return;
  await new Promise((resolve) => {
    server.once("exit", resolve);
    server.kill("SIGTERM");
  });
}
let token;
async function request(path, method = "GET", body, auth = token) {
  const r = await fetch("http://127.0.0.1:3101/api/" + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(auth ? { Authorization: "Bearer " + auth } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, body: await r.json() };
}
test("complete API workflow with real SQLite", async (t) => {
  t.after(async () => {
    await stop();
    rmSync(folder, { recursive: true, force: true });
  });
  start();
  await ready();
  let first, second, sale;
  await t.test("unauthenticated data denied", async () =>
    assert.equal((await request("state")).status, 401),
  );
  await t.test(
    "incorrect login rejected and default credentials work",
    async () => {
      assert.equal(
        (
          await request("auth/login", "POST", {
            username: "ashley",
            password: "bad",
          })
        ).status,
        401,
      );
      const r = await request("auth/login", "POST", {
        username: "ashley",
        password: "ashley",
      });
      assert.equal(r.status, 200);
      token = r.body.token;
      assert.match(token, /^[a-f0-9]{64}$/);
      const state = await request("state");
      assert.deepEqual(state.body.sales, []);
      assert.equal(JSON.stringify(state.body).includes("passwordHash"), false);
    },
  );
  await t.test(
    "custom periods; overlapping inclusive endpoints rejected",
    async () => {
      first = (
        await request("periods", "POST", {
          name: "Primera",
          start: "2026-11-01",
          end: "2026-11-15",
        })
      ).body;
      second = (
        await request("periods", "POST", {
          name: "Segunda",
          start: "2026-11-16",
          end: "2026-11-30",
        })
      ).body;
      assert.ok(first.id);
      assert.ok(second.id);
      assert.equal(
        (
          await request("periods", "POST", {
            name: "Solapada",
            start: "2026-11-15",
            end: "2026-11-17",
          })
        ).status,
        400,
      );
    },
  );
  await t.test(
    "minimal sale persists exact cents and optional fields",
    async () => {
      const r = await request("sales", "POST", {
        invoice: "001",
        commission: "12.35",
        date: "2026-11-06",
      });
      assert.equal(r.status, 200, JSON.stringify(r.body));
      sale = r.body;
      assert.equal(sale.commission, 1235);
      assert.equal(sale.total, null);
      assert.equal(sale.periodId, first.id);
    },
  );
  await t.test(
    "invalid amounts, dates, missing required fields rejected",
    async () => {
      for (const patch of [
        { commission: "-1" },
        { commission: "1.001" },
        { invoice: "" },
        { date: "2026-02-30" },
        { date: "2026-12-01" },
      ])
        assert.equal(
          (
            await request("sales", "POST", {
              invoice: "x",
              commission: "1",
              date: "2026-11-06",
              ...patch,
            })
          ).status,
          400,
        );
    },
  );
  await t.test("duplicate invoice requires explicit confirmation", async () => {
    const body = { invoice: "001", commission: "1", date: "2026-11-06" };
    assert.equal((await request("sales", "POST", body)).status, 409);
    const r = await request("sales", "POST", { ...body, allowDuplicate: true });
    assert.equal(r.status, 200);
    assert.equal(
      (await request("sales/" + r.body.id, "DELETE", { password: "1111" }))
        .status,
      200,
    );
  });
  await t.test(
    "wrong edit and delete password cannot mutate data",
    async () => {
      assert.equal(
        (
          await request("sales/" + sale.id, "PATCH", {
            invoice: "001",
            commission: "99",
            date: "2026-11-06",
            password: "bad",
          })
        ).status,
        403,
      );
      assert.equal(
        (await request("sales/" + sale.id, "DELETE", { password: "bad" }))
          .status,
        403,
      );
      assert.equal((await request("state")).body.sales[0].commission, 1235);
    },
  );
  await t.test("date edit moves sale to correct period", async () => {
    const r = await request("sales/" + sale.id, "PATCH", {
      invoice: "001",
      commission: "15",
      date: "2026-11-20",
      password: "1111",
      payment: "Cachea",
    });
    assert.equal(r.status, 200);
    assert.equal(r.body.periodId, second.id);
    assert.equal(r.body.commission, 1500);
  });
  await t.test("period edits cannot orphan sales", async () => {
    assert.equal(
      (
        await request("periods/" + second.id, "PATCH", {
          name: "Segunda",
          start: "2026-11-21",
          end: "2026-11-30",
        })
      ).status,
      400,
    );
  });
  await t.test(
    "privacy preference and data survive server restart",
    async () => {
      assert.equal(
        (await request("settings", "PATCH", { hideTotal: true })).status,
        200,
      );
      await stop();
      start();
      await ready();
      const r = await request("state");
      assert.equal(r.status, 200);
      assert.equal(r.body.settings.hideTotal, true);
      assert.equal(r.body.sales.length, 1);
      assert.equal(r.body.sales[0].commission, 1500);
    },
  );
  await t.test(
    "password changes require current access and revoke other sessions",
    async () => {
      const other = (
        await request("auth/login", "POST", {
          username: "ashley",
          password: "ashley",
        })
      ).body.token;
      assert.equal(
        (
          await request("settings", "PATCH", {
            currentPassword: "bad",
            newPassword: "newpass",
          })
        ).status,
        403,
      );
      assert.equal(
        (
          await request("settings", "PATCH", {
            currentPassword: "ashley",
            newPassword: "newpass",
            newEditPassword: "2222",
          })
        ).status,
        200,
      );
      assert.equal(
        (await request("state", "GET", undefined, other)).status,
        401,
      );
      assert.equal((await request("state")).status, 200);
      assert.equal(
        (await request("sales/" + sale.id, "DELETE", { password: "1111" }))
          .status,
        403,
      );
      assert.equal(
        (await request("sales/" + sale.id, "DELETE", { password: "2222" }))
          .status,
        200,
      );
    },
  );
  await t.test(
    "edit attempt limit cannot be bypassed by logging in again",
    async () => {
      for (let i = 0; i < 10; i++)
        assert.equal(
          (await request("sales/nonexistent", "DELETE", { password: "wrong" }))
            .status,
          403,
        );
      const next = (
        await request("auth/login", "POST", {
          username: "ashley",
          password: "newpass",
        })
      ).body.token;
      assert.ok(next);
      assert.equal(
        (
          await request(
            "sales/nonexistent",
            "DELETE",
            { password: "wrong" },
            next,
          )
        ).status,
        429,
      );
    },
  );
  await t.test("login attempts are rate limited", async () => {
    for (let i = 0; i < 10; i++)
      assert.equal(
        (
          await request("auth/login", "POST", {
            username: "ashley",
            password: "bad",
          })
        ).status,
        401,
      );
    assert.equal(
      (
        await request("auth/login", "POST", {
          username: "ashley",
          password: "bad",
        })
      ).status,
      429,
    );
  });
  await t.test("logout revokes remembered token", async () => {
    assert.equal((await request("auth/logout", "POST", {})).status, 200);
    assert.equal((await request("state")).status, 401);
  });
});
