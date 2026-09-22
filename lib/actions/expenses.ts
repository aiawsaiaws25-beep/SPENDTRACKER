"use server";

import { db } from "@/db";
import { expenses, type Expense } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { toMinorUnits } from "@/lib/currency";
import { validateExpenseInput, type ExpenseCategory } from "@/lib/validation";
import { and, desc, eq, gte, lte, ilike, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface ExpenseFilterParams {
  month?: string; // "YYYY-MM" or "all"
  category?: string; // category name or "all"
  search?: string;
}

export interface DashboardAnalytics {
  totalSpentMinor: number;
  totalExpensesCount: number;
  monthlyTotalMinor: number;
  monthlyExpensesCount: number;
  topCategory: {
    name: string;
    amountMinor: number;
    percentage: number;
  } | null;
  categoryBreakdown: {
    category: ExpenseCategory;
    totalMinor: number;
    count: number;
    percentage: number;
  }[];
  monthlyTrends: {
    monthKey: string; // "YYYY-MM"
    monthLabel: string; // "Jan 2026"
    totalMinor: number;
  }[];
}

export async function getExpensesWithAnalytics(filters?: ExpenseFilterParams): Promise<{
  expenses: Expense[];
  analytics: DashboardAnalytics;
  selectedMonth: string;
  selectedCategory: string;
}> {
  const user = await requireAuth();

  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const targetMonth = filters?.month && filters.month !== "all" ? filters.month : currentYearMonth;
  const targetCategory = filters?.category && filters.category !== "all" ? filters.category : "all";
  const searchQuery = filters?.search?.trim();

  // Fetch all user expenses for analytics calculations (ordered by date desc)
  const allUserExpenses = await db
    .select()
    .from(expenses)
    .where(eq(expenses.userId, user.id))
    .orderBy(desc(expenses.date));

  // Compute analytics
  let totalSpentMinor = 0;
  let monthlyTotalMinor = 0;
  let monthlyExpensesCount = 0;

  const categoryTotals: Record<string, { totalMinor: number; count: number }> = {};
  const monthTotalsMap: Record<string, number> = {};

  // Initialize past 6 months keys for trend chart
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthTotalsMap[key] = 0;
  }

  for (const exp of allUserExpenses) {
    totalSpentMinor += exp.amount;

    const expDate = new Date(exp.date);
    const expMonthKey = `${expDate.getFullYear()}-${String(expDate.getMonth() + 1).padStart(2, "0")}`;

    if (monthTotalsMap[expMonthKey] !== undefined) {
      monthTotalsMap[expMonthKey] += exp.amount;
    }

    // Filter for the selected month's analytics
    if (targetMonth === "all" || expMonthKey === targetMonth) {
      monthlyTotalMinor += exp.amount;
      monthlyExpensesCount++;

      if (!categoryTotals[exp.category]) {
        categoryTotals[exp.category] = { totalMinor: 0, count: 0 };
      }
      categoryTotals[exp.category].totalMinor += exp.amount;
      categoryTotals[exp.category].count += 1;
    }
  }

  const categoryBreakdown = Object.entries(categoryTotals)
    .map(([cat, data]) => ({
      category: cat as ExpenseCategory,
      totalMinor: data.totalMinor,
      count: data.count,
      percentage: monthlyTotalMinor > 0 ? Math.round((data.totalMinor / monthlyTotalMinor) * 100) : 0,
    }))
    .sort((a, b) => b.totalMinor - a.totalMinor);

  const topCategory = categoryBreakdown.length > 0 ? {
    name: categoryBreakdown[0].category,
    amountMinor: categoryBreakdown[0].totalMinor,
    percentage: categoryBreakdown[0].percentage,
  } : null;

  const monthlyTrends = Object.entries(monthTotalsMap).map(([key, totalMinor]) => {
    const [year, month] = key.split("-");
    const d = new Date(parseInt(year), parseInt(month) - 1, 1);
    const monthLabel = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    return {
      monthKey: key,
      monthLabel,
      totalMinor,
    };
  });

  // Filter expenses list based on parameters
  let filteredExpenses: Expense[] = allUserExpenses;

  if (targetMonth !== "all") {
    filteredExpenses = filteredExpenses.filter((exp: Expense) => {
      const expDate = new Date(exp.date);
      const expMonthKey = `${expDate.getFullYear()}-${String(expDate.getMonth() + 1).padStart(2, "0")}`;
      return expMonthKey === targetMonth;
    });
  }

  if (targetCategory !== "all") {
    filteredExpenses = filteredExpenses.filter((exp: Expense) => exp.category === targetCategory);
  }

  if (searchQuery) {
    const lowerQuery = searchQuery.toLowerCase();
    filteredExpenses = filteredExpenses.filter((exp: Expense) =>
      exp.category.toLowerCase().includes(lowerQuery) ||
      (exp.note && exp.note.toLowerCase().includes(lowerQuery))
    );
  }

  return {
    expenses: filteredExpenses,
    analytics: {
      totalSpentMinor,
      totalExpensesCount: allUserExpenses.length,
      monthlyTotalMinor,
      monthlyExpensesCount,
      topCategory,
      categoryBreakdown,
      monthlyTrends,
    },
    selectedMonth: targetMonth,
    selectedCategory: targetCategory,
  };
}

export async function createExpenseAction(data: {
  amount: number | string;
  category: string;
  date: string;
  note?: string;
}) {
  const user = await requireAuth();

  const validation = validateExpenseInput(data);
  if (!validation.isValid) {
    return { success: false, errors: validation.errors };
  }

  try {
    const amountMinor = toMinorUnits(data.amount, user.currency);
    const expenseDate = new Date(data.date);

    const [newExpense] = await db
      .insert(expenses)
      .values({
        userId: user.id,
        amount: amountMinor,
        category: data.category,
        date: expenseDate,
        note: data.note?.trim() || null,
      })
      .returning();

    revalidatePath("/dashboard");
    return { success: true, expense: newExpense };
  } catch (error) {
    console.error("Error creating expense:", error);
    return { success: false, error: "Failed to create expense. Please try again." };
  }
}

export async function updateExpenseAction(
  id: string,
  data: {
    amount: number | string;
    category: string;
    date: string;
    note?: string;
  }
) {
  const user = await requireAuth();

  const validation = validateExpenseInput(data);
  if (!validation.isValid) {
    return { success: false, errors: validation.errors };
  }

  try {
    // Tenant check: ensure the expense belongs to this user
    const existing = await db
      .select()
      .from(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.userId, user.id)))
      .limit(1);

    if (existing.length === 0) {
      return { success: false, error: "Expense not found or unauthorized." };
    }

    const amountMinor = toMinorUnits(data.amount, user.currency);
    const expenseDate = new Date(data.date);

    const [updatedExpense] = await db
      .update(expenses)
      .set({
        amount: amountMinor,
        category: data.category,
        date: expenseDate,
        note: data.note?.trim() || null,
        updatedAt: new Date(),
      })
      .where(and(eq(expenses.id, id), eq(expenses.userId, user.id)))
      .returning();

    revalidatePath("/dashboard");
    return { success: true, expense: updatedExpense };
  } catch (error) {
    console.error("Error updating expense:", error);
    return { success: false, error: "Failed to update expense. Please try again." };
  }
}

export async function deleteExpenseAction(id: string) {
  const user = await requireAuth();

  try {
    // Tenant check: ensure the expense belongs to this user
    const deleted = await db
      .delete(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.userId, user.id)))
      .returning();

    if (deleted.length === 0) {
      return { success: false, error: "Expense not found or unauthorized." };
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error deleting expense:", error);
    return { success: false, error: "Failed to delete expense." };
  }
}
