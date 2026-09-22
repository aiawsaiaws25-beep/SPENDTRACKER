"use client";

import React, { useState } from "react";
import { type Expense } from "@/db/schema";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/utils";
import { CATEGORY_CONFIG, type ExpenseCategory } from "@/lib/validation";
import { deleteExpenseAction } from "@/lib/actions/expenses";
import {
  Edit2,
  Trash2,
  Receipt,
  Utensils,
  Plane,
  ShoppingBag,
  Film,
  HeartPulse,
  GraduationCap,
  Layers,
  Loader2,
  Inbox,
  AlertTriangle,
  Calendar,
} from "lucide-react";

interface ExpenseListProps {
  expenses: Expense[];
  currency: string;
  onEditExpense: (expense: Expense) => void;
  onRefresh: () => void;
  onOpenAddModal: () => void;
  isFiltered: boolean;
  onResetFilters: () => void;
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

export function ExpenseList({
  expenses,
  currency,
  onEditExpense,
  onRefresh,
  onOpenAddModal,
  isFiltered,
  onResetFilters,
}: ExpenseListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setDeleteError(null);
    try {
      const res = await deleteExpenseAction(id);
      if (res.success) {
        setConfirmDeleteId(null);
        onRefresh();
      } else {
        setDeleteError(res.error || "Failed to delete expense");
      }
    } catch {
      setDeleteError("Failed to delete expense");
    } finally {
      setDeletingId(null);
    }
  };

  if (expenses.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-8 sm:p-12 text-center shadow-sm">
        <div className="w-16 h-16 rounded-3xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-4 shadow-inner">
          <Inbox className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          {isFiltered ? "No matching expenses found" : "No expenses recorded yet"}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1.5 mb-6">
          {isFiltered
            ? "Try changing your search keywords, category, or selected month filter."
            : "Start tracking your spending by adding your first transaction."}
        </p>
        <div className="flex items-center justify-center gap-3">
          {isFiltered ? (
            <button
              onClick={onResetFilters}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
            >
              Reset Filters
            </button>
          ) : (
            <button
              onClick={onOpenAddModal}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-600/30 transition-all"
            >
              Add First Expense
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
      {deleteError && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 border-b border-rose-200">
          <AlertTriangle className="w-4 h-4" />
          <span>{deleteError}</span>
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 px-6">Category</th>
              <th className="py-3.5 px-6">Note / Description</th>
              <th className="py-3.5 px-6">Date</th>
              <th className="py-3.5 px-6 text-right">Amount</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {expenses.map((expense) => {
              const meta = CATEGORY_CONFIG[expense.category as ExpenseCategory] || CATEGORY_CONFIG.Other;
              const IconComp = CATEGORY_ICONS[expense.category] || Layers;
              const isConfirming = confirmDeleteId === expense.id;
              const isDeleting = deletingId === expense.id;

              return (
                <tr
                  key={expense.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                >
                  {/* Category Pill */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${meta.bgColor} ${meta.color}`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                        {expense.category}
                      </span>
                    </div>
                  </td>

                  {/* Note */}
                  <td className="py-4 px-6 max-w-xs truncate text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
                    {expense.note ? (
                      <span>{expense.note}</span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-600 italic">No note provided</span>
                    )}
                  </td>

                  {/* Date */}
                  <td className="py-4 px-6 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
                    {formatDate(expense.date)}
                  </td>

                  {/* Amount */}
                  <td className="py-4 px-6 text-right font-bold text-slate-900 dark:text-slate-100 text-sm whitespace-nowrap">
                    {formatCurrency(expense.amount, currency)}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    {isConfirming ? (
                      <div className="flex items-center justify-end gap-1.5 animate-in fade-in">
                        <button
                          onClick={() => handleDelete(expense.id)}
                          disabled={isDeleting}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
                        >
                          {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirm"}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          disabled={isDeleting}
                          className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEditExpense(expense)}
                          aria-label="Edit expense"
                          title="Edit"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(expense.id)}
                          aria-label="Delete expense"
                          title="Delete"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
        {expenses.map((expense) => {
          const meta = CATEGORY_CONFIG[expense.category as ExpenseCategory] || CATEGORY_CONFIG.Other;
          const IconComp = CATEGORY_ICONS[expense.category] || Layers;
          const isConfirming = confirmDeleteId === expense.id;
          const isDeleting = deletingId === expense.id;

          return (
            <div key={expense.id} className="p-4 space-y-2.5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${meta.bgColor} ${meta.color}`}>
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {expense.category}
                    </h4>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {formatDate(expense.date)}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                    {formatCurrency(expense.amount, currency)}
                  </span>
                </div>
              </div>

              {expense.note && (
                <p className="text-xs text-slate-600 dark:text-slate-300 pl-10">
                  {expense.note}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-50 dark:border-slate-800/60">
                {isConfirming ? (
                  <div className="flex items-center gap-1.5 w-full justify-end">
                    <span className="text-xs text-rose-500 font-medium mr-1">Delete?</span>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      disabled={isDeleting}
                      className="px-3 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold"
                    >
                      {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Yes"}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      disabled={isDeleting}
                      className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => onEditExpense(expense)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800"
                    >
                      <Edit2 className="w-3 h-3 text-brand-500" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(expense.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
