import { spawnSync } from "node:child_process";
import { lookup } from "node:dns/promises";

function deriveSupabaseDirectUrl(databaseUrl) {
  try {
    const parsed = new URL(databaseUrl);
    if (!parsed.hostname.endsWith(".pooler.supabase.com")) {
      return null;
    }

    const [databaseUser, projectRef] = parsed.username.split(".");
    if (databaseUser !== "postgres" || !projectRef) {
      return null;
    }

    const directUrl = new URL(databaseUrl);
    directUrl.username = "postgres";
    directUrl.hostname = `db.${projectRef}.supabase.co`;
    directUrl.port = "5432";
    directUrl.searchParams.delete("pgbouncer");

    return directUrl.toString();
  } catch {
    return null;
  }
}

function deriveSupabaseSessionPoolerUrl(databaseUrl) {
  try {
    const parsed = new URL(databaseUrl);
    if (!parsed.hostname.endsWith(".pooler.supabase.com")) {
      return null;
    }

    const sessionPoolerUrl = new URL(databaseUrl);
    sessionPoolerUrl.port = "5432";
    sessionPoolerUrl.searchParams.delete("pgbouncer");

    return sessionPoolerUrl.toString();
  } catch {
    return null;
  }
}

async function ensurePrismaDatabaseUrls() {
  if (!process.env.DATABASE_URL) {
    return;
  }

  if (!process.env.DIRECT_URL) {
    const derivedDirectUrl = deriveSupabaseDirectUrl(process.env.DATABASE_URL);
    if (derivedDirectUrl) {
      process.env.DIRECT_URL = derivedDirectUrl;
      return;
    }
  }

  if (!process.env.DIRECT_URL) {
    return;
  }

  try {
    const directUrl = new URL(process.env.DIRECT_URL);
    if (!directUrl.hostname.endsWith(".supabase.co") || directUrl.hostname.includes("pooler")) {
      return;
    }

    await lookup(directUrl.hostname);
  } catch {
    const sessionPoolerUrl = deriveSupabaseSessionPoolerUrl(process.env.DATABASE_URL);
    if (sessionPoolerUrl) {
      process.env.DIRECT_URL = sessionPoolerUrl;
    }
  }
}

await ensurePrismaDatabaseUrls();

const result = spawnSync(process.execPath, ["./node_modules/prisma/build/index.js", ...process.argv.slice(2)], {
  stdio: "inherit",
  env: process.env
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 0);
