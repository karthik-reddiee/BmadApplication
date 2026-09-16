---
id: SPEC-bmad-expense-tracker
companions:
  - ../../planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/DESIGN.md
  - ../../planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/EXPERIENCE.md
  - ../../planning-artifacts/architecture/architecture-bmad-expense-tracker-2026-09-15/ARCHITECTURE-SPINE.md
sources:
  - ../../planning-artifacts/briefs/brief-bmad-expense-tracker-2026-09-15/brief.md
  - ../../planning-artifacts/prds/prd-bmad-expense-tracker-2026-09-15/prd.md
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability only.

# bmad-expense-tracker

## Why

bmad-expense-tracker exists to help an individual record everyday spending quickly and understand current-month spending without adopting spreadsheets or a full personal-finance platform. It is also an internal BMAD learning MVP, so the product must stay small enough to implement, test, review, and trace cleanly from planning artifacts into epics and stories.

## Capabilities

- **CAP-1**
  - **intent:** User can quickly create an expense with amount, category, date defaulted to today, and optional description.
  - **success:** A normal expense can be saved in under 30 seconds using amount, category, and save; the saved expense displays as INR (`₹`) and does not require description or currency selection.

- **CAP-2**
  - **intent:** User can review recent and all recorded expenses, inspect one expense, edit it, or delete it after confirmation.
  - **success:** Expense lists, detail, and current-month summary reflect create, edit, and delete operations accurately; canceling edit or delete leaves the expense unchanged.

- **CAP-3**
  - **intent:** User can use protected default categories and manage simple custom categories for expense entry and summaries.
  - **success:** Default categories are available immediately and cannot be destructively changed; custom category renames preserve existing expense associations, and deletion is blocked when a category is used by expenses.

- **CAP-4**
  - **intent:** User can understand current-month spending through total amount, category breakdown, and recent expenses.
  - **success:** The main experience answers "How much did I spend this month?" and "Where did most of my money go this month?" using only expenses dated within the current month, updating after every relevant expense change.

## Constraints

- The MVP is a single-user internal learning web app with no real authentication, accounts, roles, permissions, sharing, collaboration, user table, user ownership, deployment requirement, or production-grade operational target.
- Expense records include only amount, category, date, and optional description; payment method, merchant, location, receipt, account, tags, and similar fields are outside the MVP.
- Amounts use one implicit application-level INR currency, display `₹`, require positive values up to 2 decimal places, and must not introduce per-expense currency, conversion, or exchange rates.
- Date defaults to today, remains editable, uses Asia/Kolkata current-month semantics, and expense lists order by expense date descending with created time as the same-date tie-breaker.
- Home prioritizes inline Add Expense, current-month summary, and exactly 5 Recent Expenses; Review lists all expenses in one simple scroll without search, filtering, grouping, pagination, or advanced analytics.
- Default categories include everyday options such as Food, Transport, Shopping, Bills, Entertainment, Health, Education, and Other; defaults are protected from destructive changes.
- Custom category deletion is allowed only when unused; in-use deletion is blocked with explanatory feedback and no automatic expense reassignment.
- UX must follow adopted `DESIGN.md` and `EXPERIENCE.md` for mobile-first IA, component behavior, feedback states, accessibility floor, microcopy, colors, typography, and layout.
- Architecture must follow adopted `ARCHITECTURE-SPINE.md`: React/Vite TypeScript frontend, ASP.NET Core Web API, PostgreSQL, explicit DTO REST contracts, layered backend, TanStack Query server state, and committed EF migrations.
- Monetary persistence must use .NET `decimal` and PostgreSQL `numeric(12,2)`; current-month summary data is calculated on demand from normalized expenses and categories, not denormalized summary state.
- Validation is enforced on both frontend and backend; API errors use `ProblemDetails` / `ValidationProblemDetails`, and operations must preserve data integrity and fresh summaries.
- Verification must cover backend business rules, PostgreSQL-sensitive API/EF behavior, meaningful frontend form/interactions, and a few critical E2E journeys without targeting 100 percent coverage.

## Non-goals

- Full personal finance, budgeting, savings goals, forecasting, financial advice, or money movement.
- Bank or credit-card integration, automatic imports, receipt scanning/OCR, recurring expense automation, or automatic categorization.
- Income, investments, bills, business expense, accounting, reimbursement, tax, export, or compliance workflows.
- Multi-user, household, shared expense, collaboration, roles, permissions, or real identity workflows.
- Previous-month comparisons, percentage changes, trend analysis, dense dashboards, chart exploration, search/filter/sort-heavy review, or advanced analytics.
- Multi-currency expenses, exchange rates, currency conversion, or per-expense currency selection.
- Production deployment, CI/CD, environment topology, production observability, large-scale load testing, or formal security/compliance certification.

## Success signal

The MVP is successful when a user can record a normal expense quickly, later correct or delete it, and answer current-month spending total plus largest spending categories from the main experience. The project is successful as a BMAD learning MVP when the resulting stories can implement the React/.NET/PostgreSQL app while preserving the product, UX, architecture, and test boundaries in this spec.

## Assumptions

- Entity id type follows the architecture assumption of `Guid` unless implementation selects a simpler numeric id before the first EF Core migration.
