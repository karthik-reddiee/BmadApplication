import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { ExpenseList } from "../features/expenses/ExpenseList";
import { expenseKeys, getExpenses } from "../shared/api/expenses";
import { Surface } from "../shared/ui/Surface";

type LocationState = {
  successMessage?: string;
};

export function ReviewPage() {
  const location = useLocation();
  const successMessage = (location.state as LocationState | null)?.successMessage;
  const expensesQuery = useQuery({
    queryKey: expenseKeys.lists(),
    queryFn: getExpenses
  });

  const expenses = expensesQuery.data ?? [];

  return (
    <main className="review-page" aria-labelledby="review-title">
      <Surface>
        <div className="section-heading">
          <p className="eyebrow">Review</p>
          <h1 id="review-title">Recorded expenses</h1>
        </div>
        {successMessage ? <p className="inline-success detail-message review-message" role="status">{successMessage}</p> : null}
        {expensesQuery.isLoading ? (
          <p className="inline-note">Loading expenses...</p>
        ) : expensesQuery.isError ? (
          <p className="inline-error" role="alert">Expenses could not be loaded. Try refreshing.</p>
        ) : expenses.length > 0 ? (
          <ExpenseList expenses={expenses} ariaLabel="Recorded expenses" />
        ) : (
          <div className="empty-review">
            <p className="empty-state">No expenses recorded yet.</p>
            <Link className="text-link" to="/">Back to Home</Link>
          </div>
        )}
      </Surface>
    </main>
  );
}
