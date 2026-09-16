import { ExpenseApiError } from "../../shared/api/expenses";

export type FieldErrors = {
  amount?: string;
  category?: string;
  date?: string;
  description?: string;
};

const maxAmount = 9999999999.99;
const maxDescriptionLength = 240;

export function validateExpenseForm(
  amount: string,
  categoryId: string | null,
  expenseDate: string,
  description: string
) {
  const fieldErrors: FieldErrors = {};
  const trimmedAmount = amount.trim();

  if (!trimmedAmount) {
    fieldErrors.amount = "Enter an amount to save this expense.";
  } else if (!/^-?\d+(\.\d+)?$/.test(trimmedAmount)) {
    fieldErrors.amount = "Enter a valid amount using numbers only.";
  } else if (!/^-?\d+(\.\d{1,2})?$/.test(trimmedAmount)) {
    fieldErrors.amount = "Enter an amount with no more than two decimal places.";
  }

  const numericAmount = Number(trimmedAmount);
  if (!fieldErrors.amount && numericAmount <= 0) {
    fieldErrors.amount = "Enter an amount greater than zero.";
  } else if (!fieldErrors.amount && numericAmount > maxAmount) {
    fieldErrors.amount = "Enter an amount below ₹10,000,000,000.";
  }

  if (!categoryId) {
    fieldErrors.category = "Choose a category to save this expense.";
  }

  if (!isValidExpenseDate(expenseDate)) {
    fieldErrors.date = "Enter a valid date in YYYY-MM-DD format.";
  }

  if (description.trim().length > maxDescriptionLength) {
    fieldErrors.description = "Keep description under 240 characters.";
  }

  return {
    amount: numericAmount,
    fieldErrors,
    isValid: Object.keys(fieldErrors).length === 0
  };
}

export function applyExpenseServerError(
  error: unknown,
  setFieldErrors: (updater: (current: FieldErrors) => FieldErrors) => void,
  setFormError: (message: string) => void
) {
  if (error instanceof ExpenseApiError) {
    const mappedErrors = mapValidationErrors(error.validationErrors);
    setFieldErrors((current) => ({ ...current, ...mappedErrors }));
    setFormError(Object.keys(mappedErrors).length > 0
      ? "Review the highlighted fields and try again."
      : error.message);
    return;
  }

  setFormError("Expense could not be saved. Check the details and try again.");
}

function isValidExpenseDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function mapValidationErrors(validationErrors: Record<string, string[]>) {
  return Object.entries(validationErrors).reduce<FieldErrors>((result, [field, messages]) => {
    const message = messages[0];
    const normalizedField = field.toLowerCase();

    if (!message) {
      return result;
    }

    if (normalizedField === "amount") {
      result.amount = message;
    } else if (normalizedField === "categoryid") {
      result.category = message;
    } else if (normalizedField === "expensedate") {
      result.date = message;
    } else if (normalizedField === "description") {
      result.description = message;
    }

    return result;
  }, {});
}
