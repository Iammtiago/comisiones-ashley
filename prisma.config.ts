import "dotenv/config";
import { defineConfig } from "prisma/config";
import { PrismaBetterSQLite3 } from "@prisma/adapter-better-sqlite3";
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  experimental: { adapter: true },
  engine: "js",
  adapter: async () =>
    new PrismaBetterSQLite3({
      url: process.env.DATABASE_URL || "file:./data/app.db",
    }),
});
