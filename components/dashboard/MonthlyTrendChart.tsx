"use client";

import React from "react";
import { formatCurrency, fromMinorUnits } from "@/lib/currency";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { TrendingUp } from "lucide-react";

interface MonthlyTrendChartProps {
  monthlyTrends: {
    monthKey: string;
    monthLabel: string;
    totalMinor: number;
  }[];
  currency: string;
  selectedMonth: string;
  onSelectMonth?: (monthKey: string) => void;
}

export function MonthlyTrendChart({
  monthlyTrends,
  currency,
  selectedMonth,
  onSelectMonth,
}: MonthlyTrendChartProps) {
  const chartData = monthlyTrends.map((t) => ({
    key: t.monthKey,
    name: t.monthLabel,
    amount: fromMinorUnits(t.totalMinor, currency),
    minorUnits: t.totalMinor,
    isSelected: t.monthKey === selectedMonth,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white text-xs p-3 rounded-xl shadow-xl border border-slate-700">
          <p className="font-semibold text-sm mb-1">{data.name}</p>
          <p className="text-brand-400 font-bold">
            {formatCurrency(data.minorUnits, currency)}
          </p>
          <p className="text-slate-400 text-[10px] mt-1">Click bar to filter by this month</p>
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
              <TrendingUp className="w-4 h-4 text-teal-500" />
              Monthly Spending Trends
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Spending history over the past 6 months
            </p>
          </div>
        </div>

        <div className="h-[250px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800"
              />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "currentColor" }}
                className="text-slate-500 dark:text-slate-400"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "currentColor" }}
                className="text-slate-500 dark:text-slate-400"
                tickFormatter={(value) => `${value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(148, 163, 184, 0.1)" }} />
              <Bar
                dataKey="amount"
                radius={[6, 6, 0, 0]}
                onClick={(entry: any) => onSelectMonth && onSelectMonth(entry.key)}
                className="cursor-pointer"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`bar-${index}`}
                    fill={entry.isSelected ? "#059669" : "#10b981"}
                    className={entry.isSelected ? "opacity-100 ring-2 ring-brand-400" : "opacity-80 hover:opacity-100"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>Click any bar to filter expenses</span>
        <span className="font-semibold text-brand-600 dark:text-brand-400">Past 6 Months</span>
      </div>
    </div>
  );
}
