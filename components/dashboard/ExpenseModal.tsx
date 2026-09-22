"use client";

import React, { useState, useEffect } from "react";
import { EXPENSE_CATEGORIES, CATEGORY_CONFIG, type ExpenseCategory } from "@/lib/validation";
import { fromMinorUnits } from "@/lib/currency";
import { createExpenseAction, updateExpenseAction } from "@/lib/actions/expenses";
import { type Expense } from "@/db/schema";
import {
  X,
  Plus,
  Edit2,
  Calendar,
  DollarSign,
  Tag,
  FileText,
  Loader2,
  AlertCircle,
  Utensils,
  Plane,
  ShoppingBag,
  Receipt,
  Film,
  HeartPulse,
  GraduationCap,
  Layers,
} from "lucide-react";

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currency: string;
  expenseToEdit?: Expense | null;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Food: Utensils,
  Travel: Plane,
  Shopping: ShoppingBag,
  Bills: Receipt,
  Entertainment: Film,
  Health: HeartPulse,
  Education: GraduationCap,
  Other: Layers,
};

export function ExpenseModal({
  isOpen,
  onClose,
  onSuccess,
  currency,
  expenseToEdit,
}: ExpenseModalProps) {
  const isEditing = !!expenseToEdit;

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("Food");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setErrorMessage("");
      setFieldErrors({});

      if (expenseToEdit) {
        setAmount(fromMinorUnits(expenseToEdit.amount, currency).toString());
        setCategory(expenseToEdit.category as ExpenseCategory);
        const d = new Date(expenseToEdit.date);
        setDate(d.toISOString().split("T")[0]);
        setNote(expenseToEdit.note || "");
      } else {
        setAmount("");
        setCategory("Food");
        setDate(new Date().toISOString().split("T")[0]);
        setNote("");
      }
    }
  }, [isOpen, expenseToEdit, currency]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setFieldErrors({});

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setFieldErrors({ amount: "Please enter a valid amount greater than 0." });
      return;
    }

    if (!date) {
      setFieldErrors({ date: "Please select a date." });
      return;
    }

    setLoading(true);

    try {
      if (isEditing && expenseToEdit) {
        const res = await updateExpenseAction(expenseToEdit.id, {
          amount: numericAmount,
          category,
          date,
          note,
        });

        if (!res.success) {
          if (res.errors) setFieldErrors(res.errors);
          else setErrorMessage(res.error || "Failed to update expense.");
          return;
        }
      } else {
        const res = await createExpenseAction({
          amount: numericAmount,
          category,
          date,
          note,
        });

        if (!res.success) {
          if (res.errors) setFieldErrors(res.errors);
          else setErrorMessage(res.error || "Failed to create expense.");
          return;
        }
      }

      onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              isEditing ? "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400" : "bg-brand-100 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400"
            }`}>
              {isEditing ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {isEditing ? "Edit Expense" : "Add New Expense"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEditing ? "Update your transaction details" : "Record a transaction to track your spending"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2.5 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Amount Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
              Amount ({currency})
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
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
                className={`w-full pl-9 pr-4 py-3 rounded-2xl text-lg font-bold bg-slate-50 dark:bg-slate-800/60 border text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 transition-all ${
                  fieldErrors.amount
                    ? "border-rose-500 focus:ring-rose-500/30"
                    : "border-slate-200 dark:border-slate-700/80 focus:ring-brand-500/50 focus:border-brand-500"
                }`}
              />
            </div>
            {fieldErrors.amount && (
              <p className="mt-1 text-xs text-rose-500 font-medium">{fieldErrors.amount}</p>
            )}
          </div>

          {/* Category Selector with Colorful Badges */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
              Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {EXPENSE_CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                const IconComponent = CATEGORY_ICONS[cat] || Layers;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-brand-50 dark:bg-brand-950/60 border-brand-500 text-brand-700 dark:text-brand-300 ring-2 ring-brand-500/30 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
              Date
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-50 dark:bg-slate-800/60 border text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 transition-all ${
                  fieldErrors.date
                    ? "border-rose-500 focus:ring-rose-500/30"
                    : "border-slate-200 dark:border-slate-700/80 focus:ring-brand-500/50 focus:border-brand-500"
                }`}
              />
            </div>
            {fieldErrors.date && (
              <p className="mt-1 text-xs text-rose-500 font-medium">{fieldErrors.date}</p>
            )}
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
              Note (Optional)
            </label>
            <textarea
              rows={2}
              maxLength={500}
              placeholder="e.g. Lunch with team, monthly utility, flights..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all resize-none"
            />
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-600/30 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : isEditing ? (
                <>
                  <Edit2 className="w-4 h-4" />
                  <span>Update Expense</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Save Expense</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
