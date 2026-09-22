import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { client, db } from "./index";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Running automated database initialization / schema check...");

  try {
    // Ensure tables exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'USD',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS expenses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount INTEGER NOT NULL,
        category VARCHAR(50) NOT NULL,
        date TIMESTAMPTZ NOT NULL,
        note TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await db.execute(sql`CREATE INDEX IF NOT EXISTS expenses_user_id_idx ON expenses(user_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS expenses_date_idx ON expenses(date);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS expenses_category_idx ON expenses(category);`);

    console.log("Database tables and indexes verified successfully!");
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
