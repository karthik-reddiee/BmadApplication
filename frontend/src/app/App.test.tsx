import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HomePage } from "./HomePage";
import { AppNavigation } from "./navigation";
import { ReviewPage } from "./ReviewPage";
import { CategoriesPage } from "../features/categories/CategoriesPage";
import { ExpenseDetailPage } from "../features/expenses/ExpenseDetailPage";
import { ExpenseEditPage } from "../features/expenses/ExpenseEditPage";
import * as categoryApi from "../shared/api/categories";
import * as expenseApi from "../shared/api/expenses";
import * as summaryApi from "../shared/api/summaries";

const starterCategories = [
  { id: "10000000-0000-0000-0000-000000000001", name: "Food", isDefault: true, isProtected: true },
  { id: "10000000-0000-0000-0000-000000000002", name: "Transport", isDefault: true, isProtected: true },
  { id: "10000000-0000-0000-0000-000000000003", name: "Shopping", isDefault: true, isProtected: true },
  { id: "10000000-0000-0000-0000-000000000004", name: "Bills", isDefault: true, isProtected: true },
  { id: "10000000-0000-0000-0000-000000000005", name: "Entertainment", isDefault: true, isProtected: true },
  { id: "10000000-0000-0000-0000-000000000006", name: "Health", isDefault: true, isProtected: true },
  { id: "10000000-0000-0000-0000-000000000007", name: "Education", isDefault: true, isProtected: true },
  { id: "10000000-0000-0000-0000-000000000008", name: "Other", isDefault: true, isProtected: true }
];

const expenseRows = [
  {
    id: "20000000-0000-0000-0000-000000000001",
    amount: 125.5,
    categoryId: starterCategories[0].id,
    categoryName: "Food",
    expenseDate: "2026-09-16",
    description: "Lunch",
    createdAt: "2026-09-16T10:00:00Z"
  },
  {
    id: "20000000-0000-0000-0000-000000000002",
    amount: 80,
    categoryId: starterCategories[1].id,
    categoryName: "Transport",
    expenseDate: "2026-09-16",
    description: null,
    createdAt: "2026-09-16T09:00:00Z"
  },
  {
    id: "20000000-0000-0000-0000-000000000003",
    amount: 42,
    categoryId: starterCategories[2].id,
    categoryName: "Shopping",
    expenseDate: "2026-09-15",
    description: "Notebook",
    createdAt: "2026-09-15T11:00:00Z"
  },
  {
    id: "20000000-0000-0000-0000-000000000004",
    amount: 1500,
    categoryId: starterCategories[3].id,
    categoryName: "Bills",
    expenseDate: "2026-09-14",
    description: null,
    createdAt: "2026-09-14T11:00:00Z"
  },
  {
    id: "20000000-0000-0000-0000-000000000005",
    amount: 300,
    categoryId: starterCategories[4].id,
    categoryName: "Entertainment",
    expenseDate: "2026-09-13",
    description: "Movie",
    createdAt: "2026-09-13T11:00:00Z"
  },
  {
    id: "20000000-0000-0000-0000-000000000006",
    amount: 900,
    categoryId: starterCategories[5].id,
    categoryName: "Health",
    expenseDate: "2026-09-12",
    description: "Medicine",
    createdAt: "2026-09-12T11:00:00Z"
  }
];

const expenseDetail = {
  ...expenseRows[0],
  updatedAt: "2026-09-16T10:30:00Z"
};

const emptySummary = {
  monthStart: "2026-09-01",
  monthEnd: "2026-09-30",
  totalAmount: 0,
  categoryBreakdown: [],
  recentExpenses: []
};

const summaryWithExpenses = {
  monthStart: "2026-09-01",
  monthEnd: "2026-09-30",
  totalAmount: 205.5,
  categoryBreakdown: [
    { categoryId: starterCategories[1].id, categoryName: "Transport", amount: 80 },
    { categoryId: starterCategories[2].id, categoryName: "Shopping", amount: 0 },
    { categoryId: starterCategories[0].id, categoryName: "Food", amount: 125.5 }
  ],
  recentExpenses: expenseRows.slice(0, 5)
};

const customCategory = {
  id: "30000000-0000-0000-0000-000000000001",
  name: "Coffee",
  isDefault: false,
  isProtected: false
};

function renderHome() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false }
    }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/"]}>
        <AppNavigation />
        <Routes>
          <Route element={<HomePage />} path="/" />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function renderAppRoute(initialPath: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false }
    }
  });

  const result = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <AppNavigation />
        <Routes>
          <Route element={<HomePage />} path="/" />
          <Route element={<ReviewPage />} path="/review" />
          <Route element={<CategoriesPage />} path="/categories" />
          <Route element={<ExpenseDetailPage />} path="/expenses/:expenseId" />
          <Route element={<ExpenseEditPage />} path="/expenses/:expenseId/edit" />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );

  return { queryClient, ...result };
}

describe("Home shell", () => {
  beforeEach(() => {
    vi.spyOn(categoryApi, "getCategories").mockResolvedValue(starterCategories);
    vi.spyOn(categoryApi, "createCategory").mockResolvedValue(customCategory);
    vi.spyOn(categoryApi, "updateCategory").mockResolvedValue({ ...customCategory, name: "Tea" });
    vi.spyOn(categoryApi, "deleteCategory").mockResolvedValue();
    vi.spyOn(expenseApi, "getExpenses").mockResolvedValue([]);
    vi.spyOn(summaryApi, "getCurrentMonthSummary").mockResolvedValue(emptySummary);
    vi.spyOn(expenseApi, "getExpense").mockResolvedValue(expenseDetail);
    vi.spyOn(expenseApi, "updateExpense").mockResolvedValue(expenseDetail);
    vi.spyOn(expenseApi, "deleteExpense").mockResolvedValue();
    vi.spyOn(expenseApi, "createExpense").mockResolvedValue({
      id: "20000000-0000-0000-0000-000000000001",
      amount: 125.5,
      categoryId: starterCategories[0].id,
      expenseDate: "2026-09-16",
      description: null,
      createdAt: "2026-09-16T08:00:00Z",
      updatedAt: "2026-09-16T08:00:00Z"
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders Home as the default surface with required navigation", async () => {
    renderHome();

    expect(screen.getByRole("navigation", { name: /primary navigation/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /review/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /categories/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /track a new spend/i })).toBeInTheDocument();
    expect(screen.getByText("₹0.00")).toBeInTheDocument();
    expect(await screen.findByText("No expenses yet. Add your first one above.")).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Current month category breakdown" })).not.toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Food" })).toBeInTheDocument();
  });

  it("shows current-month total, ranked category breakdown, and recent rows on Home", async () => {
    vi.mocked(summaryApi.getCurrentMonthSummary).mockResolvedValueOnce(summaryWithExpenses);

    renderHome();

    expect(await screen.findByText("₹205.50")).toBeInTheDocument();
    const breakdown = screen.getByRole("list", { name: "Current month category breakdown" });
    const breakdownRows = within(breakdown).getAllByRole("listitem");
    expect(breakdownRows).toHaveLength(2);
    expect(breakdownRows[0]).toHaveTextContent("Food");
    expect(breakdownRows[0]).toHaveTextContent("₹125.50");
    expect(breakdownRows[1]).toHaveTextContent("Transport");
    expect(breakdownRows[1]).toHaveTextContent("₹80.00");
    expect(within(breakdown).queryByText("Shopping")).not.toBeInTheDocument();

    const recentList = await screen.findByRole("list", { name: "Recent expenses" });
    const rows = within(recentList).getAllByRole("link");

    expect(rows).toHaveLength(5);
    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringContaining("Food"),
      expect.stringContaining("Transport"),
      expect.stringContaining("Shopping"),
      expect.stringContaining("Bills"),
      expect.stringContaining("Entertainment")
    ]);
    expect(rows[0]).toHaveTextContent("₹125.50");
    expect(rows[0]).toHaveTextContent("16 Sept 2026");
    expect(rows[0]).toHaveTextContent("Lunch");
    expect(rows[1]).toHaveTextContent("Transport");
    expect(rows[1]).not.toHaveTextContent("Lunch");
    expect(within(recentList).queryByText("Health")).not.toBeInTheDocument();
  });

  it("keeps Add Expense, current-month summary, and recent expenses in Home order", async () => {
    renderHome();

    const home = screen.getByRole("main", { name: "Home" });
    const orderedHeadings = within(home).getAllByRole("heading").map((heading) => heading.textContent);

    expect(orderedHeadings).toEqual([
      "Track a new spend",
      "₹0.00",
      "Latest activity"
    ]);
  });

  it("shows a recent expense failure without hiding Add Expense", async () => {
    vi.mocked(summaryApi.getCurrentMonthSummary).mockRejectedValueOnce(new Error("Nope"));

    renderHome();

    expect(screen.getByRole("heading", { name: /track a new spend/i })).toBeInTheDocument();
    expect(await screen.findByText("Current month summary could not be loaded. Try refreshing.")).toBeInTheDocument();
    expect(await screen.findByText("Recent expenses could not be loaded. Try refreshing.")).toBeInTheDocument();
  });

  it("shows a loading state before Home recent expenses resolve", async () => {
    vi.mocked(summaryApi.getCurrentMonthSummary).mockReturnValueOnce(new Promise(() => {}));

    renderHome();

    expect(screen.getByText("Loading current month summary...")).toBeInTheDocument();
    expect(screen.getByText("Loading expenses...")).toBeInTheDocument();
    expect(screen.queryByText("No expenses yet. Add your first one above.")).not.toBeInTheDocument();
  });

  it("shows all recorded expenses on Review using the same row navigation", async () => {
    vi.mocked(expenseApi.getExpenses).mockResolvedValueOnce(expenseRows);

    renderAppRoute("/review");

    const recordedList = await screen.findByRole("list", { name: "Recorded expenses" });
    const rows = within(recordedList).getAllByRole("link");

    expect(rows).toHaveLength(6);
    expect(rows[0]).toHaveTextContent("Food");
    expect(rows[5]).toHaveTextContent("Health");
    expect(rows[0]).toHaveAttribute("href", "/expenses/20000000-0000-0000-0000-000000000001");
  });

  it("shows empty Review copy with a route back Home", async () => {
    renderAppRoute("/review");

    expect(await screen.findByText("No expenses recorded yet.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to home/i })).toHaveAttribute("href", "/");
  });

  it("shows a Review failure state when recorded expenses cannot be loaded", async () => {
    vi.mocked(expenseApi.getExpenses).mockRejectedValueOnce(new Error("Nope"));

    renderAppRoute("/review");

    expect(await screen.findByText("Expenses could not be loaded. Try refreshing.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /recorded expenses/i })).toBeInTheDocument();
  });

  it("shows a loading state before Review expenses resolve", async () => {
    vi.mocked(expenseApi.getExpenses).mockReturnValueOnce(new Promise(() => {}));

    renderAppRoute("/review");

    expect(screen.getByText("Loading expenses...")).toBeInTheDocument();
    expect(screen.queryByText("No expenses recorded yet.")).not.toBeInTheDocument();
  });

  it("renders protected defaults and the empty custom category state", async () => {
    renderAppRoute("/categories");

    expect(await screen.findByRole("heading", { name: /manage categories/i })).toBeInTheDocument();
    const defaultList = screen.getByRole("list", { name: "Default Categories" });
    expect(await within(defaultList).findByText("Food")).toBeInTheDocument();
    expect(within(defaultList).getAllByText("Protected")).toHaveLength(starterCategories.length);
    expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
    expect(screen.getByText("No custom categories yet. Add one to get started.")).toBeInTheDocument();
  });

  it("validates custom category creation near the name field", async () => {
    const user = userEvent.setup();
    renderAppRoute("/categories");

    await screen.findByRole("heading", { name: /manage categories/i });
    await user.click(screen.getByRole("button", { name: /add category/i }));

    expect(screen.getByText("Enter a category name.")).toBeInTheDocument();
    expect(categoryApi.createCategory).not.toHaveBeenCalled();
  });

  it("does not show the empty custom category state while categories are loading or failed", async () => {
    vi.mocked(categoryApi.getCategories).mockReturnValueOnce(new Promise(() => {}));
    const { unmount } = renderAppRoute("/categories");

    expect(screen.getByText("Loading categories...")).toBeInTheDocument();
    expect(screen.queryByText("No custom categories yet. Add one to get started.")).not.toBeInTheDocument();

    unmount();
    vi.mocked(categoryApi.getCategories).mockRejectedValueOnce(new Error("Nope"));
    renderAppRoute("/categories");

    expect(await screen.findByText("Categories could not be loaded. Try refreshing.")).toBeInTheDocument();
    expect(screen.queryByText("No custom categories yet. Add one to get started.")).not.toBeInTheDocument();
  });

  it("maps backend duplicate category feedback near the name field", async () => {
    const user = userEvent.setup();
    vi.mocked(categoryApi.createCategory).mockRejectedValueOnce(new categoryApi.CategoryApiError(
      "One or more validation errors occurred.",
      { Name: ["Category name already exists."] }
    ));
    renderAppRoute("/categories");

    await user.type(await screen.findByLabelText("Name"), "Food");
    await user.click(screen.getByRole("button", { name: /add category/i }));

    expect(await screen.findByText("Category name already exists.")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Food")).toBeInTheDocument();
  });

  it("creates a custom category and makes it available to Add Expense chips", async () => {
    const user = userEvent.setup();
    vi.mocked(categoryApi.getCategories)
      .mockResolvedValueOnce(starterCategories)
      .mockResolvedValueOnce([...starterCategories, customCategory])
      .mockResolvedValue([...starterCategories, customCategory]);
    renderAppRoute("/categories");

    await user.type(await screen.findByLabelText("Name"), "Coffee");
    await user.click(screen.getByRole("button", { name: /add category/i }));

    expect(vi.mocked(categoryApi.createCategory).mock.calls[0][0]).toEqual({ name: "Coffee" });
    expect(await screen.findByText("Category added.")).toBeInTheDocument();
    expect(await screen.findByRole("list", { name: "Custom Categories" })).toHaveTextContent("Coffee");

    await user.click(screen.getByRole("link", { name: /home/i }));

    expect(await screen.findByRole("button", { name: "Coffee" })).toBeInTheDocument();
  });

  it("shows custom categories as Edit Expense chips", async () => {
    vi.mocked(categoryApi.getCategories).mockResolvedValue([...starterCategories, customCategory]);

    renderAppRoute(`/expenses/${expenseDetail.id}/edit`);

    expect(await screen.findByRole("heading", { name: /edit expense/i })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Coffee" })).toBeInTheDocument();
  });

  it("renames a custom category without exposing edit controls for defaults", async () => {
    const user = userEvent.setup();
    vi.mocked(categoryApi.getCategories)
      .mockResolvedValueOnce([...starterCategories, customCategory])
      .mockResolvedValue([...starterCategories, { ...customCategory, name: "Tea" }]);
    renderAppRoute("/categories");

    const defaultList = await screen.findByRole("list", { name: "Default Categories" });
    expect(within(defaultList).queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();

    const customList = await screen.findByRole("list", { name: "Custom Categories" });
    await user.click(within(customList).getByRole("button", { name: /edit/i }));
    const renameInput = screen.getByDisplayValue("Coffee");
    await user.clear(renameInput);
    await user.type(renameInput, "Tea");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    expect(vi.mocked(categoryApi.updateCategory).mock.calls[0][0]).toBe(customCategory.id);
    expect(vi.mocked(categoryApi.updateCategory).mock.calls[0][1]).toEqual({ name: "Tea" });
    expect(await screen.findByText("Category updated.")).toBeInTheDocument();
    expect(await screen.findByText("Tea")).toBeInTheDocument();
  });

  it("refreshes cached expense rows and details after custom category rename", async () => {
    const user = userEvent.setup();
    const coffeeExpense = {
      ...expenseDetail,
      categoryId: customCategory.id,
      categoryName: "Coffee"
    };
    vi.mocked(categoryApi.getCategories)
      .mockResolvedValueOnce([...starterCategories, customCategory])
      .mockResolvedValue([...starterCategories, { ...customCategory, name: "Tea" }]);
    vi.mocked(categoryApi.updateCategory).mockResolvedValueOnce({ ...customCategory, name: "Tea" });
    vi.mocked(expenseApi.getExpenses)
      .mockResolvedValueOnce([coffeeExpense])
      .mockResolvedValue([{ ...coffeeExpense, categoryName: "Tea" }]);
    const { queryClient } = renderAppRoute("/categories");
    queryClient.setQueryData(expenseApi.expenseKeys.detail(coffeeExpense.id), coffeeExpense);
    queryClient.setQueryData(expenseApi.expenseKeys.lists(), [coffeeExpense]);

    const customList = await screen.findByRole("list", { name: "Custom Categories" });
    await user.click(within(customList).getByRole("button", { name: /edit/i }));
    const renameInput = screen.getByDisplayValue("Coffee");
    await user.clear(renameInput);
    await user.type(renameInput, "Tea");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await screen.findByText("Category updated.");
    expect(queryClient.getQueryData(expenseApi.expenseKeys.detail(coffeeExpense.id))).toMatchObject({
      categoryName: "Tea"
    });
    expect(queryClient.getQueryData(expenseApi.expenseKeys.lists())).toEqual([
      expect.objectContaining({ categoryName: "Tea" })
    ]);
  });

  it("keeps custom category rename validation in context", async () => {
    const user = userEvent.setup();
    vi.mocked(categoryApi.getCategories).mockResolvedValue([...starterCategories, customCategory]);
    renderAppRoute("/categories");

    const customList = await screen.findByRole("list", { name: "Custom Categories" });
    await user.click(within(customList).getByRole("button", { name: /edit/i }));
    await user.clear(screen.getByDisplayValue("Coffee"));
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    expect(screen.getByText("Enter a category name.")).toBeInTheDocument();
    expect(categoryApi.updateCategory).not.toHaveBeenCalled();
  });

  it("maps duplicate custom category rename feedback without closing edit mode", async () => {
    const user = userEvent.setup();
    vi.mocked(categoryApi.getCategories).mockResolvedValue([
      ...starterCategories,
      customCategory,
      { ...customCategory, id: "30000000-0000-0000-0000-000000000002", name: "Tea" }
    ]);
    vi.mocked(categoryApi.updateCategory).mockRejectedValueOnce(new categoryApi.CategoryApiError(
      "One or more validation errors occurred.",
      { Name: ["Category name already exists."] }
    ));
    renderAppRoute("/categories");

    const customList = await screen.findByRole("list", { name: "Custom Categories" });
    await user.click(within(customList).getAllByRole("button", { name: /edit/i })[0]);
    const renameInput = screen.getByDisplayValue("Coffee");
    await user.clear(renameInput);
    await user.type(renameInput, "Tea");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    expect(await screen.findByText("Category name already exists.")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Tea")).toBeInTheDocument();
  });

  it("opens and cancels unused custom category deletion without calling the API", async () => {
    const user = userEvent.setup();
    vi.mocked(categoryApi.getCategories).mockResolvedValue([...starterCategories, customCategory]);
    renderAppRoute("/categories");

    const customList = await screen.findByRole("list", { name: "Custom Categories" });
    await user.click(within(customList).getByRole("button", { name: /delete/i }));

    expect(screen.getByRole("dialog", { name: /delete this category/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.queryByRole("dialog", { name: /delete this category/i })).not.toBeInTheDocument();
    expect(categoryApi.deleteCategory).not.toHaveBeenCalled();
    expect(screen.getByText("Coffee")).toBeInTheDocument();
  });

  it("deletes an unused custom category and removes it from Add Expense chips", async () => {
    const user = userEvent.setup();
    vi.mocked(categoryApi.getCategories)
      .mockResolvedValueOnce([...starterCategories, customCategory])
      .mockResolvedValue(starterCategories);
    renderAppRoute("/categories");

    const customList = await screen.findByRole("list", { name: "Custom Categories" });
    await user.click(within(customList).getByRole("button", { name: /delete/i }));
    await user.click(within(screen.getByRole("dialog", { name: /delete this category/i })).getByRole("button", { name: /^delete$/i }));

    expect(categoryApi.deleteCategory).toHaveBeenCalledWith(customCategory.id, expect.anything());
    expect(await screen.findByText("Category deleted.")).toBeInTheDocument();
    expect(screen.queryByText("Coffee")).not.toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: /home/i }));

    await screen.findByRole("button", { name: "Food" });
    expect(screen.queryByRole("button", { name: "Coffee" })).not.toBeInTheDocument();
  });

  it("blocks in-use custom category deletion before confirmation", async () => {
    const user = userEvent.setup();
    vi.mocked(categoryApi.getCategories).mockResolvedValue([...starterCategories, customCategory]);
    vi.mocked(expenseApi.getExpenses).mockResolvedValue([
      {
        ...expenseRows[0],
        categoryId: customCategory.id,
        categoryName: "Coffee"
      }
    ]);
    renderAppRoute("/categories");

    const customList = await screen.findByRole("list", { name: "Custom Categories" });
    await user.click(within(customList).getByRole("button", { name: /delete/i }));

    expect(screen.getByText("This category is used by existing expenses. Reassign those expenses before deleting it.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: /delete this category/i })).not.toBeInTheDocument();
    expect(categoryApi.deleteCategory).not.toHaveBeenCalled();
  });

  it("navigates from an expense row to the future detail route", async () => {
    const user = userEvent.setup();
    vi.mocked(summaryApi.getCurrentMonthSummary).mockResolvedValueOnce(summaryWithExpenses);

    renderAppRoute("/");

    await user.click(await screen.findByRole("link", { name: /food/i }));

    expect(await screen.findByRole("heading", { name: "Expense details" })).toBeInTheDocument();
    expect(screen.getByText("₹125.50")).toBeInTheDocument();
  });

  it("renders expense detail read-only with edit and delete actions", async () => {
    renderAppRoute(`/expenses/${expenseDetail.id}`);

    expect(await screen.findByRole("heading", { name: "Expense details" })).toBeInTheDocument();
    expect(await screen.findByText("₹125.50")).toBeInTheDocument();
    expect(screen.getByText("Food")).toBeInTheDocument();
    expect(screen.getByText("16 Sept 2026")).toBeInTheDocument();
    expect(screen.getByText("Lunch")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /edit/i })).toHaveAttribute("href", `/expenses/${expenseDetail.id}/edit`);
    expect(screen.getByRole("button", { name: /delete/i })).toBeEnabled();
    expect(screen.queryByLabelText("Amount")).not.toBeInTheDocument();
  });

  it("opens delete confirmation without calling the API first", async () => {
    const user = userEvent.setup();
    renderAppRoute(`/expenses/${expenseDetail.id}`);

    await user.click(await screen.findByRole("button", { name: /delete/i }));

    expect(screen.getByRole("dialog", { name: /delete this expense/i })).toBeInTheDocument();
    expect(screen.getByText("This permanently removes the expense from your records.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toHaveFocus();
    expect(expenseApi.deleteExpense).not.toHaveBeenCalled();
  });

  it("cancels delete confirmation and leaves the expense visible", async () => {
    const user = userEvent.setup();
    renderAppRoute(`/expenses/${expenseDetail.id}`);

    await user.click(await screen.findByRole("button", { name: /delete/i }));
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.queryByRole("dialog", { name: /delete this expense/i })).not.toBeInTheDocument();
    expect(screen.getByText("₹125.50")).toBeInTheDocument();
    expect(expenseApi.deleteExpense).not.toHaveBeenCalled();
  });

  it("closes delete confirmation with Escape and restores focus", async () => {
    const user = userEvent.setup();
    renderAppRoute(`/expenses/${expenseDetail.id}`);

    const deleteButton = await screen.findByRole("button", { name: /delete/i });
    await user.click(deleteButton);

    expect(screen.getByRole("button", { name: /cancel/i })).toHaveFocus();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog", { name: /delete this expense/i })).not.toBeInTheDocument();
    expect(deleteButton).toHaveFocus();
    expect(expenseApi.deleteExpense).not.toHaveBeenCalled();
  });

  it("deletes an expense, returns to Review, refreshes the list, and shows feedback", async () => {
    const user = userEvent.setup();
    vi.mocked(expenseApi.getExpenses).mockResolvedValueOnce(expenseRows.slice(1));
    const { queryClient } = renderAppRoute(`/expenses/${expenseDetail.id}`);
    queryClient.setQueryData(summaryApi.summaryKeys.currentMonth(), summaryWithExpenses);

    await user.click(await screen.findByRole("button", { name: /delete/i }));
    await user.click(within(screen.getByRole("dialog", { name: /delete this expense/i })).getByRole("button", { name: /^delete$/i }));

    expect(vi.mocked(expenseApi.deleteExpense).mock.calls[0][0]).toBe(expenseDetail.id);
    expect(await screen.findByRole("heading", { name: /recorded expenses/i })).toBeInTheDocument();
    expect(screen.getByText("Expense deleted.")).toBeInTheDocument();
    const recordedList = await screen.findByRole("list", { name: "Recorded expenses" });
    expect(within(recordedList).queryByText("Food")).not.toBeInTheDocument();
    expect(within(recordedList).getByText("Transport")).toBeInTheDocument();
    expect(queryClient.getQueryData(expenseApi.expenseKeys.detail(expenseDetail.id))).toBeUndefined();
    expect(queryClient.getQueryData(expenseApi.expenseKeys.lists())).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: expenseDetail.id })])
    );
    await waitFor(() =>
      expect(queryClient.getQueryState(summaryApi.summaryKeys.currentMonth())?.isInvalidated).toBe(true)
    );
  });

  it("keeps delete failure feedback in the dialog context", async () => {
    const user = userEvent.setup();
    vi.mocked(expenseApi.deleteExpense).mockRejectedValueOnce(new Error("Expense could not be deleted. Try again."));
    renderAppRoute(`/expenses/${expenseDetail.id}`);

    await user.click(await screen.findByRole("button", { name: /delete/i }));
    await user.click(within(screen.getByRole("dialog", { name: /delete this expense/i })).getByRole("button", { name: /^delete$/i }));

    expect(await screen.findByText("Expense could not be deleted. Try again.")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: /delete this expense/i })).toBeInTheDocument();
    expect(screen.getByText("₹125.50")).toBeInTheDocument();
  });

  it("shows not-found delete feedback without navigating away", async () => {
    const user = userEvent.setup();
    vi.mocked(expenseApi.deleteExpense).mockRejectedValueOnce(new Error("Expense was not found. It may have already been deleted."));
    renderAppRoute(`/expenses/${expenseDetail.id}`);

    await user.click(await screen.findByRole("button", { name: /delete/i }));
    await user.click(within(screen.getByRole("dialog", { name: /delete this expense/i })).getByRole("button", { name: /^delete$/i }));

    expect(await screen.findByText("Expense was not found. It may have already been deleted.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Expense details" })).toBeInTheDocument();
  });

  it("shows not-found detail feedback without crashing", async () => {
    vi.mocked(expenseApi.getExpense).mockRejectedValueOnce(new Error("Expense not found."));

    renderAppRoute("/expenses/20000000-0000-0000-0000-000000000999");

    expect(await screen.findByText("Expense not found.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to review/i })).toHaveAttribute("href", "/review");
  });

  it("prefills edit fields and updates valid values before returning to detail", async () => {
    const user = userEvent.setup();
    vi.mocked(expenseApi.updateExpense).mockResolvedValueOnce({
      ...expenseDetail,
      amount: 200,
      categoryId: starterCategories[1].id,
      categoryName: "Transport",
      expenseDate: "2026-09-17",
      description: "Auto ride"
    });
    const { queryClient } = renderAppRoute(`/expenses/${expenseDetail.id}/edit`);
    queryClient.setQueryData(summaryApi.summaryKeys.currentMonth(), summaryWithExpenses);

    const amountInput = await screen.findByLabelText("Amount");
    const dateInput = screen.getByLabelText("Date");
    const descriptionInput = screen.getByLabelText(/description/i);
    const foodChip = await screen.findByRole("button", { name: "Food" });
    const transportChip = screen.getByRole("button", { name: "Transport" });

    expect(amountInput).toHaveValue("125.50");
    expect(foodChip).toHaveAttribute("aria-pressed", "true");
    expect(dateInput).toHaveValue("2026-09-16");
    expect(descriptionInput).toHaveValue("Lunch");

    await user.clear(amountInput);
    await user.type(amountInput, "200.00");
    await user.click(transportChip);
    await user.clear(dateInput);
    await user.type(dateInput, "2026-09-17");
    await user.clear(descriptionInput);
    await user.type(descriptionInput, "Auto ride");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(expenseApi.updateExpense).toHaveBeenCalledWith(expenseDetail.id, {
      amount: 200,
      categoryId: starterCategories[1].id,
      expenseDate: "2026-09-17",
      description: "Auto ride"
    });
    expect(await screen.findByText("Expense updated.")).toBeInTheDocument();
    expect(screen.getByText("₹200.00")).toBeInTheDocument();
    expect(screen.getByText("Transport")).toBeInTheDocument();
    expect(screen.getByText("17 Sept 2026")).toBeInTheDocument();
    expect(screen.getByText("Auto ride")).toBeInTheDocument();
    await waitFor(() =>
      expect(queryClient.getQueryState(summaryApi.summaryKeys.currentMonth())?.isInvalidated).toBe(true)
    );
  });

  it("does not overwrite unsaved edit values when the detail query updates", async () => {
    const user = userEvent.setup();
    const { queryClient } = renderAppRoute(`/expenses/${expenseDetail.id}/edit`);

    const amountInput = await screen.findByLabelText("Amount");
    await user.clear(amountInput);
    await user.type(amountInput, "777.00");

    queryClient.setQueryData(expenseApi.expenseKeys.detail(expenseDetail.id), {
      ...expenseDetail,
      amount: 333
    });

    expect(amountInput).toHaveValue("777.00");
  });

  it("preserves entered edit values when frontend validation fails", async () => {
    const user = userEvent.setup();
    renderAppRoute(`/expenses/${expenseDetail.id}/edit`);

    const amountInput = await screen.findByLabelText("Amount");
    const descriptionInput = screen.getByLabelText(/description/i);

    await user.clear(amountInput);
    await user.clear(descriptionInput);
    await user.type(descriptionInput, "Still here");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(expenseApi.updateExpense).not.toHaveBeenCalled();
    expect(screen.getByText("Enter an amount to save this expense.")).toBeInTheDocument();
    expect(descriptionInput).toHaveValue("Still here");
  });

  it("maps backend edit validation feedback while preserving entered values", async () => {
    const user = userEvent.setup();
    vi.mocked(expenseApi.updateExpense).mockRejectedValueOnce(new expenseApi.ExpenseApiError({
      message: "One or more validation errors occurred.",
      status: 400,
      validationErrors: {
        Amount: ["Enter an amount with no more than two decimal places."]
      }
    }));
    renderAppRoute(`/expenses/${expenseDetail.id}/edit`);

    const amountInput = await screen.findByLabelText("Amount");
    const descriptionInput = screen.getByLabelText(/description/i);

    await user.clear(amountInput);
    await user.type(amountInput, "42.00");
    await user.clear(descriptionInput);
    await user.type(descriptionInput, "Snacks");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByText("Enter an amount with no more than two decimal places.")).toBeInTheDocument();
    expect(screen.getByText("Review the highlighted fields and try again.")).toBeInTheDocument();
    expect(amountInput).toHaveValue("42.00");
    expect(descriptionInput).toHaveValue("Snacks");
  });

  it("discards unsaved edit changes on cancel", async () => {
    const user = userEvent.setup();
    renderAppRoute(`/expenses/${expenseDetail.id}/edit`);

    const amountInput = await screen.findByLabelText("Amount");
    await user.clear(amountInput);
    await user.type(amountInput, "999.00");
    await user.click(screen.getByRole("link", { name: /cancel/i }));

    expect(await screen.findByRole("heading", { name: "Expense details" })).toBeInTheDocument();
    expect(screen.getByText("₹125.50")).toBeInTheDocument();
    expect(expenseApi.updateExpense).not.toHaveBeenCalled();
  });

  it("shows concise edit category load failure feedback", async () => {
    vi.mocked(categoryApi.getCategories).mockRejectedValueOnce(new Error("Nope"));

    renderAppRoute(`/expenses/${expenseDetail.id}/edit`);

    expect(await screen.findByText("Categories could not be loaded. Try refreshing before saving.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled();
  });

  it("uses backend-loaded category chips with selected state", async () => {
    const user = userEvent.setup();
    renderHome();

    const categories = screen.getByRole("group", { name: /category/i });
    const foodChip = await within(categories).findByRole("button", { name: "Food" });

    await user.click(foodChip);

    expect(categoryApi.getCategories).toHaveBeenCalledOnce();
    expect(foodChip).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps mobile reading order as add expense, current month, recent expenses", () => {
    renderHome();

    const home = screen.getByRole("main", { name: "Home" });
    const headings = within(home).getAllByRole("heading").map((heading) => heading.textContent);

    expect(headings).toEqual(["Track a new spend", "₹0.00", "Latest activity"]);
  });

  it("shows an inline category failure while keeping the Home shell visible", async () => {
    vi.mocked(categoryApi.getCategories).mockRejectedValueOnce(new Error("Nope"));

    renderHome();

    expect(screen.getByRole("heading", { name: /track a new spend/i })).toBeInTheDocument();
    expect(await screen.findByText("Categories could not be loaded. Try refreshing.")).toBeInTheDocument();
  });

  it("creates an expense with omitted description and resets for another entry", async () => {
    const user = userEvent.setup();
    renderHome();

    const foodChip = await screen.findByRole("button", { name: "Food" });
    const amountInput = screen.getByLabelText("Amount");
    const dateInput = screen.getByLabelText("Date");
    const descriptionInput = screen.getByLabelText(/description/i);

    await user.click(foodChip);
    await user.clear(amountInput);
    await user.type(amountInput, "125.50");
    await user.clear(dateInput);
    await user.type(dateInput, "2026-09-16");
    await user.click(screen.getByRole("button", { name: /save expense/i }));

    expect(expenseApi.createExpense).toHaveBeenCalledOnce();
    expect(vi.mocked(expenseApi.createExpense).mock.calls[0][0]).toEqual({
      amount: 125.5,
      categoryId: starterCategories[0].id,
      expenseDate: "2026-09-16",
      description: null
    });
    expect(await screen.findByText("Expense saved.")).toBeInTheDocument();
    expect(amountInput).toHaveValue("");
    expect(descriptionInput).toHaveValue("");
    expect((dateInput as HTMLInputElement).value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(foodChip).toHaveAttribute("aria-pressed", "false");
  });

  it("refreshes recent expenses after a successful create", async () => {
    const user = userEvent.setup();
    vi.mocked(summaryApi.getCurrentMonthSummary)
      .mockResolvedValueOnce(emptySummary)
      .mockResolvedValueOnce({
        ...emptySummary,
        totalAmount: 125.5,
        categoryBreakdown: [{ categoryId: starterCategories[0].id, categoryName: "Food", amount: 125.5 }],
        recentExpenses: [expenseRows[0]]
      });
    renderHome();

    expect(await screen.findByText("No expenses yet. Add your first one above.")).toBeInTheDocument();

    await user.click(await screen.findByRole("button", { name: "Food" }));
    await user.type(screen.getByLabelText("Amount"), "125.50");
    await user.click(screen.getByRole("button", { name: /save expense/i }));

    expect(await screen.findByText("Expense saved.")).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: /food/i })).toHaveTextContent("Lunch");
    await waitFor(() => expect(summaryApi.getCurrentMonthSummary).toHaveBeenCalledTimes(2));
  });

  it("prevents saving with a missing amount and keeps entered values", async () => {
    const user = userEvent.setup();
    renderHome();

    const foodChip = await screen.findByRole("button", { name: "Food" });
    const descriptionInput = screen.getByLabelText(/description/i);

    await user.click(foodChip);
    await user.type(descriptionInput, "Lunch");
    await user.click(screen.getByRole("button", { name: /save expense/i }));

    expect(expenseApi.createExpense).not.toHaveBeenCalled();
    expect(screen.getByText("Enter an amount to save this expense.")).toBeInTheDocument();
    expect(descriptionInput).toHaveValue("Lunch");
    expect(foodChip).toHaveAttribute("aria-pressed", "true");
  });

  it.each([
    ["0", /greater than zero/i],
    ["-1", /greater than zero/i],
    ["abc", /numbers only/i],
    ["12.345", /no more than two decimal places/i],
    ["10000000000", /below ₹10,000,000,000/i]
  ])("prevents saving invalid amount %s", async (invalidAmount, expectedMessage) => {
    const user = userEvent.setup();
    renderHome();

    await user.click(await screen.findByRole("button", { name: "Food" }));
    await user.type(screen.getByLabelText("Amount"), invalidAmount);
    await user.click(screen.getByRole("button", { name: /save expense/i }));

    expect(expenseApi.createExpense).not.toHaveBeenCalled();
    expect(screen.getByText(expectedMessage)).toBeInTheDocument();
  });

  it("prevents saving with an overlong description", async () => {
    const user = userEvent.setup();
    renderHome();

    const descriptionInput = screen.getByLabelText(/description/i);

    await user.click(await screen.findByRole("button", { name: "Food" }));
    await user.type(screen.getByLabelText("Amount"), "42.00");
    await user.type(descriptionInput, "x".repeat(241));
    await user.click(screen.getByRole("button", { name: /save expense/i }));

    expect(expenseApi.createExpense).not.toHaveBeenCalled();
    expect(screen.getByText("Keep description under 240 characters.")).toBeInTheDocument();
    expect(descriptionInput).toHaveValue("x".repeat(241));
  });

  it("prevents saving without a selected category", async () => {
    const user = userEvent.setup();
    renderHome();

    const amountInput = screen.getByLabelText("Amount");
    await user.type(amountInput, "42.00");
    await user.click(screen.getByRole("button", { name: /save expense/i }));

    expect(expenseApi.createExpense).not.toHaveBeenCalled();
    expect(screen.getByText("Choose a category to save this expense.")).toBeInTheDocument();
    expect(amountInput).toHaveValue("42.00");
  });

  it("prevents saving with an invalid date", async () => {
    const user = userEvent.setup();
    renderHome();

    await user.click(await screen.findByRole("button", { name: "Food" }));
    await user.type(screen.getByLabelText("Amount"), "42.00");
    await user.clear(screen.getByLabelText("Date"));
    await user.click(screen.getByRole("button", { name: /save expense/i }));

    expect(expenseApi.createExpense).not.toHaveBeenCalled();
    expect(screen.getByText("Enter a valid date in YYYY-MM-DD format.")).toBeInTheDocument();
  });

  it("clears stale field errors when the related input is corrected", async () => {
    const user = userEvent.setup();
    renderHome();

    const foodChip = await screen.findByRole("button", { name: "Food" });
    const amountInput = screen.getByLabelText("Amount");

    await user.click(foodChip);
    await user.click(screen.getByRole("button", { name: /save expense/i }));
    expect(screen.getByText("Enter an amount to save this expense.")).toBeInTheDocument();

    await user.type(amountInput, "42.00");

    expect(screen.queryByText("Enter an amount to save this expense.")).not.toBeInTheDocument();
    expect(amountInput).toHaveValue("42.00");
    expect(foodChip).toHaveAttribute("aria-pressed", "true");
  });

  it("maps backend validation feedback while preserving form data", async () => {
    const user = userEvent.setup();
    vi.mocked(expenseApi.createExpense).mockRejectedValueOnce(new expenseApi.ExpenseApiError({
      message: "One or more validation errors occurred.",
      status: 400,
      validationErrors: {
        Amount: ["Enter an amount with no more than two decimal places."]
      }
    }));
    renderHome();

    const foodChip = await screen.findByRole("button", { name: "Food" });
    const amountInput = screen.getByLabelText("Amount");
    const descriptionInput = screen.getByLabelText(/description/i);

    await user.click(foodChip);
    await user.type(amountInput, "42.00");
    await user.type(descriptionInput, "Snacks");
    await user.click(screen.getByRole("button", { name: /save expense/i }));

    expect(await screen.findByText("Enter an amount with no more than two decimal places.")).toBeInTheDocument();
    expect(screen.getByText("Review the highlighted fields and try again.")).toBeInTheDocument();
    expect(amountInput).toHaveValue("42.00");
    expect(descriptionInput).toHaveValue("Snacks");
    expect(foodChip).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText("Expense saved.")).not.toBeInTheDocument();
  });

  it("maps backend category validation feedback while preserving form data", async () => {
    const user = userEvent.setup();
    vi.mocked(expenseApi.createExpense).mockRejectedValueOnce(new expenseApi.ExpenseApiError({
      message: "One or more validation errors occurred.",
      status: 400,
      validationErrors: {
        CategoryId: ["Choose an existing category."]
      }
    }));
    renderHome();

    const foodChip = await screen.findByRole("button", { name: "Food" });
    const amountInput = screen.getByLabelText("Amount");
    const descriptionInput = screen.getByLabelText(/description/i);

    await user.click(foodChip);
    await user.type(amountInput, "42.00");
    await user.type(descriptionInput, "Snacks");
    await user.click(screen.getByRole("button", { name: /save expense/i }));

    expect(await screen.findByText("Choose an existing category.")).toBeInTheDocument();
    expect(screen.getByText("Review the highlighted fields and try again.")).toBeInTheDocument();
    expect(amountInput).toHaveValue("42.00");
    expect(descriptionInput).toHaveValue("Snacks");
    expect(foodChip).toHaveAttribute("aria-pressed", "true");
  });

  it("maps backend date and description validation feedback while preserving form data", async () => {
    const user = userEvent.setup();
    vi.mocked(expenseApi.createExpense).mockRejectedValueOnce(new expenseApi.ExpenseApiError({
      message: "One or more validation errors occurred.",
      status: 400,
      validationErrors: {
        ExpenseDate: ["Choose a date."],
        Description: ["Keep description under 240 characters."]
      }
    }));
    renderHome();

    const foodChip = await screen.findByRole("button", { name: "Food" });
    const amountInput = screen.getByLabelText("Amount");
    const dateInput = screen.getByLabelText("Date");
    const descriptionInput = screen.getByLabelText(/description/i);

    await user.click(foodChip);
    await user.type(amountInput, "42.00");
    await user.clear(dateInput);
    await user.type(dateInput, "2026-09-16");
    await user.type(descriptionInput, "Snacks");
    await user.click(screen.getByRole("button", { name: /save expense/i }));

    expect(await screen.findByText("Choose a date.")).toBeInTheDocument();
    expect(screen.getByText("Keep description under 240 characters.")).toBeInTheDocument();
    expect(screen.getByText("Review the highlighted fields and try again.")).toBeInTheDocument();
    expect(amountInput).toHaveValue("42.00");
    expect(dateInput).toHaveValue("2026-09-16");
    expect(descriptionInput).toHaveValue("Snacks");
    expect(foodChip).toHaveAttribute("aria-pressed", "true");
  });

  it("shows operation failure feedback while preserving form data", async () => {
    const user = userEvent.setup();
    vi.mocked(expenseApi.createExpense).mockRejectedValueOnce(new Error("Network down"));
    renderHome();

    const foodChip = await screen.findByRole("button", { name: "Food" });
    const amountInput = screen.getByLabelText("Amount");
    const descriptionInput = screen.getByLabelText(/description/i);

    await user.click(foodChip);
    await user.type(amountInput, "42.00");
    await user.type(descriptionInput, "Snacks");
    await user.click(screen.getByRole("button", { name: /save expense/i }));

    await waitFor(() => expect(expenseApi.createExpense).toHaveBeenCalledOnce());
    expect(await screen.findByText("Expense could not be saved. Check the details and try again.")).toBeInTheDocument();
    expect(amountInput).toHaveValue("42.00");
    expect(descriptionInput).toHaveValue("Snacks");
    expect(foodChip).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText("Expense saved.")).not.toBeInTheDocument();
  });

  it("clears stale success feedback when a later save fails", async () => {
    const user = userEvent.setup();
    renderHome();

    const foodChip = await screen.findByRole("button", { name: "Food" });
    const amountInput = screen.getByLabelText("Amount");
    const descriptionInput = screen.getByLabelText(/description/i);

    await user.click(foodChip);
    await user.type(amountInput, "42.00");
    await user.click(screen.getByRole("button", { name: /save expense/i }));
    expect(await screen.findByText("Expense saved.")).toBeInTheDocument();

    vi.mocked(expenseApi.createExpense).mockRejectedValueOnce(new Error("Network down"));
    await user.click(foodChip);
    await user.type(amountInput, "55.00");
    await user.type(descriptionInput, "Retry");
    await user.click(screen.getByRole("button", { name: /save expense/i }));

    expect(await screen.findByText("Expense could not be saved. Check the details and try again.")).toBeInTheDocument();
    expect(screen.queryByText("Expense saved.")).not.toBeInTheDocument();
    expect(amountInput).toHaveValue("55.00");
    expect(descriptionInput).toHaveValue("Retry");
    expect(foodChip).toHaveAttribute("aria-pressed", "true");
  });
});
