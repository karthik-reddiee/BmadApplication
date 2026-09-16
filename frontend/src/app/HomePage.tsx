import { AddExpensePanel } from "../features/expenses/AddExpensePanel";
import { CurrentMonthSummary } from "../features/expenses/CurrentMonthSummary";
import { RecentExpenses } from "../features/expenses/RecentExpenses";

export function HomePage() {
  return (
    <main className="home-layout" aria-label="Home">
      <div className="home-main-column">
        <AddExpensePanel />
        <CurrentMonthSummary />
      </div>
      <RecentExpenses />
    </main>
  );
}

