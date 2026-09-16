import { Link } from "react-router-dom";
import type { ExpenseListItemDto } from "../../shared/api/expenses";
import { amountFormatter, formatExpenseDate } from "./formatters";

type ExpenseListProps = {
  expenses: ExpenseListItemDto[];
  ariaLabel: string;
};

export function ExpenseList({ expenses, ariaLabel }: ExpenseListProps) {
  return (
    <ul className="expense-list" aria-label={ariaLabel}>
      {expenses.map((expense) => (
        <li key={expense.id}>
          <Link className="expense-row" to={`/expenses/${expense.id}`}>
            <span className="expense-row-main">
              <span className="expense-amount">{amountFormatter.format(expense.amount)}</span>
              <span className="expense-category">{expense.categoryName}</span>
            </span>
            <span className="expense-row-meta">
              <span>{formatExpenseDate(expense.expenseDate)}</span>
              {expense.description?.trim() ? <span>{expense.description}</span> : null}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
