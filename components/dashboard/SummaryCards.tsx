"use client";

import React from "react";
import { formatCurrency } from "@/lib/currency";
import { CATEGORY_CONFIG, type ExpenseCategory } from "@/lib/validation";
import {
  TrendingUp,
  CreditCard,
  PieChart,
  Calendar,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

interface SummaryCardsProps {
  monthlyTotalMinor: number;
  monthlyExpensesCount: number;
  totalSpentMinor: number;
  totalExpensesCount: number;
  topCategory: {
    name: string;
    amountMinor: number;
    percentage: number;
  } | null;
  currency: string;
  selectedMonth: string;
}

export function SummaryCards({
  monthlyTotalMinor,
  monthlyExpensesCount,
  totalSpentMinor,
  totalExpensesCount,
  topCategory,
  currency,
  selectedMonth,
}: SummaryCardsProps) {
  // Format month for display
  let monthDisplayName = "This Month";
  if (selectedMonth && selectedMonth !== "all") {
    const [y, m] = selectedMonth.split("-");
    const d = new Date(parseInt(y), parseInt(m) - 1, 1);
    monthDisplayName = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  } else if (selectedMonth === "all") {
    monthDisplayName = "All Time";
  }

  const topCategoryMeta = topCategory?.name
    ? CATEGORY_CONFIG[topCategory.name as ExpenseCategory] || CATEGORY_CONFIG.Other
    : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Selected Month Total Spending Card (Primary Highlight) */}
      <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-brand-600 via-brand-700 to-teal-800 text-white shadow-lg shadow-brand-700/20">
        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium tracking-wide text-brand-100 uppercase">
            {monthDisplayName} Spend
          </span>
          <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
            <CreditCard className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-3xl font-extrabold tracking-tight">
            {formatCurrency(monthlyTotalMinor, currency)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-brand-100">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white/20 font-medium">
              {monthlyExpensesCount} {monthlyExpensesCount === 1 ? "expense" : "expenses"}
            </span>
            <span>logged</span>
          </div>
        </div>
      </div>

      {/* 2. Top Category Card */}
      <div className="relative overflow-hidden rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Top Category
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <PieChart className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          {topCategory && topCategoryMeta ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {topCategory.name}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                  {topCategory.percentage}%
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {formatCurrency(topCategory.amountMinor, currency)} total in {monthDisplayName}
              </p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-slate-400 dark:text-slate-600">None yet</p>
              <p className="mt-2 text-xs text-slate-500">Log an expense to see breakdown</p>
            </>
          )}
        </div>
      </div>

      {/* 3. All-Time Cumulative Spend Card */}
      <div className="relative overflow-hidden rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            All-Time Total
          </span>
          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {formatCurrency(totalSpentMinor, currency)}
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span>{totalExpensesCount} total records in history</span>
          </p>
        </div>
      </div>

      {/* 4. Insights / Average Card */}
      <div className="relative overflow-hidden rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Average Per Expense
          </span>
          <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {monthlyExpensesCount > 0
              ? formatCurrency(Math.round(monthlyTotalMinor / monthlyExpensesCount), currency)
              : formatCurrency(0, currency)}
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Based on {monthlyExpensesCount} transactions this month
          </p>
        </div>
      </div>
    </div>
  );
}
