---
title: 'Story 2.1: Review Recorded Expenses'
type: 'feature'
created: '2026-09-16'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '7acbffa7e5e6b98e5b49c3d56f88cbac0f0b13b7'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

## Intent

**Problem:** Expenses can be captured, but the app still shows placeholder recent activity and a placeholder Review route. The user needs to confirm recently recorded expenses from Home and browse all recorded expenses from Review.

**Approach:** Add ordered Expense retrieval through explicit DTOs, render Home Recent Expenses as the latest 5 rows, replace the Review placeholder with a simple all-expenses list, and make each row navigate toward the future Expense Detail route without implementing detail/edit/delete yet.

## Boundaries & Constraints

**Always:** Expense rows show INR amount, Category name, date, and optional description as secondary text when present. Ordering is `ExpenseDate` descending then `CreatedAt` descending. Home shows exactly 5 recent expenses when more exist; Review shows all expenses in one simple scroll. TanStack Query owns list server state and imports typed DTO/API functions from `shared/api`. Empty Home keeps Add Expense visible and Recent Expenses copy remains `No expenses yet. Add your first one above.` Empty Review copy is `No expenses recorded yet.` with a clear route back to Home.

**Never:** Do not implement Expense Detail, Edit, Delete, search, filter, sort controls, grouping, pagination, infinite scroll, charts, analytics, summaries, category management, auth, or new architecture/state libraries in this story.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Home recent expenses | More than 5 expenses exist | Home renders exactly 5 rows ordered by ExpenseDate desc then CreatedAt desc | If API fails, show concise list failure without hiding Add Expense |
| Review all expenses | Any number of expenses exist | Review renders all rows with same row structure/order as Home | If API fails, show concise Review failure |
| Optional description | Expense description is null/blank | Row omits secondary description text while still showing amount/category/date | N/A |
| Empty Home | No expenses exist | Recent Expenses shows `No expenses yet. Add your first one above.` | Add Expense remains usable |
| Empty Review | No expenses exist | Review shows `No expenses recorded yet.` and a Home route | N/A |
| Row navigation affordance | User activates a row | App navigates to `/expenses/{id}` for future detail | Detail route may remain a placeholder until Story 2.2 |

</frozen-after-approval>

## Code Map

- `_bmad-output/implementation-artifacts/epic-2-context.md` -- Epic 2 review/list/detail boundaries and no advanced Review controls.
- `_bmad-output/implementation-artifacts/spec-1-3-validate-fast-expense-capture-with-clear-feedback.md` -- completed Add Expense mutation/invalidations; preserve create behavior and query invalidation intent.
- `backend/Features/Expenses/ExpenseService.cs` and `ExpenseEndpoints.cs` -- add ordered list retrieval alongside create without exposing entities.
- `backend/Features/Expenses/ExpenseDto.cs` -- current create DTO lacks Category name; add or introduce a list DTO that includes Category display data for rows.
- `frontend/src/shared/api/expenses.ts` -- add typed list DTO/API function while preserving create API/error behavior.
- `frontend/src/features/expenses/RecentExpenses.tsx` -- replace placeholder with query-backed Home recent list and failure/empty states.
- `frontend/src/app/PlaceholderPage.tsx` / `App.tsx` -- replace Review placeholder with a real Review page; future detail route can remain placeholder.
- `frontend/src/app/styles.css` -- add modest row/list styles consistent with existing surfaces.
- `frontend/src/app/App.test.tsx` and `frontend/src/shared/api/expenses.test.ts` -- cover Home recent limit/order rendering, Review all/empty states, row navigation, and API client shape.
- `tests/backend-integration/CategoryApiTests.cs` -- add ordered retrieval tests while preserving Docker/Testcontainers setup.

## Tasks & Acceptance

**Execution:**
- [x] `backend/Features/Expenses/**` -- add GET expense list endpoint/service method with explicit row DTO including Category name and stable ordering -- supports Home and Review without leaking entities.
- [x] `frontend/src/shared/api/expenses.ts` -- add list DTO/API function and query key usage compatible with existing create invalidations -- keeps the frontend/backend contract typed.
- [x] `frontend/src/features/expenses/RecentExpenses.tsx` and new Review component/page as needed -- render Home limit and Review all-expense rows, empty/failure states, and row navigation affordance -- satisfies user-facing review behavior.
- [x] `frontend/src/app/App.tsx` / routing -- wire Review page and future `/expenses/:expenseId` placeholder route without implementing detail -- enables row navigation now and Story 2.2 continuation.
- [x] `frontend/src/app/styles.css` -- add list/row styling and accessible focus affordances without redesign -- keeps UX consistent.
- [x] `frontend/src/app/App.test.tsx`, `frontend/src/shared/api/expenses.test.ts`, `tests/backend-integration/**` -- add focused tests for ordered retrieval, Home recent limit, Review all/empty, and row navigation -- verifies the matrix.

**Acceptance Criteria:**
- Given expenses exist, when Home renders, then Recent Expenses shows 5 or fewer ordered rows with amount, Category, date, and optional description.
- Given expenses exist, when Review renders, then all expenses use the same row structure and ordering as Home.
- Given no expenses exist, when Home or Review renders, then the finalized empty-state copy appears in the right context.
- Given a row is activated, when navigation occurs, then the URL targets the future Expense Detail route and no inline edit/delete actions are shown.

## Implementation Notes

- Added `GET /api/expenses` returning explicit list-row DTOs with Category name and ordered by ExpenseDate descending, CreatedAt descending, then Id descending for deterministic ties.
- Added query-backed Home Recent Expenses, shared expense row/list UI, a real Review page, and a future detail placeholder route at `/expenses/:expenseId`.
- Review patch added Home/Review loading states, Review route failure coverage, list refetch-after-create coverage, and backend empty-list retrieval coverage.

## Spec Change Log

## Review Triage Log

- low / patch: Review load failure state existed but was not covered at the route boundary. Added a `/review` rejection test asserting `Expenses could not be loaded. Try refreshing.` while the Review heading remains visible.
- medium / patch: Successful create invalidated expense list queries but no test proved Home Recent Expenses refreshed. Added a test that starts empty, saves an expense, then verifies the refetched recent row appears.
- low / patch: Home and Review briefly showed empty-state copy while the expense list query was pending. Added `Loading expenses...` states and tests for both surfaces.
- low / patch: Identical ExpenseDate and CreatedAt values could still produce unstable ordering. Added Id descending as a deterministic tertiary sort.
- low / patch: Backend retrieval tests covered populated lists but not the empty-list contract. Added `Expenses_endpoint_returns_empty_list_when_no_expenses_exist`.
- false: Findings claiming `ReviewPage.tsx`, `ExpenseList.tsx`, and row behavior were absent were disproven by the files and passing frontend build/tests.
- false: Adding a backend recent-limit endpoint is not required by Story 2.1; the approved scope uses one all-expenses reader with Home applying the display limit, and the MVP is single-user.
- false: Renaming the backend integration fixture and README/appsettings documentation updates are not concrete implementation blockers for Story 2.1.

## Verification

**Commands:**
- `npm --prefix frontend test` -- passed: 2 files, 34 tests.
- `npm --prefix frontend run build` -- passed: TypeScript/Vite build succeeded.
- `dotnet build backend/backend.csproj --no-restore` -- passed: backend compiled with 0 warnings/errors.
- `dotnet build tests/backend-integration/backend-integration.csproj --no-restore` -- passed on sequential rerun; warning NU1903 for transitive `SSH.NET` vulnerability remains.
- `docker info --format '{{.ServerVersion}}'` -- blocked earlier in this session because Docker daemon was unavailable at `/Users/wallstreet62/.docker/run/docker.sock`; Testcontainers suite not run per no-Docker local rule.
