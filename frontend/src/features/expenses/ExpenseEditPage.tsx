import { useQuery } from "@tanstack/react-query";
import { Calendar, IndianRupee } from "lucide-react";
import { FormEvent, useEffect, useId, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCategories } from "../categories/useCategories";
import { expenseKeys, getExpense } from "../../shared/api/expenses";
import { Button } from "../../shared/ui/Button";
import { Surface } from "../../shared/ui/Surface";
import { applyExpenseServerError, FieldErrors, validateExpenseForm } from "./expenseFormValidation";
import { useUpdateExpense } from "./useUpdateExpense";

export function ExpenseEditPage() {
  const { expenseId } = useParams();
  const navigate = useNavigate();
  const amountId = useId();
  const dateId = useId();
  const descriptionId = useId();
  const amountErrorId = useId();
  const categoryErrorId = useId();
  const dateErrorId = useId();
  const descriptionErrorId = useId();
  const formErrorId = useId();
  const { data: categories = [], isError: categoriesError, isLoading: categoriesLoading } = useCategories();
  const updateExpense = useUpdateExpense();
  const {
    data: expense,
    error,
    isError,
    isLoading
  } = useQuery({
    queryKey: expenseKeys.detail(expenseId ?? ""),
    queryFn: () => getExpense(expenseId!),
    enabled: Boolean(expenseId)
  });
  const [amount, setAmount] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [expenseDate, setExpenseDate] = useState("");
  const [description, setDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [hydratedExpenseId, setHydratedExpenseId] = useState<string | null>(null);

  useEffect(() => {
    if (!expense || hydratedExpenseId === expense.id) {
      return;
    }

    setAmount(expense.amount.toFixed(2));
    setSelectedCategoryId(expense.categoryId);
    setExpenseDate(expense.expenseDate);
    setDescription(expense.description ?? "");
    setFieldErrors({});
    setFormError("");
    setHydratedExpenseId(expense.id);
  }, [expense, hydratedExpenseId]);

  function detailPath() {
    return `/expenses/${expenseId}`;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const validation = validateExpenseForm(amount, selectedCategoryId, expenseDate, description);
    setFieldErrors(validation.fieldErrors);

    if (!validation.isValid || !expenseId) {
      return;
    }

    updateExpense.mutate(
      {
        id: expenseId,
        request: {
          amount: validation.amount,
          categoryId: selectedCategoryId!,
          expenseDate,
          description: description.trim() ? description.trim() : null
        }
      },
      {
        onSuccess: () => {
          navigate(detailPath(), {
            replace: true,
            state: { successMessage: "Expense updated." }
          });
        },
        onError: (error) => {
          applyExpenseServerError(error, setFieldErrors, setFormError);
        }
      }
    );
  }

  return (
    <main className="detail-page" aria-label="Edit expense">
      <Surface className="detail-surface">
        <div className="section-heading detail-heading">
          <div>
            <p className="eyebrow">Edit Expense</p>
            <h1>Edit expense</h1>
          </div>
          <Link className="text-link" to={detailPath()}>Back to Detail</Link>
        </div>

        {isLoading ? <p className="inline-note">Loading expense...</p> : null}

        {isError ? (
          <div className="empty-review">
            <p className="inline-error">{error instanceof Error ? error.message : "Expense could not be loaded. Try refreshing."}</p>
          </div>
        ) : null}

        {expense ? (
          <form className="expense-form" aria-label="Edit expense form" onSubmit={handleSubmit}>
            <label className="field amount-field" htmlFor={amountId}>
              <span>Amount</span>
              <span className="currency-input">
                <IndianRupee aria-hidden="true" size={18} />
                <input
                  id={amountId}
                  inputMode="decimal"
                  aria-describedby={fieldErrors.amount ? amountErrorId : undefined}
                  aria-invalid={fieldErrors.amount ? "true" : "false"}
                  className={fieldErrors.amount ? "invalid-control" : undefined}
                  onChange={(event) => {
                    setAmount(event.target.value);
                    setFieldErrors((current) => ({ ...current, amount: undefined }));
                    setFormError("");
                  }}
                  type="text"
                  placeholder="0.00"
                  value={amount}
                />
              </span>
              {fieldErrors.amount ? <span className="field-error" id={amountErrorId}>{fieldErrors.amount}</span> : null}
            </label>

            <fieldset
              aria-describedby={fieldErrors.category ? categoryErrorId : undefined}
              className="category-field"
            >
              <legend>Category</legend>
              {categoriesLoading ? <p className="inline-note">Loading categories...</p> : null}
              {categoriesError ? <p className="inline-error">Categories could not be loaded. Try refreshing before saving.</p> : null}
              <div className="chip-list" aria-label="Expense categories">
                {categories.map((category) => {
                  const isSelected = category.id === selectedCategoryId;

                  return (
                    <button
                      aria-pressed={isSelected}
                      className={`category-chip ${isSelected ? "selected" : ""}`}
                      key={category.id}
                      onClick={() => {
                        setSelectedCategoryId(category.id);
                        setFieldErrors((current) => ({ ...current, category: undefined }));
                        setFormError("");
                      }}
                      type="button"
                    >
                      {category.name}
                    </button>
                  );
                })}
              </div>
              {fieldErrors.category ? <p className="field-error" id={categoryErrorId}>{fieldErrors.category}</p> : null}
            </fieldset>

            <label className="field" htmlFor={dateId}>
              <span>Date</span>
              <span className="date-input">
                <Calendar aria-hidden="true" size={18} />
                <input
                  id={dateId}
                  aria-describedby={fieldErrors.date ? dateErrorId : undefined}
                  aria-invalid={fieldErrors.date ? "true" : "false"}
                  className={fieldErrors.date ? "invalid-control" : undefined}
                  onChange={(event) => {
                    setExpenseDate(event.target.value);
                    setFieldErrors((current) => ({ ...current, date: undefined }));
                    setFormError("");
                  }}
                  type="date"
                  value={expenseDate}
                />
              </span>
              {fieldErrors.date ? <span className="field-error" id={dateErrorId}>{fieldErrors.date}</span> : null}
            </label>

            <label className="field" htmlFor={descriptionId}>
              <span>Description <span className="muted">(optional)</span></span>
              <input
                id={descriptionId}
                aria-describedby={fieldErrors.description ? descriptionErrorId : undefined}
                aria-invalid={fieldErrors.description ? "true" : "false"}
                className={fieldErrors.description ? "invalid-control" : undefined}
                onChange={(event) => {
                  setDescription(event.target.value);
                  setFieldErrors((current) => ({ ...current, description: undefined }));
                  setFormError("");
                }}
                type="text"
                placeholder="A short note"
                value={description}
              />
              {fieldErrors.description ? <span className="field-error" id={descriptionErrorId}>{fieldErrors.description}</span> : null}
            </label>

            {formError ? <p className="inline-error" id={formErrorId} role="alert">{formError}</p> : null}

            <div className="form-actions">
              <Button aria-describedby={formError ? formErrorId : undefined} disabled={updateExpense.isPending || categoriesError} type="submit">
                {updateExpense.isPending ? "Saving..." : "Save changes"}
              </Button>
              <Link className="button button-ghost button-link" to={detailPath()}>Cancel</Link>
            </div>
          </form>
        ) : null}
      </Surface>
    </main>
  );
}
