import * as schema from "./schema";
import path from "path";
import fs from "fs";

let dbInstance: any;
let clientInstance: any;

const databaseUrl = process.env.DATABASE_URL;

// Determine if we should use remote PostgreSQL or embedded PGlite
const shouldUseRemotePostgres =
  databaseUrl &&
  databaseUrl.startsWith("postgres") &&
  !databaseUrl.includes("localhost:5432/spendwise");

if (shouldUseRemotePostgres) {
  const { drizzle } = require("drizzle-orm/postgres-js");
  const postgres = require("postgres");

  clientInstance = postgres(databaseUrl, {
    prepare: false,
    ssl: process.env.DATABASE_SSL === "true" || process.env.NODE_ENV === "production" ? "require" : false,
  });

  dbInstance = drizzle(clientInstance, { schema });
} else {
  // Use persistent embedded PGlite for local development and zero-config execution
  const { PGlite } = require("@electric-sql/pglite");
  const { drizzle } = require("drizzle-orm/pglite");

  const pgDataPath = path.join(process.cwd(), ".pgdata");
  if (!fs.existsSync(pgDataPath)) {
    fs.mkdirSync(pgDataPath, { recursive: true });
  }

  // Global singleton for Next.js hot-reloading
  const globalForDb = global as unknown as { pgliteClient?: any; pgliteDb?: any };

  if (!globalForDb.pgliteClient) {
    globalForDb.pgliteClient = new PGlite(pgDataPath);
    globalForDb.pgliteDb = drizzle(globalForDb.pgliteClient, { schema });
  }

  clientInstance = globalForDb.pgliteClient;
  dbInstance = globalForDb.pgliteDb;
}

export const client = clientInstance;
export const db = dbInstance;

/**
 * Initializes database tables and seed data if not yet created.
 */
export async function ensureDbInitialized() {
  try {
    const { sql } = await import("drizzle-orm");

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

    // Auto-seed if empty
    const { users, expenses } = await import("./schema");
    const { eq } = await import("drizzle-orm");
    const bcrypt = (await import("bcryptjs")).default;

    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length === 0) {
      const passwordHash = await bcrypt.hash("password123", 10);

      const [alex] = await db
        .insert(users)
        .values({
          name: "Alex Morgan",
          email: "alex@spendwise.app",
          passwordHash,
          currency: "USD",
        })
        .returning();

      const [sarah] = await db
        .insert(users)
        .values({
          name: "Sarah Dubois",
          email: "sarah@spendwise.app",
          passwordHash,
          currency: "EUR",
        })
        .returning();

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      await db.insert(expenses).values([
        {
          userId: alex.id,
          amount: 4550, // $45.50
          category: "Food",
          date: new Date(currentYear, currentMonth, 2, 12, 30),
          note: "Organic grocery run at Whole Foods",
        },
        {
          userId: alex.id,
          amount: 12500, // $125.00
          category: "Bills",
          date: new Date(currentYear, currentMonth, 3, 9, 0),
          note: "High-speed Fiber Internet & Electric utility",
        },
        {
          userId: alex.id,
          amount: 1899, // $18.99
          category: "Entertainment",
          date: new Date(currentYear, currentMonth, 5, 20, 15),
          note: "Streaming service subscription",
        },
        {
          userId: alex.id,
          amount: 6800, // $68.00
          category: "Travel",
          date: new Date(currentYear, currentMonth, 7, 14, 0),
          note: "Gasoline fill-up & highway toll",
        },
        {
          userId: alex.id,
          amount: 8990, // $89.90
          category: "Shopping",
          date: new Date(currentYear, currentMonth, 10, 16, 45),
          note: "Running sneakers & workout gear",
        },
        {
          userId: alex.id,
          amount: 3200, // $32.00
          category: "Food",
          date: new Date(currentYear, currentMonth, 12, 19, 30),
          note: "Dinner with friends at Italian bistro",
        },
        {
          userId: alex.id,
          amount: 5000, // $50.00
          category: "Health",
          date: new Date(currentYear, currentMonth, 14, 11, 0),
          note: "Monthly gym membership renewal",
        },
        {
          userId: alex.id,
          amount: 2500, // $25.00
          category: "Education",
          date: new Date(currentYear, currentMonth, 16, 10, 0),
          note: "Technical e-book on System Architecture",
        },
        {
          userId: alex.id,
          amount: 1575, // $15.75
          category: "Food",
          date: new Date(currentYear, currentMonth, 18, 8, 45),
          note: "Morning artisanal coffee and croissant",
        },
        {
          userId: alex.id,
          amount: 3500, // $35.00
          category: "Travel",
          date: new Date(currentYear, currentMonth, 20, 17, 30),
          note: "Airport taxi ride",
        },
        {
          userId: alex.id,
          amount: 1450, // $14.50
          category: "Other",
          date: new Date(currentYear, currentMonth, 21, 13, 10),
          note: "Post office parcel shipping",
        },
        // Past month
        {
          userId: alex.id,
          amount: 11000, // $110.00
          category: "Bills",
          date: new Date(currentYear, currentMonth - 1, 4, 10, 0),
          note: "Quarterly water & waste bill",
        },
        {
          userId: alex.id,
          amount: 9400, // $94.00
          category: "Food",
          date: new Date(currentYear, currentMonth - 1, 8, 18, 0),
          note: "Family dinner party groceries",
        },
        {
          userId: alex.id,
          amount: 22000, // $220.00
          category: "Travel",
          date: new Date(currentYear, currentMonth - 1, 15, 7, 0),
          note: "Weekend getaway train tickets",
        },
        // Sarah EUR expenses
        {
          userId: sarah.id,
          amount: 8500, // €85.00
          category: "Food",
          date: new Date(currentYear, currentMonth, 5, 13, 0),
          note: "Boulangerie & French market produce",
        },
        {
          userId: sarah.id,
          amount: 4900, // €49.00
          category: "Travel",
          date: new Date(currentYear, currentMonth, 10, 9, 0),
          note: "Navigo monthly transit pass",
        },
      ]);
    }
  } catch (err) {
    console.error("Database initialization check error:", err);
  }
}
