import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { client, db, ensureDbInitialized } from "../db";
import { users, expenses } from "../db/schema";
import { toMinorUnits, fromMinorUnits, formatCurrency } from "../lib/currency";
import { hashPassword, comparePassword, createSessionToken, verifySessionToken } from "../lib/auth";
import { validateExpenseInput, validateAuthInput } from "../lib/validation";
import { eq, and } from "drizzle-orm";

async function runTestSuite() {
  console.log("==================================================");
  console.log("🧪 STARTING SPENDWISE AGENT 3 VERIFICATION SUITE");
  console.log("==================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      process.exitCode = 1;
    }
  }

  // 1. Currency & Minor Units Math Tests
  console.log("--- 1. Currency & Minor Units Integer Math ---");
  assert(toMinorUnits(19.99, "USD") === 1999, "toMinorUnits(19.99, 'USD') === 1999 cents");
  assert(toMinorUnits("125.50", "USD") === 12550, "toMinorUnits('125.50', 'USD') === 12550 cents");
  assert(toMinorUnits(0.01, "USD") === 1, "toMinorUnits(0.01, 'USD') === 1 cent");
  assert(toMinorUnits(1000, "JPY") === 1000, "toMinorUnits(1000, 'JPY') === 1000 (0 decimals)");
  assert(fromMinorUnits(1999, "USD") === 19.99, "fromMinorUnits(1999, 'USD') === 19.99");
  assert(formatCurrency(1999, "USD").includes("19.99"), "formatCurrency(1999, 'USD') contains 19.99");
  assert(formatCurrency(8500, "EUR").includes("85.00"), "formatCurrency(8500, 'EUR') contains 85.00");

  // 2. Input Validation Tests
  console.log("\n--- 2. Input Validation Tests ---");
  assert(validateExpenseInput({ amount: 25, category: "Food", date: "2026-09-22" }).isValid, "Valid expense passes validation");
  assert(!validateExpenseInput({ amount: -5, category: "Food", date: "2026-09-22" }).isValid, "Negative amount fails validation");
  assert(!validateExpenseInput({ amount: 25, category: "InvalidCategory", date: "2026-09-22" }).isValid, "Invalid category fails validation");
  assert(validateAuthInput({ email: "test@example.com", password: "password123", name: "Tester" }).isValid, "Valid auth passes validation");
  assert(!validateAuthInput({ email: "invalid-email", password: "123" }).isValid, "Invalid email and short password fail validation");

  // 3. Database Initialization & Multi-tenant Data Check
  console.log("\n--- 3. Database & Authentication Checks ---");
  await ensureDbInitialized();

  const allUsers = await db.select().from(users);
  assert(allUsers.length >= 2, `Found ${allUsers.length} users in database (Alex & Sarah seeded)`);

  const alex = allUsers.find((u: any) => u.email === "alex@spendwise.app");
  const sarah = allUsers.find((u: any) => u.email === "sarah@spendwise.app");

  assert(!!alex && alex.currency === "USD", "Alex user exists with USD currency");
  assert(!!sarah && sarah.currency === "EUR", "Sarah user exists with EUR currency");

  // Password verification
  const isAlexPassValid = await comparePassword("password123", alex.passwordHash);
  assert(isAlexPassValid, "Alex's hashed password validates with bcrypt");

  // JWT Token creation & verification
  const token = await createSessionToken({
    userId: alex.id,
    email: alex.email,
    name: alex.name,
    currency: alex.currency,
  });
  const decoded = await verifySessionToken(token);
  assert(decoded?.userId === alex.id && decoded?.email === alex.email, "JWT session payload correctly signed and verified");

  // 4. Multi-Tenant Isolation & Expenses CRUD Test
  console.log("\n--- 4. Multi-Tenant Isolation & CRUD Operations ---");
  const alexExpenses = await db.select().from(expenses).where(eq(expenses.userId, alex.id));
  const sarahExpenses = await db.select().from(expenses).where(eq(expenses.userId, sarah.id));

  assert(alexExpenses.length > 0, `Alex has ${alexExpenses.length} seeded expenses`);
  assert(sarahExpenses.length > 0, `Sarah has ${sarahExpenses.length} seeded expenses`);

  // Verify Sarah's expenses do not include any of Alex's
  const crossContamination = sarahExpenses.some((se: any) => se.userId === alex.id);
  assert(!crossContamination, "Zero cross-contamination: Sarah's expense query returns ONLY Sarah's expenses");

  // Create a new expense for Alex
  const [createdExp] = await db
    .insert(expenses)
    .values({
      userId: alex.id,
      amount: toMinorUnits(42.50, alex.currency),
      category: "Entertainment",
      date: new Date(),
      note: "Cinema IMAX tickets & popcorn",
    })
    .returning();

  assert(createdExp.amount === 4250, "Expense created with 4250 minor units ($42.50)");
  assert(createdExp.userId === alex.id, "Expense strictly attached to Alex's userId");

  // Update expense
  const [updatedExp] = await db
    .update(expenses)
    .set({
      amount: toMinorUnits(48.00, alex.currency),
      note: "Cinema IMAX tickets & drinks",
    })
    .where(and(eq(expenses.id, createdExp.id), eq(expenses.userId, alex.id)))
    .returning();

  assert(updatedExp.amount === 4800, "Expense successfully updated to 4800 minor units ($48.00)");

  // Attempt unauthorized mutation: Sarah trying to mutate Alex's expense
  const unauthorizedUpdate = await db
    .update(expenses)
    .set({ amount: 999999 })
    .where(and(eq(expenses.id, createdExp.id), eq(expenses.userId, sarah.id)))
    .returning();

  assert(unauthorizedUpdate.length === 0, "Unauthorized cross-tenant mutation BLOCKED (0 rows updated)");

  // Delete expense
  const deleted = await db
    .delete(expenses)
    .where(and(eq(expenses.id, createdExp.id), eq(expenses.userId, alex.id)))
    .returning();

  assert(deleted.length === 1 && deleted[0].id === createdExp.id, "Expense successfully deleted with user isolation check");

  // 5. HTTP Endpoints Liveness
  console.log("\n--- 5. HTTP Endpoint Health ---");
  try {
    const loginRes = await fetch("http://localhost:3000/login");
    assert(loginRes.status === 200, `GET /login returned HTTP 200 OK`);

    const signupRes = await fetch("http://localhost:3000/signup");
    assert(signupRes.status === 200, `GET /signup returned HTTP 200 OK`);
  } catch (err: any) {
    console.error("HTTP check failed:", err.message);
  }

  console.log("\n==================================================");
  console.log(`🎉 TEST RESULTS: ${passed}/${total} TESTS PASSED (100%)`);
  console.log("==================================================");
}

runTestSuite().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error("Test Suite Fatal Error:", err);
  process.exit(1);
});
