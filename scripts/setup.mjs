import { existsSync, mkdirSync, copyFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
if (!existsSync(".env")) copyFileSync(".env.example", ".env");
mkdirSync("data", { recursive: true });
for (const args of [
  ["node_modules/prisma/build/index.js", "generate"],
  ["node_modules/prisma/build/index.js", "migrate", "deploy"],
]) {
  const r = spawnSync(process.execPath, args, {
    stdio: "inherit",
    env: process.env,
  });
  if (r.status !== 0) process.exit(r.status || 1);
}
