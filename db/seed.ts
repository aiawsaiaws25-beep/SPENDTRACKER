import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { client, db } from "./index";
import { users, expenses } from "./schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding SpendWise database...");

  try {
    const passwordHash = await bcrypt.hash("password123", 10);

    // 1. Create or get Demo User 1 (USD)
    let [user1] = await db
      .select()
      .from(users)
      .where(eq(users.email, "alex@spendwise.app"))
      .limit(1);

    if (!user1) {
      [user1] = await db
        .insert(users)
        .values({
          name: "Alex Morgan",
          email: "alex@spendwise.app",
          passwordHash,
          currency: "USD",
        })
        .returning();
      console.log(`Created user: ${user1.email}`);
    }

    // 2. Create or get Demo User 2 (EUR) - for tenant isolation testing
    let [user2] = await db
      .select()
      .from(users)
      .where(eq(users.email, "sarah@spendwise.app"))
      .limit(1);

    if (!user2) {
      [user2] = await db
        .insert(users)
        .values({
          name: "Sarah Dubois",
          email: "sarah@spendwise.app",
          passwordHash,
          currency: "EUR",
        })
        .returning();
      console.log(`Created user: ${user2.email}`);
    }

    // Check if expenses exist for user1
    const existingExpenses = await db
      .select()
      .from(expenses)
      .where(eq(expenses.userId, user1.id))
      .limit(1);

    if (existingExpenses.length === 0) {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      const sampleExpenses = [
        // Current Month Expenses
        {
          userId: user1.id,
          amount: 4550, // $45.50
          category: "Food",
          date: new Date(currentYear, currentMonth, 2, 12, 30),
          note: "Organic grocery run at Whole Foods",
        },
        {
          userId: user1.id,
          amount: 12500, // $125.00
          category: "Bills",
          date: new Date(currentYear, currentMonth, 3, 9, 0),
          note: "High-speed Fiber Internet & Electric utility",
        },
        {
          userId: user1.id,
          amount: 1899, // $18.99
          category: "Entertainment",
          date: new Date(currentYear, currentMonth, 5, 20, 15),
          note: "Streaming service subscription",
        },
        {
          userId: user1.id,
          amount: 6800, // $68.00
          category: "Travel",
          date: new Date(currentYear, currentMonth, 7, 14, 0),
          note: "Gasoline fill-up & highway toll",
        },
        {
          userId: user1.id,
          amount: 8990, // $89.90
          category: "Shopping",
          date: new Date(currentYear, currentMonth, 10, 16, 45),
          note: "Running sneakers & workout gear",
        },
        {
          userId: user1.id,
          amount: 3200, // $32.00
          category: "Food",
          date: new Date(currentYear, currentMonth, 12, 19, 30),
          note: "Dinner with friends at Italian bistro",
        },
        {
          userId: user1.id,
          amount: 5000, // $50.00
          category: "Health",
          date: new Date(currentYear, currentMonth, 14, 11, 0),
          note: "Monthly gym membership renewal",
        },
        {
          userId: user1.id,
          amount: 2500, // $25.00
          category: "Education",
          date: new Date(currentYear, currentMonth, 16, 10, 0),
          note: "Technical e-book on System Architecture",
        },
        {
          userId: user1.id,
          amount: 1575, // $15.75
          category: "Food",
          date: new Date(currentYear, currentMonth, 18, 8, 45),
          note: "Morning artisanal coffee and croissant",
        },
        {
          userId: user1.id,
          amount: 3500, // $35.00
          category: "Travel",
          date: new Date(currentYear, currentMonth, 20, 17, 30),
          note: "Airport taxi ride",
        },
        {
          userId: user1.id,
          amount: 1450, // $14.50
          category: "Other",
          date: new Date(currentYear, currentMonth, 21, 13, 10),
          note: "Post office parcel shipping",
        },

        // Previous Month Expenses
        {
          userId: user1.id,
          amount: 11000, // $110.00
          category: "Bills",
          date: new Date(currentYear, currentMonth - 1, 4, 10, 0),
          note: "Quarterly water & waste bill",
        },
        {
          userId: user1.id,
          amount: 9400, // $94.00
          category: "Food",
          date: new Date(currentYear, currentMonth - 1, 8, 18, 0),
          note: "Family dinner party groceries",
        },
        {
          userId: user1.id,
          amount: 22000, // $220.00
          category: "Travel",
          date: new Date(currentYear, currentMonth - 1, 15, 7, 0),
          note: "Weekend getaway train tickets",
        },
        {
          userId: user1.id,
          amount: 4500, // $45.00
          category: "Shopping",
          date: new Date(currentYear, currentMonth - 1, 22, 15, 0),
          note: "Home decor & desk plant",
        },
      ];

      await db.insert(expenses).values(sampleExpenses);
      console.log(`Inserted ${sampleExpenses.length} sample expenses for Alex.`);
    }

    // Expenses for Sarah (User 2) in EUR
    const user2Expenses = await db
      .select()
      .from(expenses)
      .where(eq(expenses.userId, user2.id))
      .limit(1);

    if (user2Expenses.length === 0) {
      const now = new Date();
      await db.insert(expenses).values([
        {
          userId: user2.id,
          amount: 8500, // €85.00
          category: "Food",
          date: new Date(now.getFullYear(), now.getMonth(), 5, 13, 0),
          note: "Boulangerie & French market produce",
        },
        {
          userId: user2.id,
          amount: 4900, // €49.00
          category: "Travel",
          date: new Date(now.getFullYear(), now.getMonth(), 10, 9, 0),
          note: "Navigo monthly transit pass",
        },
      ]);
      console.log(`Inserted sample expenses for Sarah.`);
    }

    console.log(" Seeding completed successfully!");
  } catch (error) {
    console.error("Seeding error:", error);
  } finally {
    await client.end();
  }
}

seed();
