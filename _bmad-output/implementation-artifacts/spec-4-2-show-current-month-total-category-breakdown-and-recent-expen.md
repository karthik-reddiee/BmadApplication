---
title: 'Story 4.2: Show Current-Month Total, Category Breakdown, and Recent Expenses on Home'
type: 'feature'
created: '2026-09-16'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '7acbffa7e5e6b98e5b49c3d56f88cbac0f0b13b7'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-4-context.md'
---

<frozen-after-approval reason="auto-approved from finalized artifacts">

## Intent

**Problem:** Home still shows placeholder current-month content and old recent-expense list behavior instead of the finalized current-month spending-awareness experience.

**Approach:** Add a typed summary API client/hook, render total INR, ranked category breakdown with simple bars, zero state with no fake bars, and current-month recent expenses from the summary endpoint while preserving Add Expense-first layout.

## Boundaries & Constraints

**Always:** Home shows Add Expense first, then current-month summary, then current-month recent expenses on mobile. Total displays INR. Breakdown includes every nonzero category ranked by amount with name, amount, and simple bar. Zero state shows INR 0 and no fake bars. Recent rows show amount/category/date/description and open Expense Detail.

**Never:** Do not add pie/donut charts, multiple chart types, expand/collapse, previous-month comparison, percentages, trends, analytics destination, search/filter/sort-heavy review, auth, Docker, Redux/Zustand, or frontend financial aggregation.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Summary loaded | Current-month data exists | Total, ranked breakdown bars, recent rows render | N/A |
| Zero state | Empty summary | INR 0 total, no fake bars, finalized empty copy | Add form remains visible |
| Failure/loading | Summary API pending/fails | Loading/failure feedback in summary context | Add form remains visible |
| Row click | Recent expense selected | Opens Expense Detail | Existing route behavior |

</frozen-after-approval>

## Code Map

- `frontend/src/shared/api/summaries.ts` -- typed current-month summary API.
- `frontend/src/features/expenses/CurrentMonthSummary.tsx` -- render real total/breakdown/zero/failure states.
- `frontend/src/features/expenses/RecentExpenses.tsx` or Home composition -- use summary recent expenses for current-month recent context.
- `frontend/src/app/HomePage.tsx`, `styles.css`, `App.test.tsx` -- wire Home UI and tests.

## Tasks & Acceptance

**Execution:**
- [x] Frontend API -- add summary DTOs/client/query key.
- [x] Home summary -- render INR total, ranked nonzero breakdown bars, zero state, loading/failure state.
- [x] Home recent -- render current-month recent rows from summary endpoint with existing row behavior.
- [x] Tests -- cover total, ranked breakdown, zero state/no fake bars, row content/navigation, and mobile order expectation.

**Acceptance Criteria:**
- Given Home renders with summary data, then total, every nonzero category breakdown row, and current-month recent rows are visible.
- Given no current-month expenses exist, then total visibly shows INR 0, no fake bars appear, and the Add Expense form remains usable.
- Given current-month recent rows render, then rows show identifying information and open Expense Detail.

## Implementation Notes

- Added `frontend/src/shared/api/summaries.ts` and `useCurrentMonthSummary` to load the backend `/api/summaries/current-month` response without frontend aggregation.
- Updated Home summary and recent-expense panels to share the summary query, render the finalized zero state with no breakdown list, and keep row navigation into Expense Detail.
- Updated Home tests and summary API tests to cover loaded totals, ranked category rows, zero state/no fake bars, failure/loading states, mobile reading order, and row navigation.

## Spec Change Log

- Completed as scoped; no product scope changes.

## Review Triage Log

- No review findings pending.

## Verification

**Commands:**
- `npm --prefix frontend test`
- `npm --prefix frontend run build`
- `dotnet build backend/backend.csproj --no-restore`
- `dotnet build tests/backend-integration/backend-integration.csproj --no-restore`
- `dotnet test tests/backend-integration/backend-integration.csproj --no-build` -- only when Docker is available.

**Results:**
- PASS -- `npm --prefix frontend test` (78 tests)
- PASS -- `npm --prefix frontend run build`
- PASS -- `dotnet build backend/backend.csproj --no-restore`
- PASS -- `dotnet build tests/backend-integration/backend-integration.csproj --no-restore` (existing NU1903 warning for SSH.NET 2024.2.0)
- BLOCKED -- Testcontainers-backed integration execution skipped because Docker daemon is not reachable (`docker info` cannot connect to `/Users/wallstreet62/.docker/run/docker.sock`).
