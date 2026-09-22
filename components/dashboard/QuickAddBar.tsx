"use client";

import React, { useState } from "react";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/lib/validation";
import { createExpenseAction } from "@/lib/actions/expenses";
import { Plus, Zap, Loader2 } from "lucide-react";

interface QuickAddBarProps {
  currency: string;
  onSuccess: () => void;
}

export function QuickAddBar({ currency, onSuccess }: QuickAddBarProps) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("Food");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await createExpenseAction({
        amount: numericAmount,
        category,
        date: today,
        note: note.trim() || undefined,
      });

      if (res.success) {
        setAmount("");
        setNote("");
        onSuccess();
      } else {
        setError(res.error || "Failed to add expense");
      }
    } catch {
      setError("Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleQuickAdd}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-3 sm:p-4 shadow-sm flex flex-wrap items-center gap-2.5 transition-all focus-within:border-brand-500/60 focus-within:ring-2 focus-within:ring-brand-500/20"
    >
      <div className="flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 pl-1">
        <Zap className="w-3.5 h-3.5 fill-brand-500 text-brand-500" />
        <span className="hidden sm:inline">Quick Add:</span>
      </div>

      {/* Amount input */}
      <div className="relative min-w-[110px] flex-1 sm:flex-initial">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
          $
        </span>
        <input
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full pl-6 pr-2.5 py-1.5 rounded-xl text-sm font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 focus:outline-none"
        />
      </div>

      {/* Category selector */}
      <div className="relative min-w-[130px]">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
          aria-label="Quick add category"
          className="w-full px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 focus:outline-none appearance-none cursor-pointer"
        >
          {EXPENSE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
          ▼
        </div>
      </div>

      {/* Note input */}
      <input
        type="text"
        placeholder="Brief note (optional)..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="flex-1 min-w-[140px] px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
      />

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !amount}
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm shadow-brand-600/30 disabled:opacity-50 transition-all shrink-0"
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <>
            <Plus className="w-3.5 h-3.5" />
            <span>Log</span>
          </>
        )}
      </button>

      {error && <span className="w-full text-xs text-rose-500 font-medium pl-1">{error}</span>}
    </form>
  );
}
