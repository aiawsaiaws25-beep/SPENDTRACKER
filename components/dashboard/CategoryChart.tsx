"use client";

import React from "react";
import { formatCurrency, fromMinorUnits } from "@/lib/currency";
import { CATEGORY_CONFIG, type ExpenseCategory } from "@/lib/validation";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";

interface CategoryChartProps {
  categoryBreakdown: {
    category: ExpenseCategory;
    totalMinor: number;
    count: number;
    percentage: number;
  }[];
  currency: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Food: "#f97316", // Amber / Orange
  Travel: "#3b82f6", // Blue
  Shopping: "#ec4899", // Pink
  Bills: "#10b981", // Emerald
  Entertainment: "#8b5cf6", // Purple
  Health: "#f43f5e", // Rose
  Education: "#6366f1", // Indigo
  Other: "#64748b", // Slate
};

export function CategoryChart({ categoryBreakdown, currency }: CategoryChartProps) {
  if (!categoryBreakdown || categoryBreakdown.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 flex flex-col items-center justify-center min-h-[340px] text-center shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
          <PieChartIcon className="w-6 h-6" />
        </div>
        <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-base">
          No Category Data Yet
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1">
          Add an expense with a category like Food, Travel, or Bills to view your breakdown chart.
        </p>
      </div>
    );
  }

  const chartData = categoryBreakdown.map((item) => ({
    name: item.category,
    value: fromMinorUnits(item.totalMinor, currency),
    minorUnits: item.totalMinor,
    count: item.count,
    percentage: item.percentage,
    color: CATEGORY_COLORS[item.category] || "#64748b",
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white text-xs p-3 rounded-xl shadow-xl border border-slate-700 space-y-1">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            <span className="font-semibold text-sm">{data.name}</span>
          </div>
          <p className="text-slate-300 font-medium">
            {formatCurrency(data.minorUnits, currency)} ({data.percentage}%)
          </p>
          <p className="text-slate-400 text-[11px]">{data.count} transactions</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-brand-500" />
              Category Breakdown
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Spending distribution for the selected period
            </p>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="h-[220px] w-full relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={88}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    className="hover:opacity-85 transition-opacity cursor-pointer focus:outline-none"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Progress Bars List */}
      <div className="mt-4 space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
        {categoryBreakdown.slice(0, 5).map((item) => {
          const color = CATEGORY_COLORS[item.category] || "#64748b";
          return (
            <div key={item.category} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-slate-800 dark:text-slate-200">{item.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                    {item.percentage}%
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {formatCurrency(item.totalMinor, currency)}
                  </span>
                </div>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(item.percentage, 3)}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
