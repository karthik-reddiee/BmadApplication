---
title: 'Story 4.3: Keep Spending Awareness Fresh After Expense Changes'
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

**Problem:** Current-month Home data must stay fresh after expense create, edit, and delete operations, now that Home depends on the summary endpoint.

**Approach:** Use the shared TanStack Query summary key in expense mutations and add focused tests proving successful mutations invalidate/refetch current-month summary state without adding new global state or analytics scope.

## Boundaries & Constraints

**Always:** Successful create/update/delete invalidates affected expense server state and current-month summary state. Home summary/recent rows refresh after relevant changes. Keep TanStack Query as the server-state owner.

**Never:** Do not add Redux/Zustand, client-side financial aggregation, summary cache tables, background refresh infrastructure, month comparisons, trends, percentages, advanced analytics, Docker changes, or architecture changes.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Current-month create | New expense dated in current month | Home total, breakdown, and recent rows refresh to include it | Existing create error handling remains |
| Out-of-month create | New expense dated outside current month | Summary refetches; backend result may remain unchanged | Existing create error handling remains |
| Expense edit | Amount/category/date/description changes | Detail/list cache updates and current-month summary invalidates | Existing edit error handling remains |
| Expense delete | Existing current-month expense deleted | Detail removed, lists refresh, current-month summary invalidates | Existing delete error handling remains |

</frozen-after-approval>

## Code Map

- `frontend/src/features/expenses/useCreateExpense.ts` -- create mutation invalidates summary key.
- `frontend/src/features/expenses/useUpdateExpense.ts` -- update mutation invalidates summary key and keeps detail/list cache fresh.
- `frontend/src/features/expenses/useDeleteExpense.ts` -- delete mutation removes detail, refreshes lists, and invalidates summary key.
- `frontend/src/shared/api/summaries.ts` -- shared summary query key.
- `frontend/src/app/App.test.tsx` -- user-visible create refresh and mutation freshness tests.

## Tasks & Acceptance

**Execution:**
- [x] Frontend -- use the shared summary query key from `summaries.ts` in create/update/delete expense mutations.
- [x] Tests -- cover Home summary/recent refresh after successful create.
- [x] Tests -- cover current-month summary invalidation after successful update and delete.
- [x] Scope -- verify no new global store, analytics feature, or frontend aggregation is introduced.

**Acceptance Criteria:**
- Given the user adds a current-month Expense and the summary endpoint returns updated data, then Home total, breakdown, and Recent Expenses update.
- Given expense create/update/delete succeeds, then TanStack Query invalidates current-month summary state.
- Given the implementation is inspected, then TanStack Query remains the only server-state mechanism and MVP analytics scope is not expanded.

## Implementation Notes

- Updated expense create/update/delete hooks to use the shared `summaryKeys.currentMonth()` key for current-month summary invalidation.
- Added visible Home refresh coverage after successful create: the summary endpoint refetches and the current-month recent row appears.
- Added edit/delete assertions that successful mutations invalidate the current-month summary query while preserving existing detail/list cache behavior.
- Replaced `toSorted` in the summary component with copy-plus-`sort` to match the project TypeScript target without changing compiler settings.

## Spec Change Log

- Completed as scoped; no product or architecture expansion.

## Review Triage Log

- Scope scan found no Redux, Zustand, new global store, analytics expansion, frontend aggregation, summary cache table, materialized view, or trend/month-comparison implementation.

## Verification

**Commands:**
- `npm --prefix frontend test`
- `npm --prefix frontend run build`
- `dotnet build backend/backend.csproj --no-restore`
- `dotnet build tests/backend-integration/backend-integration.csproj --no-restore`
- `dotnet test tests/backend-integration/backend-integration.csproj --no-build` -- only when Docker is available.

**Results:**
- PASS -- `npm --prefix frontend test` (79 tests)
- PASS -- `npm --prefix frontend run build`
- PASS -- `dotnet build backend/backend.csproj --no-restore`
- PASS -- `dotnet build tests/backend-integration/backend-integration.csproj --no-restore` (existing NU1903 warning for SSH.NET 2024.2.0)
- BLOCKED -- Testcontainers-backed integration execution skipped because Docker daemon is not reachable (`docker info` cannot connect to `/Users/wallstreet62/.docker/run/docker.sock`).
