export const EXPENSE_CATEGORIES = [
  "Food",
  "Travel",
  "Shopping",
  "Bills",
  "Entertainment",
  "Health",
  "Education",
  "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface CategoryMeta {
  name: ExpenseCategory;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}

export const CATEGORY_CONFIG: Record<ExpenseCategory, CategoryMeta> = {
  Food: {
    name: "Food",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/40",
    borderColor: "border-amber-200 dark:border-amber-800/50",
    icon: "Utensils",
  },
  Travel: {
    name: "Travel",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/40",
    borderColor: "border-blue-200 dark:border-blue-800/50",
    icon: "Plane",
  },
  Shopping: {
    name: "Shopping",
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-50 dark:bg-pink-950/40",
    borderColor: "border-pink-200 dark:border-pink-800/50",
    icon: "ShoppingBag",
  },
  Bills: {
    name: "Bills",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
    borderColor: "border-emerald-200 dark:border-emerald-800/50",
    icon: "Receipt",
  },
  Entertainment: {
    name: "Entertainment",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/40",
    borderColor: "border-purple-200 dark:border-purple-800/50",
    icon: "Film",
  },
  Health: {
    name: "Health",
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-50 dark:bg-rose-950/40",
    borderColor: "border-rose-200 dark:border-rose-800/50",
    icon: "HeartPulse",
  },
  Education: {
    name: "Education",
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/40",
    borderColor: "border-indigo-200 dark:border-indigo-800/50",
    icon: "GraduationCap",
  },
  Other: {
    name: "Other",
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-50 dark:bg-slate-900/50",
    borderColor: "border-slate-200 dark:border-slate-700/50",
    icon: "Layers",
  },
};

export function validateExpenseInput(data: {
  amount: number | string;
  category: string;
  date: string | Date;
  note?: string | null;
}) {
  const errors: Record<string, string> = {};

  const numAmount = typeof data.amount === "string" ? parseFloat(data.amount) : data.amount;
  if (isNaN(numAmount) || numAmount <= 0) {
    errors.amount = "Amount must be a positive number greater than 0.";
  }

  if (!data.category || !EXPENSE_CATEGORIES.includes(data.category as ExpenseCategory)) {
    errors.category = `Please select a valid category (${EXPENSE_CATEGORIES.join(", ")}).`;
  }

  const parsedDate = new Date(data.date);
  if (isNaN(parsedDate.getTime())) {
    errors.date = "Please enter a valid date.";
  }

  if (data.note && data.note.length > 500) {
    errors.note = "Note cannot exceed 500 characters.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateAuthInput(data: {
  email: string;
  password?: string;
  name?: string;
}) {
  const errors: Record<string, string> = {};

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (data.password !== undefined && data.password.length < 6) {
    errors.password = "Password must be at least 6 characters long.";
  }

  if (data.name !== undefined && data.name.trim().length === 0) {
    errors.name = "Name is required.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
