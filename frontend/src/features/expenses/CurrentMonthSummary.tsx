import { Surface } from "../../shared/ui/Surface";
import { amountFormatter } from "./formatters";
import { useCurrentMonthSummary } from "./useCurrentMonthSummary";

export function CurrentMonthSummary() {
  const summaryQuery = useCurrentMonthSummary();
  const summary = summaryQuery.data;
  const categoryBreakdown = [...(summary?.categoryBreakdown ?? [])]
    .filter((item) => item.amount > 0)
    .sort((first, second) => second.amount - first.amount);
  const maxAmount = Math.max(...categoryBreakdown.map((item) => item.amount), 0);

  return (
    <Surface className="summary-panel" aria-labelledby="current-month-heading">
      <div className="section-heading compact">
        <p className="eyebrow">Current Month</p>
        <h2 id="current-month-heading">{amountFormatter.format(summary?.totalAmount ?? 0)}</h2>
      </div>
      {summaryQuery.isLoading ? (
        <p className="inline-note">Loading current month summary...</p>
      ) : summaryQuery.isError ? (
        <p className="inline-error" role="alert">Current month summary could not be loaded. Try refreshing.</p>
      ) : categoryBreakdown.length > 0 ? (
        <ul className="breakdown-list" aria-label="Current month category breakdown">
          {categoryBreakdown.map((item) => (
            <li className="breakdown-row" key={item.categoryId}>
              <div className="breakdown-row-header">
                <span>{item.categoryName}</span>
                <span>{amountFormatter.format(item.amount)}</span>
              </div>
              <div className="breakdown-track" aria-hidden="true">
                <span
                  className="breakdown-bar"
                  style={{ width: `${maxAmount > 0 ? Math.max((item.amount / maxAmount) * 100, 2) : 0}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="supporting-copy">No spending recorded yet this month.</p>
      )}
    </Surface>
  );
}
