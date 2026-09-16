import type { ExpenseListItemDto } from "./expenses";

export type CurrentMonthCategoryBreakdownDto = {
  categoryId: string;
  categoryName: string;
  amount: number;
};

export type CurrentMonthSummaryDto = {
  monthStart: string;
  monthEnd: string;
  totalAmount: number;
  categoryBreakdown: CurrentMonthCategoryBreakdownDto[];
  recentExpenses: ExpenseListItemDto[];
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

export const summaryKeys = {
  currentMonth: () => ["current-month-summary"] as const
};

export async function getCurrentMonthSummary(): Promise<CurrentMonthSummaryDto> {
  const response = await fetch(`${apiBaseUrl}/api/summaries/current-month`);

  if (!response.ok) {
    throw new Error("Current month summary could not be loaded. Try refreshing.");
  }

  return response.json() as Promise<CurrentMonthSummaryDto>;
}
