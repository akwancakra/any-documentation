import { loadEnvConfig } from "@next/env";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

/** Root repo (bukan .next) — worker Turbopack kadang cwd-nya bukan project root. */
function resolveProjectRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 8; i++) {
    if (existsSync(path.join(dir, "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}

function parseDatabaseUrlFromEnvFile(filePath: string): string | undefined {
  if (!existsSync(filePath)) return undefined;
  const text = readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const m = trimmed.match(/^DATABASE_URL\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[1].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    return v || undefined;
  }
  return undefined;
}

function loadDatabaseUrlFromEnvFiles(root: string): string | undefined {
  const isProd = process.env.NODE_ENV === "production";
  const names = isProd
    ? [".env", ".env.local", ".env.production", ".env.production.local"]
    : [".env", ".env.local", ".env.development", ".env.development.local"];
  let last: string | undefined;
  for (const name of names) {
    const v = parseDatabaseUrlFromEnvFile(path.join(root, name));
    if (v) last = v;
  }
  return last;
}

function ensureDatabaseUrl(): void {
  if (process.env.DATABASE_URL?.trim()) return;

  const root = resolveProjectRoot();
  loadEnvConfig(root);

  if (process.env.DATABASE_URL?.trim()) return;

  const url = loadDatabaseUrlFromEnvFiles(root);
  if (url) process.env.DATABASE_URL = url;
}

ensureDatabaseUrl();

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const databaseUrl = process.env.DATABASE_URL?.trim();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(databaseUrl
      ? { datasources: { db: { url: databaseUrl } } }
      : {}),
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
