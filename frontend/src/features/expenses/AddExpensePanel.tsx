import { Calendar, IndianRupee } from "lucide-react";
import { FormEvent, useId, useMemo, useState } from "react";
import { useCategories } from "../categories/useCategories";
import { applyExpenseServerError, FieldErrors, validateExpenseForm } from "./expenseFormValidation";
import { useCreateExpense } from "./useCreateExpense";
import { Button } from "../../shared/ui/Button";
import { Surface } from "../../shared/ui/Surface";

function todayInKolkata() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  const parts = formatter.formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

export function AddExpensePanel() {
  const titleId = useId();
  const amountId = useId();
  const dateId = useId();
  const descriptionId = useId();
  const amountErrorId = useId();
  const categoryErrorId = useId();
  const dateErrorId = useId();
  const descriptionErrorId = useId();
  const formErrorId = useId();
  const { data: categories = [], isError, isLoading } = useCategories();
  const createExpense = useCreateExpense();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const initialDate = useMemo(() => todayInKolkata(), []);
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(initialDate);
  const [description, setDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccessMessage("");
    setFormError("");

    const validation = validateExpenseForm(amount, selectedCategoryId, expenseDate, description);
    setFieldErrors(validation.fieldErrors);

    if (!validation.isValid) {
      return;
    }

    createExpense.mutate(
      {
        amount: validation.amount,
        categoryId: selectedCategoryId!,
        expenseDate,
        description: description.trim() ? description.trim() : null
      },
      {
        onSuccess: () => {
          setAmount("");
          setExpenseDate(todayInKolkata());
          setDescription("");
          setSelectedCategoryId(null);
          setFieldErrors({});
          setFormError("");
          setSuccessMessage("Expense saved.");
        },
        onError: (error) => {
          setSuccessMessage("");
          applyExpenseServerError(error, setFieldErrors, setFormError);
        }
      }
    );
  }

  return (
    <Surface className="add-expense" aria-labelledby={titleId}>
      <div className="section-heading">
        <p className="eyebrow">Add Expense</p>
        <h1 id={titleId}>Track a new spend</h1>
      </div>

      <form className="expense-form" aria-label="Add expense form" onSubmit={handleSubmit}>
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
                setSuccessMessage("");
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
          {isLoading ? <p className="inline-note">Loading categories...</p> : null}
          {isError ? <p className="inline-error">Categories could not be loaded. Try refreshing.</p> : null}
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
                    setSuccessMessage("");
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
                setSuccessMessage("");
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
              setSuccessMessage("");
              setFormError("");
            }}
            type="text"
            placeholder="A short note"
            value={description}
          />
          {fieldErrors.description ? <span className="field-error" id={descriptionErrorId}>{fieldErrors.description}</span> : null}
        </label>

        {successMessage ? <p className="inline-success" role="status">{successMessage}</p> : null}
        {formError ? <p className="inline-error" id={formErrorId} role="alert">{formError}</p> : null}

        <Button aria-describedby={formError ? formErrorId : undefined} disabled={createExpense.isPending} type="submit">
          {createExpense.isPending ? "Saving..." : "Save expense"}
        </Button>
      </form>
    </Surface>
  );
}
