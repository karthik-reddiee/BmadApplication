export type CreateExpenseRequest = {
  amount: number;
  categoryId: string;
  expenseDate: string;
  description?: string | null;
};

export type UpdateExpenseRequest = CreateExpenseRequest;

export type ExpenseDto = {
  id: string;
  amount: number;
  categoryId: string;
  expenseDate: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseListItemDto = {
  id: string;
  amount: number;
  categoryId: string;
  categoryName: string;
  expenseDate: string;
  description: string | null;
  createdAt: string;
};

export type ExpenseDetailDto = ExpenseDto & {
  categoryName: string;
};

export type ExpenseApiErrorDetails = {
  message: string;
  status?: number;
  validationErrors: Record<string, string[]>;
};

export class ExpenseApiError extends Error {
  status?: number;
  validationErrors: Record<string, string[]>;

  constructor(details: ExpenseApiErrorDetails) {
    super(details.message);
    this.name = "ExpenseApiError";
    this.status = details.status;
    this.validationErrors = details.validationErrors;
  }
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

export const expenseKeys = {
  all: ["expenses"] as const,
  lists: () => [...expenseKeys.all, "list"] as const,
  detail: (id: string) => [...expenseKeys.all, "detail", id] as const
};

export async function getExpenses(): Promise<ExpenseListItemDto[]> {
  const response = await fetch(`${apiBaseUrl}/api/expenses`);

  if (!response.ok) {
    throw new Error("Expenses could not be loaded. Try refreshing.");
  }

  return response.json() as Promise<ExpenseListItemDto[]>;
}

export async function getExpense(id: string): Promise<ExpenseDetailDto> {
  const response = await fetch(`${apiBaseUrl}/api/expenses/${id}`);

  if (response.status === 404) {
    throw new Error("Expense not found.");
  }

  if (!response.ok) {
    throw new Error("Expense could not be loaded. Try refreshing.");
  }

  return response.json() as Promise<ExpenseDetailDto>;
}

export async function createExpense(request: CreateExpenseRequest): Promise<ExpenseDto> {
  const response = await fetch(`${apiBaseUrl}/api/expenses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    throw await createExpenseApiError(response);
  }

  return response.json() as Promise<ExpenseDto>;
}

export async function updateExpense(id: string, request: UpdateExpenseRequest): Promise<ExpenseDetailDto> {
  const response = await fetch(`${apiBaseUrl}/api/expenses/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    throw await createExpenseApiError(response);
  }

  return response.json() as Promise<ExpenseDetailDto>;
}

export async function deleteExpense(id: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/expenses/${id}`, {
    method: "DELETE"
  });

  if (response.status === 404) {
    throw new ExpenseApiError({
      message: "Expense was not found. It may have already been deleted.",
      status: response.status,
      validationErrors: {}
    });
  }

  if (!response.ok) {
    throw new ExpenseApiError({
      message: "Expense could not be deleted. Try again.",
      status: response.status,
      validationErrors: {}
    });
  }
}

async function createExpenseApiError(response: Response) {
  const fallbackMessage = "Expense could not be saved. Check the details and try again.";

  try {
    const problem = await response.json() as {
      title?: unknown;
      detail?: unknown;
      errors?: unknown;
    };

    return new ExpenseApiError({
      message: typeof problem.detail === "string"
        ? problem.detail
        : typeof problem.title === "string"
          ? problem.title
          : fallbackMessage,
      status: response.status,
      validationErrors: parseValidationErrors(problem.errors)
    });
  } catch {
    return new ExpenseApiError({
      message: fallbackMessage,
      status: response.status,
      validationErrors: {}
    });
  }
}

function parseValidationErrors(errors: unknown) {
  if (!errors || typeof errors !== "object") {
    return {};
  }

  return Object.entries(errors).reduce<Record<string, string[]>>((result, [field, messages]) => {
    if (Array.isArray(messages)) {
      result[field] = messages.filter((message): message is string => typeof message === "string");
    }

    return result;
  }, {});
}
