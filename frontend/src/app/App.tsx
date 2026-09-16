import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppNavigation } from "./navigation";
import { HomePage } from "./HomePage";
import { ReviewPage } from "./ReviewPage";
import { CategoriesPage } from "../features/categories/CategoriesPage";
import { ExpenseDetailPage } from "../features/expenses/ExpenseDetailPage";
import { ExpenseEditPage } from "../features/expenses/ExpenseEditPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false
    }
  }
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="app-shell">
          <header className="app-header">
            <div className="brand-mark">
              <span>₹</span>
              <strong>Expense Tracker</strong>
            </div>
            <AppNavigation />
          </header>
          <Routes>
            <Route element={<HomePage />} path="/" />
            <Route element={<ReviewPage />} path="/review" />
            <Route element={<ExpenseDetailPage />} path="/expenses/:expenseId" />
            <Route element={<ExpenseEditPage />} path="/expenses/:expenseId/edit" />
            <Route element={<CategoriesPage />} path="/categories" />
            <Route element={<Navigate replace to="/" />} path="*" />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
