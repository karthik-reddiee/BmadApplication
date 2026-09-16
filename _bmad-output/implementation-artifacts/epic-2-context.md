# Epic 2 Context: Expense Review and Maintenance

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Epic 2 turns saved Expenses into maintainable records. Users can review recent and all recorded expenses, open one expense for read-only inspection, edit mistakes, and delete only after confirmation. This matters because the capture flow from Epic 1 is only useful if the user can later confirm what was recorded and safely correct or remove wrong entries.

## Stories

- Story 2.1: Review Recorded Expenses
- Story 2.2: View and Edit Expense Details
- Story 2.3: Delete an Expense with Confirmation

## Requirements & Constraints

Home must show exactly 5 Recent Expenses when expenses exist. Rows contain amount, Category, date, and optional description as secondary text when present. Recent Expenses are ordered by `ExpenseDate` descending, then `CreatedAt` descending as the stable same-date tie-breaker. Each row opens Expense Detail.

Review must show all recorded Expenses in one simple scrollable list using the same row structure and ordering as Home. MVP Review must not include grouping, pagination, infinite scroll, search, filtering, sorting controls, chart exploration, or analytics. When no expenses exist, Home keeps Add Expense visible and Recent Expenses shows `No expenses yet. Add your first one above.`; Review shows `No expenses recorded yet.` and a clear route back to Home.

Expense Detail is read-only by default and shows amount, Category, date, and optional description. Edit and Delete actions live on the detail surface, not directly on list rows. Edit uses the same Expense form pattern as Add Expense, pre-populated with the existing amount, Category chip, date, and optional description. Cancel or Back discards unsaved changes and returns to Detail. Successful update shows `Expense updated.` and refreshes Home, Review, Detail, and relevant server state.

Delete requires an accessible confirmation dialog with concise title/explanation, Cancel, and visually destructive Delete action. Cancel leaves the expense unchanged. Confirm deletes through the API, shows `Expense deleted.`, and refreshes Home/Review lists and relevant summary state. MVP has no undo, trash, archive, recovery, or soft-delete recovery workflow.

Validation and failures keep the user in context, preserve entered data where applicable, and show concise actionable feedback near the relevant field/action. Create/update validation rules are shared: amount, Category, and date are required; amount must be positive with up to 2 decimal places; description is optional. Backend validation remains authoritative and returns ProblemDetails/ValidationProblemDetails.

## Technical Decisions

Use the existing React/Vite TypeScript frontend, ASP.NET Core Web API backend, and PostgreSQL persistence. Preserve the single backend project with feature folders, Domain, Data, and explicit DTO contracts. Endpoints remain thin and delegate to feature services; do not expose EF Core/domain entities directly.

Use resource-oriented REST for Expenses. Story 2.1 needs expense list readers; Story 2.2 needs detail and update; Story 2.3 needs delete. Do not introduce CQRS, MediatR, Redux, Zustand, auth/user tables, UserId columns, or startup auto-migrations.

Expense keeps `CategoryId` and resolves Category names for list/detail DTOs. Do not snapshot Category name into Expense. Monetary values remain .NET `decimal` and PostgreSQL `numeric(12,2)`. `ExpenseDate` remains `DateOnly` mapped to PostgreSQL `date`; `CreatedAt` and `UpdatedAt` remain UTC timestamps. API dates use `YYYY-MM-DD`; timestamps use ISO 8601.

Frontend server state for expense lists, detail, mutations, categories, and summaries belongs to TanStack Query. UI components import typed DTOs and API functions from `shared/api`; feature UI should not hand-shape raw backend responses. React Router owns navigation among Home, Review, Detail, and Edit surfaces.

Backend integration tests should cover PostgreSQL-sensitive ordering, retrieval, update, delete, and error behavior when Docker/Testcontainers is available. In this local environment, if Docker is unavailable, compile the tests and record Testcontainers execution as an environment blocker without changing architecture.

## UX & Interaction Patterns

Home stays the default landing surface with Add Expense first, Current Month summary second, and Recent Expenses third on mobile; desktop keeps Add Expense and summary in the main/left column with Recent Expenses on the right. Add Expense remains visible in empty states.

Expense rows should be clean, tappable/clickable, keyboard-accessible rows. They show INR amounts, Category, date, and optional description as secondary text. Row actions should navigate to Expense Detail; list rows do not show inline edit/delete controls.

Review is a simple browsing surface, not a data table. It uses the same navigation IA as Home and Categories. Empty Review uses the exact copy `No expenses recorded yet.` and provides a clear route back to Home.

Detail/Edit/Delete interactions must follow the established clean personal-utility visual system: warm off-white page, white surfaces, teal primary action, semantic danger for destructive action, practical spacing, modest radii, and no dense dashboard treatment.

Accessibility expectations include meaningful labels, keyboard access for rows/actions/forms/dialogs, focus order following reading order, validation feedback associated with fields, dialog focus management, and destructive/selected/error states that do not rely on color alone.

## Cross-Story Dependencies

Story 2.1 depends on Epic 1's persisted Expense model, Category model, create API, Add Expense mutation invalidations, and validation behavior. It establishes list DTO/API/query patterns that Story 2.2 reuses for detail navigation and edit refresh.

Story 2.2 depends on Story 2.1 row navigation and list readers. It adds read-only detail and update behavior that must refresh the same list/query keys.

Story 2.3 depends on Story 2.2 detail actions. It adds destructive confirmation and delete behavior that must remove the expense from Home/Review and refresh related server state.
