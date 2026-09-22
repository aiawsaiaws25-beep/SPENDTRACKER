"use client";

import React, { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { type Expense, type User } from "@/db/schema";
import { type DashboardAnalytics } from "@/lib/actions/expenses";
import { Navbar } from "./Navbar";
import { SummaryCards } from "./SummaryCards";
import { CategoryChart } from "./CategoryChart";
import { MonthlyTrendChart } from "./MonthlyTrendChart";
import { ExpenseFilter } from "./ExpenseFilter";
import { QuickAddBar } from "./QuickAddBar";
import { ExpenseList } from "./ExpenseList";
import { ExpenseModal } from "./ExpenseModal";
import { Plus, Sparkles, RefreshCw } from "lucide-react";

interface DashboardClientProps {
  user: User;
  initialExpenses: Expense[];
  initialAnalytics: DashboardAnalytics;
  selectedMonth: string;
  selectedCategory: string;
}

export function DashboardClient({
  user,
  initialExpenses,
  initialAnalytics,
  selectedMonth: serverSelectedMonth,
  selectedCategory: serverSelectedCategory,
}: DashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Local filter states
  const [selectedMonth, setSelectedMonth] = useState(serverSelectedMonth);
  const [selectedCategory, setSelectedCategory] = useState(serverSelectedCategory);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  const applyFilters = (month: string, category: string) => {
    setSelectedMonth(month);
    setSelectedCategory(category);

    startTransition(() => {
      const params = new URLSearchParams();
      if (month && month !== "all") params.set("month", month);
      if (category && category !== "all") params.set("category", category);
      router.push(`/dashboard?${params.toString()}`);
    });
  };

  const handleMonthChange = (month: string) => {
    applyFilters(month, selectedCategory);
  };

  const handleCategoryChange = (category: string) => {
    applyFilters(selectedMonth, category);
  };

  const handleOpenAddModal = () => {
    setExpenseToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (expense: Expense) => {
    setExpenseToEdit(expense);
    setModalOpen(true);
  };

  const handleDataRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const handleResetFilters = () => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(currentMonthKey);
    setSelectedCategory("all");
    setSearchQuery("");
    applyFilters(currentMonthKey, "all");
  };

  // Client-side text search filtering
  const filteredExpenses = initialExpenses.filter((exp) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      exp.category.toLowerCase().includes(q) ||
      (exp.note && exp.note.toLowerCase().includes(q))
    );
  });

  const isFiltered =
    selectedMonth !== "all" ||
    selectedCategory !== "all" ||
    searchQuery.trim().length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950 transition-colors">
      {/* Navbar */}
      <Navbar
        user={{ name: user.name, email: user.email, currency: user.currency }}
        onOpenAddModal={handleOpenAddModal}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Welcome Header & Quick Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <span>Financial Overview</span>
              {isPending && <RefreshCw className="w-4 h-4 text-brand-500 animate-spin" />}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Welcome back, <span className="font-semibold text-slate-800 dark:text-slate-200">{user.name}</span>. Here&apos;s your expense summary.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAddModal}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-brand-600/25 hover:shadow-brand-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        {/* 1. Quick Add Inline Bar */}
        <QuickAddBar currency={user.currency} onSuccess={handleDataRefresh} />

        {/* 2. Top Summary KPI Cards */}
        <SummaryCards
          monthlyTotalMinor={initialAnalytics.monthlyTotalMinor}
          monthlyExpensesCount={initialAnalytics.monthlyExpensesCount}
          totalSpentMinor={initialAnalytics.totalSpentMinor}
          totalExpensesCount={initialAnalytics.totalExpensesCount}
          topCategory={initialAnalytics.topCategory}
          currency={user.currency}
          selectedMonth={selectedMonth}
        />

        {/* 3. Visual Charts Grid (Category Donut & Monthly Trends) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CategoryChart
            categoryBreakdown={initialAnalytics.categoryBreakdown}
            currency={user.currency}
          />
          <MonthlyTrendChart
            monthlyTrends={initialAnalytics.monthlyTrends}
            currency={user.currency}
            selectedMonth={selectedMonth}
            onSelectMonth={handleMonthChange}
          />
        </div>

        {/* 4. Filter Bar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Transaction History
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Showing {filteredExpenses.length} {filteredExpenses.length === 1 ? "expense" : "expenses"}
              </p>
            </div>
          </div>

          <ExpenseFilter
            selectedMonth={selectedMonth}
            selectedCategory={selectedCategory}
            searchQuery={searchQuery}
            onMonthChange={handleMonthChange}
            onCategoryChange={handleCategoryChange}
            onSearchChange={setSearchQuery}
            totalFilteredCount={filteredExpenses.length}
          />

          {/* 5. Expense Table / Card List */}
          <ExpenseList
            expenses={filteredExpenses}
            currency={user.currency}
            onEditExpense={handleOpenEditModal}
            onRefresh={handleDataRefresh}
            onOpenAddModal={handleOpenAddModal}
            isFiltered={isFiltered}
            onResetFilters={handleResetFilters}
          />
        </div>
      </main>

      {/* Expense Modal (Add / Edit) */}
      <ExpenseModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleDataRefresh}
        currency={user.currency}
        expenseToEdit={expenseToEdit}
      />
    </div>
  );
}
