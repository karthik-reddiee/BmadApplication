---
title: 'Story 1.2: Create an Expense End-to-End'
type: 'feature'
created: '2026-09-16'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '7acbffa7e5e6b98e5b49c3d56f88cbac0f0b13b7'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

## Intent

**Problem:** Home can show starter categories, but the Add Expense form still cannot save a real Expense. The user needs the common capture path to persist amount, Category, date, and optional description without adding unrelated navigation or broader finance features.

**Approach:** Add the Expense domain/persistence/API path and activate the existing Add Expense form with a TanStack Query mutation. Keep the normal path small: amount entry, Category chip selection, default editable date, optional description, Save, successful persistence, `Expense saved.`, and form reset.

## Boundaries & Constraints

**Always:** Expense stores amount, CategoryId, ExpenseDate, optional description, CreatedAt, and UpdatedAt only. Amount uses .NET `decimal` and PostgreSQL `numeric(12,2)`; ExpenseDate uses `DateOnly` mapped to PostgreSQL `date`; timestamps are UTC `timestamptz`. API contracts use explicit create request/response DTOs and never expose EF/domain entities. Add Expense uses backend-loaded category chips from Story 1.1, keeps the date visible/editable, defaults date using `Asia/Kolkata`, displays INR (`₹`), and resets after a successful save. TanStack Query owns the create mutation and invalidates or updates relevant expense/category/summary query keys.

**Never:** Do not add per-expense currency, exchange rates, conversion, payment method, merchant, receipt, tags, user/auth concepts, search/filter/review features, current-month summary calculations, or custom category management. Do not move Story 1.3's full validation/error-feedback scope into this story, but do not persist obviously invalid server data.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Common save | Amount `125.50`, selected Default Category, default today date, empty description | POST creates an Expense row and response DTO; form shows `Expense saved.` and resets for another entry | If save request fails, stay on Home and preserve entered form values |
| Optional description | Valid create with description omitted or blank | Persist/return no meaningful description value; no extra fields are required | N/A |
| Persistence types | Valid create request reaches backend | Amount stored as `numeric(12,2)`, ExpenseDate as `date`, CreatedAt/UpdatedAt as UTC `timestamptz` | Backend rejects invalid category or missing/invalid core values rather than saving corrupt data |
| Currency scope | Create request/response and UI display | INR symbol is display-only; no currency field exists in request, response, entity, or migration | N/A |

</frozen-after-approval>

## Code Map

- `_bmad-output/implementation-artifacts/epic-1-context.md` -- Epic 1 constraints, especially create expense, decimal/date persistence, TanStack Query, and Story 1.3 boundary.
- `_bmad-output/implementation-artifacts/spec-1-1-open-the-home-experience-with-starter-categories.md` -- completed scaffold continuity; keep Story 1.1 files intact while extending them.
- `_bmad-output/planning-artifacts/epics.md` -- Story 1.2 acceptance criteria and Story 1.3 validation split.
- `backend/Domain/Category.cs` -- existing domain style; add an `Expense` domain model alongside it.
- `backend/Data/AppDbContext.cs` and `backend/Data/Migrations/**` -- existing EF model/migration pattern; add `Expenses`, FK to `Category`, decimal/date/timestamp configuration, and a new migration.
- `backend/Features/Categories/**` and `backend/Program.cs` -- thin endpoint + feature service registration pattern to mirror for `Features/Expenses`.
- `frontend/src/features/expenses/AddExpensePanel.tsx` -- existing disabled Add Expense shell; convert to controlled submit flow without changing the Home layout contract.
- `frontend/src/shared/api/categories.ts` and `frontend/src/features/categories/useCategories.ts` -- API/hook pattern; add expense DTO/API/mutation equivalents under `shared/api` and `features/expenses`.
- `frontend/src/app/App.test.tsx` -- extend or add focused tests for successful create with omitted description and form reset.
- `tests/backend-integration/CategoryApiTests.cs` -- Testcontainers/WebApplicationFactory pattern; add expense create tests while recognizing Docker may block execution locally.
- Do not reset, discard, overwrite, or otherwise rework existing Story 1.1 implementation files beyond the smallest Story 1.2 extensions.

## Tasks & Acceptance

**Execution:**
- [x] `backend/Domain/Expense.cs` -- add Expense entity and creation behavior for amount, category, date, optional description, and timestamps -- centralizes core persisted shape.
- [x] `backend/Data/AppDbContext.cs`, `backend/Data/Migrations/**` -- add EF mapping/migration for `expenses` with `numeric(12,2)`, `date`, `timestamptz`, required Category FK, and no currency column -- satisfies persistence contract.
- [x] `backend/Features/Expenses/**`, `backend/Program.cs` -- add create request/response DTOs, feature service, `POST /api/expenses`, and service/endpoint registration -- exposes explicit REST contract without leaking entities.
- [x] `frontend/src/shared/api/expenses.ts`, `frontend/src/features/expenses/useCreateExpense.ts` -- add DTO/API function and TanStack Query mutation with relevant invalidation/update hooks -- connects UI to backend state ownership.
- [x] `frontend/src/features/expenses/AddExpensePanel.tsx` -- activate controlled form submit, selected category, editable default date, optional description, success copy, and reset after successful save -- completes the fast capture path.
- [x] `frontend/src/app/App.test.tsx` or colocated expense tests -- cover successful Add Expense submission with omitted description, API payload, success copy, and reset behavior -- verifies the user-facing happy path.
- [x] `tests/backend-integration/**` -- cover valid create, DTO mapping, decimal/date/timestamp persistence, Category FK use, and absence of currency fields -- verifies backend contract and PostgreSQL-sensitive behavior.

**Acceptance Criteria:**
- Given Home has categories, when the user enters amount, selects a category, keeps today's default date, omits description, and saves, then the app creates an Expense and resets the form with `Expense saved.`.
- Given a valid create request reaches the API, when it is handled, then the response is an explicit DTO containing the saved expense data and no EF/domain entity or currency field.
- Given the database row is inspected after create, when persistence is verified, then amount/date/timestamps use the required PostgreSQL types and the row references the selected CategoryId.
- Given the common path is used, when the user records an expense, then no unrelated navigation is required and the amount field remains first with INR display.
- Given Story 1.3 remains future work, when validation is reviewed, then this story includes enough backend guardrails to avoid corrupt saves but does not attempt the full inline validation/error UX suite.

## Implementation Notes

- Implemented Expense domain/persistence/API path, EF migration, Add Expense create mutation, success/reset behavior, and frontend/backend tests for Story 1.2.
- Review patch added backend guards for overlong descriptions and values beyond `numeric(12,2)`, replaced fragile locale date formatting with `formatToParts`, kept explicit category chip selection required, and added missing frontend API-client/backend invalid-request tests.
- Verified `npm --prefix frontend test`, `npm --prefix frontend run build`, `dotnet build backend/backend.csproj --no-restore`, and `dotnet build tests/backend-integration/backend-integration.csproj --no-restore`.
- `dotnet test tests/backend-integration/backend-integration.csproj --no-build` is blocked in this environment because Docker is not running or reachable for Testcontainers. The tests are present and compile; no Docker workaround or architecture change was introduced.

## Spec Change Log

## Review Triage Log

- patch: Overlarge amounts could reach PostgreSQL and fail at `SaveChangesAsync`; added an explicit `numeric(12,2)` upper-bound guard and invalid-request test coverage.
- patch: Descriptions longer than the EF column limit could fail as persistence errors; added a 240-character guard and invalid-request test coverage.
- patch: Default date formatting relied on locale output shape; changed to `formatToParts`-based `YYYY-MM-DD` construction.
- patch: Invalid backend create branches lacked verification; added parameterized integration tests for amount, category, date, and description validation paths.
- patch: Frontend create API path was mocked away from tests; added focused `createExpense` fetch-shape and error tests.
- false: Full frontend field-level validation, field-specific ProblemDetails rendering, and richer operation-failure feedback belong to Story 1.3 per the approved scope.
- false: Returning `201 Created` with a future expense resource URI is acceptable for the create contract and does not require adding Review/detail retrieval in Story 1.2.
- deferred-low: Category order verification is useful but not part of Story 1.2's create-expense intent; current work preserves backend-loaded chips from Story 1.1.

## Design Notes

Do not introduce a Review list or real Current Month summary in this story. After create, invalidating placeholder future keys such as `["expenses"]` or `["current-month-summary"]` is acceptable so Story 4 can attach real readers later without changing mutation semantics.

## Verification

**Commands:**
- `npm --prefix frontend test` -- expected: frontend tests pass, including successful create with omitted description.
- `npm --prefix frontend run build` -- expected: TypeScript/Vite build succeeds.
- `dotnet build backend/backend.csproj --no-restore` -- expected: backend compiles.
- `dotnet build tests/backend-integration/backend-integration.csproj --no-restore` -- expected: backend integration test project compiles.
- `dotnet test tests/backend-integration/backend-integration.csproj --no-build` -- expected: passes when Docker/Testcontainers is available; record Docker unavailability as an environment verification blocker, not an architecture change.
