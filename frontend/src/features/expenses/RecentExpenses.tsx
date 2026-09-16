import { Surface } from "../../shared/ui/Surface";
import { ExpenseList } from "./ExpenseList";
import { useCurrentMonthSummary } from "./useCurrentMonthSummary";

export function RecentExpenses() {
  const summaryQuery = useCurrentMonthSummary();
  const recentExpenses = summaryQuery.data?.recentExpenses.slice(0, 5) ?? [];

  return (
    <Surface className="recent-expenses" aria-labelledby="recent-expenses-heading">
      <div className="section-heading compact">
        <p className="eyebrow">Recent Expenses</p>
        <h2 id="recent-expenses-heading">Latest activity</h2>
      </div>
      {summaryQuery.isLoading ? (
        <p className="inline-note">Loading expenses...</p>
      ) : summaryQuery.isError ? (
        <p className="inline-error" role="alert">Recent expenses could not be loaded. Try refreshing.</p>
      ) : recentExpenses.length > 0 ? (
        <ExpenseList expenses={recentExpenses} ariaLabel="Recent expenses" />
      ) : (
        <p className="empty-state">No expenses yet. Add your first one above.</p>
      )}
    </Surface>
  );
}
