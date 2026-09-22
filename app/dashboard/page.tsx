import { getCurrentUser } from "@/lib/auth";
import { getExpensesWithAnalytics } from "@/lib/actions/expenses";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard — SpendWise Expense Tracker",
  description: "View spending metrics, category breakdown charts, and manage your expenses.",
};

interface DashboardPageProps {
  searchParams: {
    month?: string;
    category?: string;
  };
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { expenses, analytics, selectedMonth, selectedCategory } =
    await getExpensesWithAnalytics({
      month: searchParams?.month,
      category: searchParams?.category,
    });

  return (
    <DashboardClient
      user={user}
      initialExpenses={expenses}
      initialAnalytics={analytics}
      selectedMonth={selectedMonth}
      selectedCategory={selectedCategory}
    />
  );
}
