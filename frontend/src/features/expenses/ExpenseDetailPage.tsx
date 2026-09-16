import { useQuery } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { expenseKeys, getExpense } from "../../shared/api/expenses";
import { Surface } from "../../shared/ui/Surface";
import { amountFormatter, formatExpenseDate } from "./formatters";
import { useDeleteExpense } from "./useDeleteExpense";

type LocationState = {
  successMessage?: string;
};

export function ExpenseDetailPage() {
  const { expenseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const successMessage = (location.state as LocationState | null)?.successMessage;
  const deleteMutation = useDeleteExpense();
  const {
    data: expense,
    error,
    isError,
    isLoading
  } = useQuery({
    queryKey: expenseKeys.detail(expenseId ?? ""),
    queryFn: () => getExpense(expenseId!),
    enabled: Boolean(expenseId),
    refetchOnMount: false
  });

  useEffect(() => {
    if (isConfirmingDelete) {
      cancelButtonRef.current?.focus();
    }
  }, [isConfirmingDelete]);

  useEffect(() => {
    if (!isConfirmingDelete) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !deleteMutation.isPending) {
        closeDeleteDialog();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableControls = [cancelButtonRef.current, confirmButtonRef.current].filter(
        (control): control is HTMLButtonElement => Boolean(control)
      );

      if (focusableControls.length === 0) {
        return;
      }

      const firstControl = focusableControls[0];
      const lastControl = focusableControls[focusableControls.length - 1];

      if (event.shiftKey && document.activeElement === firstControl) {
        event.preventDefault();
        lastControl.focus();
      } else if (!event.shiftKey && document.activeElement === lastControl) {
        event.preventDefault();
        firstControl.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [deleteMutation.isPending, isConfirmingDelete]);

  function openDeleteDialog() {
    deleteMutation.reset();
    setIsConfirmingDelete(true);
  }

  function closeDeleteDialog() {
    const deleteButton = deleteButtonRef.current;
    setIsConfirmingDelete(false);
    deleteMutation.reset();
    deleteButton?.focus();
  }

  function handleDeleteConfirm() {
    if (!expense) {
      return;
    }

    deleteMutation.mutate(expense.id, {
      onSuccess: () => {
        navigate("/review", {
          replace: true,
          state: { successMessage: "Expense deleted." }
        });
      }
    });
  }

  const deleteErrorMessage = deleteMutation.error instanceof Error
    ? deleteMutation.error.message
    : "Expense could not be deleted. Try again.";

  return (
    <main className="detail-page" aria-label="Expense detail">
      <Surface className="detail-surface">
        <div className="section-heading detail-heading">
          <div>
            <p className="eyebrow">Expense Detail</p>
            <h1>Expense details</h1>
          </div>
          <Link className="text-link" to="/review">Back to Review</Link>
        </div>

        {successMessage ? <p className="inline-success detail-message" role="status">{successMessage}</p> : null}

        {isLoading ? <p className="inline-note">Loading expense...</p> : null}

        {isError ? (
          <div className="empty-review">
            <p className="inline-error">{error instanceof Error ? error.message : "Expense could not be loaded. Try refreshing."}</p>
          </div>
        ) : null}

        {expense ? (
          <>
            <dl className="detail-list">
              <div>
                <dt>Amount</dt>
                <dd className="detail-amount">{amountFormatter.format(expense.amount)}</dd>
              </div>
              <div>
                <dt>Category</dt>
                <dd>{expense.categoryName}</dd>
              </div>
              <div>
                <dt>Date</dt>
                <dd>{formatExpenseDate(expense.expenseDate)}</dd>
              </div>
              {expense.description?.trim() ? (
                <div>
                  <dt>Description</dt>
                  <dd>{expense.description}</dd>
                </div>
              ) : null}
            </dl>

            <div className="detail-actions" aria-label="Expense actions">
              <Link className="button button-primary button-link" to={`/expenses/${expense.id}/edit`}>
                <Pencil aria-hidden="true" size={18} />
                Edit
              </Link>
              <button className="button danger-action" onClick={openDeleteDialog} ref={deleteButtonRef} type="button">
                <Trash2 aria-hidden="true" size={18} />
                Delete
              </button>
            </div>

            {isConfirmingDelete ? (
              <div className="dialog-backdrop" role="presentation">
                <section
                  aria-describedby="delete-expense-description"
                  aria-labelledby="delete-expense-title"
                  aria-modal="true"
                  className="confirm-dialog"
                  role="dialog"
                >
                  <div>
                    <h2 id="delete-expense-title">Delete this expense?</h2>
                    <p className="supporting-copy" id="delete-expense-description">
                      This permanently removes the expense from your records.
                    </p>
                  </div>
                  {deleteMutation.isError ? (
                    <p className="inline-error" role="alert">{deleteErrorMessage}</p>
                  ) : null}
                  <div className="dialog-actions">
                    <button
                      className="button button-ghost"
                      disabled={deleteMutation.isPending}
                      onClick={closeDeleteDialog}
                      ref={cancelButtonRef}
                      type="button"
                    >
                      Cancel
                    </button>
                    <button
                      className="button danger-action danger-action-solid"
                      disabled={deleteMutation.isPending}
                      onClick={handleDeleteConfirm}
                      ref={confirmButtonRef}
                      type="button"
                    >
                      <Trash2 aria-hidden="true" size={18} />
                      {deleteMutation.isPending ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </section>
              </div>
            ) : null}
          </>
        ) : null}
      </Surface>
    </main>
  );
}
