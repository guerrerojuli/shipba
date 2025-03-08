import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

config({ path: ".env" });

async function runMigrate() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not defined");
  }

  const connection = postgres(connectionString, { max: 1 });
  const db = drizzle(connection);

  console.log("Running migrattions...");

  await migrate(db, { migrationsFolder: "./migrations" });

  console.log("Migration complete");

  process.exit(0);
}

runMigrate().catch((error) => {
  console.error("Migration failed");
  console.error(error);
  process.exit(1);
})