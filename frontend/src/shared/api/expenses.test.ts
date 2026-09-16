import { afterEach, describe, expect, it, vi } from "vitest";
import { ExpenseApiError, createExpense, deleteExpense, getExpense, getExpenses, updateExpense } from "./expenses";

describe("getExpenses", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("gets ordered expense rows from the expense endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: "20000000-0000-0000-0000-000000000001",
          amount: 125.5,
          categoryId: "10000000-0000-0000-0000-000000000001",
          categoryName: "Food",
          expenseDate: "2026-09-16",
          description: "Lunch",
          createdAt: "2026-09-16T08:00:00Z"
        }
      ]
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(getExpenses()).resolves.toEqual([
      {
        id: "20000000-0000-0000-0000-000000000001",
        amount: 125.5,
        categoryId: "10000000-0000-0000-0000-000000000001",
        categoryName: "Food",
        expenseDate: "2026-09-16",
        description: "Lunch",
        createdAt: "2026-09-16T08:00:00Z"
      }
    ]);
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:5000/api/expenses");
  });

  it("throws an actionable failure when expense rows cannot be loaded", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 500
    }));

    await expect(getExpenses()).rejects.toThrow("Expenses could not be loaded. Try refreshing.");
  });
});

describe("getExpense", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("gets an expense detail from the expense detail endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "20000000-0000-0000-0000-000000000001",
        amount: 125.5,
        categoryId: "10000000-0000-0000-0000-000000000001",
        categoryName: "Food",
        expenseDate: "2026-09-16",
        description: "Lunch",
        createdAt: "2026-09-16T08:00:00Z",
        updatedAt: "2026-09-16T09:00:00Z"
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(getExpense("20000000-0000-0000-0000-000000000001")).resolves.toMatchObject({
      id: "20000000-0000-0000-0000-000000000001",
      categoryName: "Food",
      updatedAt: "2026-09-16T09:00:00Z"
    });
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:5000/api/expenses/20000000-0000-0000-0000-000000000001");
  });

  it("throws not-found feedback when the detail endpoint returns 404", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 404
    }));

    await expect(getExpense("missing")).rejects.toThrow("Expense not found.");
  });
});

describe("createExpense", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts a create request to the expense endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "20000000-0000-0000-0000-000000000001",
        amount: 125.5,
        categoryId: "10000000-0000-0000-0000-000000000001",
        expenseDate: "2026-09-16",
        description: null,
        createdAt: "2026-09-16T08:00:00Z",
        updatedAt: "2026-09-16T08:00:00Z"
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    await createExpense({
      amount: 125.5,
      categoryId: "10000000-0000-0000-0000-000000000001",
      expenseDate: "2026-09-16",
      description: null
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:5000/api/expenses",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: 125.5,
          categoryId: "10000000-0000-0000-0000-000000000001",
          expenseDate: "2026-09-16",
          description: null
        })
      })
    );
  });

  it("throws parsed validation details when the expense endpoint returns ValidationProblemDetails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        type: "https://tools.ietf.org/html/rfc9110#section-15.5.1",
        title: "One or more validation errors occurred.",
        status: 400,
        errors: {
          Amount: ["Enter an amount with no more than two decimal places."],
          CategoryId: ["Choose a category."]
        }
      })
    }));

    const thrown = await createExpense({
      amount: 125.5,
      categoryId: "10000000-0000-0000-0000-000000000001",
      expenseDate: "2026-09-16",
      description: null
    }).catch((error: unknown) => error);

    expect(thrown).toBeInstanceOf(ExpenseApiError);
    expect(thrown).toMatchObject({
      message: "One or more validation errors occurred.",
      status: 400,
      validationErrors: {
        Amount: ["Enter an amount with no more than two decimal places."],
        CategoryId: ["Choose a category."]
      }
    });
  });

  it("throws a generic actionable failure when the response body cannot be parsed", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("No JSON");
      }
    }));

    await expect(createExpense({
      amount: 125.5,
      categoryId: "10000000-0000-0000-0000-000000000001",
      expenseDate: "2026-09-16",
      description: null
    })).rejects.toMatchObject({
      message: "Expense could not be saved. Check the details and try again.",
      status: 500,
      validationErrors: {}
    });
  });
});

describe("updateExpense", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("puts an update request to the expense detail endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "20000000-0000-0000-0000-000000000001",
        amount: 200,
        categoryId: "10000000-0000-0000-0000-000000000002",
        categoryName: "Transport",
        expenseDate: "2026-09-17",
        description: "Auto ride",
        createdAt: "2026-09-16T08:00:00Z",
        updatedAt: "2026-09-16T09:00:00Z"
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(updateExpense("20000000-0000-0000-0000-000000000001", {
      amount: 200,
      categoryId: "10000000-0000-0000-0000-000000000002",
      expenseDate: "2026-09-17",
      description: "Auto ride"
    })).resolves.toMatchObject({
      amount: 200,
      categoryName: "Transport"
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:5000/api/expenses/20000000-0000-0000-0000-000000000001",
      expect.objectContaining({
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: 200,
          categoryId: "10000000-0000-0000-0000-000000000002",
          expenseDate: "2026-09-17",
          description: "Auto ride"
        })
      })
    );
  });

  it("throws parsed validation details when update returns ValidationProblemDetails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        title: "One or more validation errors occurred.",
        status: 400,
        errors: {
          Amount: ["Enter an amount with no more than two decimal places."]
        }
      })
    }));

    const thrown = await updateExpense("20000000-0000-0000-0000-000000000001", {
      amount: 12.345,
      categoryId: "10000000-0000-0000-0000-000000000001",
      expenseDate: "2026-09-16",
      description: null
    }).catch((error: unknown) => error);

    expect(thrown).toBeInstanceOf(ExpenseApiError);
    expect(thrown).toMatchObject({
      message: "One or more validation errors occurred.",
      status: 400,
      validationErrors: {
        Amount: ["Enter an amount with no more than two decimal places."]
      }
    });
  });
});

describe("deleteExpense", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("deletes an expense through the expense detail endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 204
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(deleteExpense("20000000-0000-0000-0000-000000000001")).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:5000/api/expenses/20000000-0000-0000-0000-000000000001",
      expect.objectContaining({
        method: "DELETE"
      })
    );
  });

  it("throws not-found feedback when delete returns 404", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 404
    }));

    await expect(deleteExpense("missing")).rejects.toMatchObject({
      message: "Expense was not found. It may have already been deleted.",
      status: 404
    });
  });

  it("throws actionable feedback when delete fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 500
    }));

    await expect(deleteExpense("20000000-0000-0000-0000-000000000001")).rejects.toMatchObject({
      message: "Expense could not be deleted. Try again.",
      status: 500
    });
  });
});
