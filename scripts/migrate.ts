import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { readMigrationFiles } from "drizzle-orm/migrator";
import * as schema from "@/lib/db/schema";

config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set - see .env.local.example");
}

const migrationsFolder = "drizzle";
const neonSql = neon(process.env.DATABASE_URL);
const db = drizzle(neonSql, { schema });

async function baselineLegacySchemaIfNeeded() {
  await neonSql.query("create schema if not exists drizzle");
  await neonSql.query(`
    create table if not exists drizzle.__drizzle_migrations (
      id serial primary key,
      hash text not null,
      created_at bigint
    )
  `);

  const existingMigrations = await neonSql.query(
    "select id from drizzle.__drizzle_migrations order by created_at desc limit 1"
  );
  if (existingMigrations.length > 0) return;

  const [{ billing_records: billingRecordsTable }] = (await neonSql.query(
    "select to_regclass('public.billing_records')::text as billing_records"
  )) as Array<{ billing_records: string | null }>;
  if (!billingRecordsTable) return;

  const migrations = readMigrationFiles({ migrationsFolder });
  const latestMigration = migrations.at(-1);
  const baselineMigrations = latestMigration
    ? migrations.filter((migration) => migration.folderMillis < latestMigration.folderMillis)
    : [];

  for (const migration of baselineMigrations) {
    await neonSql.query(
      `insert into drizzle.__drizzle_migrations ("hash", "created_at") values ($1, $2)`,
      [migration.hash, migration.folderMillis]
    );
  }

  if (baselineMigrations.length > 0) {
    console.log(
      `Stamped ${baselineMigrations.length} existing migrations for a pre-journal database.`
    );
  }
}

async function main() {
  await baselineLegacySchemaIfNeeded();
  await migrate(db, { migrationsFolder });
  console.log("Drizzle migrations applied.");
}

main().catch((error) => {
  console.error("Drizzle migration failed:", error);
  process.exit(1);
});
