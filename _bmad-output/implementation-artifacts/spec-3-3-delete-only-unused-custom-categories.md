---
title: 'Story 3.3: Delete Only Unused Custom Categories'
type: 'feature'
created: '2026-09-16'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '7acbffa7e5e6b98e5b49c3d56f88cbac0f0b13b7'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
---

<frozen-after-approval reason="auto-approved from finalized artifacts">

## Intent

**Problem:** Custom Categories can be created and renamed, but unsafe deletion could orphan or silently reassign Expenses.

**Approach:** Add custom-only category deletion guarded by usage checks and FK integrity, expose deletion confirmation only for eligible custom categories, block in-use/default deletion with finalized feedback, and refresh category/expense/summary state after success.

## Boundaries & Constraints

**Always:** Delete only unused Custom Categories. Default Categories cannot be deleted and remain visible/available. In-use Custom Category deletion is blocked before confirmation with exact copy `This category is used by existing expenses. Reassign those expenses before deleting it.` Successful deletion shows `Category deleted.` and removes the category from Add/Edit chips.

**Never:** Do not reassign expenses, orphan records, soft-delete, undo, trash/archive, bulk delete, category colors/icons/budgets, auth/user ownership, Docker, Redux/Zustand, CQRS/MediatR, or MVP scope expansion.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Delete unused custom | Custom category has no Expenses | Confirmation opens; confirm deletes; feedback says `Category deleted.` | Refresh chips/lists |
| Cancel delete | Confirmation open | Dialog closes; category remains | N/A |
| In-use custom | Category has Expenses | Block before confirmation with exact explanatory copy | No delete API call |
| Default category | Default row visible/API attempted | No UI delete control; backend blocks direct delete | Defaults remain |
| Concurrent usage | Category becomes used before delete save | Backend blocks delete and preserves row | Validation/problem feedback |

</frozen-after-approval>

## Code Map

- `_bmad-output/implementation-artifacts/epic-3-context.md` -- safe delete requirements.
- `backend/Features/Categories/**` -- add `DELETE /api/categories/{id}` custom-only usage-guarded behavior.
- `backend/Data/AppDbContext.cs` -- existing FK restrict behavior remains integrity backstop.
- `frontend/src/shared/api/categories.ts` -- add typed delete category API.
- `frontend/src/features/categories/CategoriesPage.tsx` -- add delete/block/confirmation behavior for custom categories only.
- `frontend/src/features/categories/useDeleteCategory.ts` -- mutation refreshes categories, expenses, summary.
- `frontend/src/app/App.test.tsx`, `tests/backend-integration/CategoryApiTests.cs` -- cover confirmation/cancel/success/block/default/FK behavior and chip removal.

## Tasks & Acceptance

**Execution:**
- [x] Backend -- add custom-only category delete endpoint/service with unused check, default protection, FK-safe failure mapping.
- [x] Frontend API/query -- add typed delete category API and mutation cache refresh.
- [x] Categories UI -- show delete controls only for custom categories, block in-use categories before confirmation, confirm unused deletes.
- [x] Tests -- cover unused delete, cancel, blocked in-use feedback, default protection, FK integrity, and chip removal.

**Acceptance Criteria:**
- Given an unused Custom Category, when delete is confirmed, then it is deleted, `Category deleted.` appears, and it disappears from Add/Edit chips.
- Given delete is canceled, then the Custom Category remains unchanged.
- Given a Custom Category is used by Expenses, then deletion is blocked before confirmation with exact finalized copy.
- Given a Default Category exists, then it cannot be deleted and remains available.

## Implementation Notes

- Added `DELETE /api/categories/{id}` with custom-only delete behavior, default protection, usage checks, and FK-safe conflict mapping.
- Added typed frontend delete API/mutation and cache refresh for category lists, expense lists, and current-month summary.
- Added Custom Category delete actions with cancel/confirm dialog for unused categories and pre-confirmation blocking for categories present in the current Expense list.
- Kept Default Categories view-only/protected and did not add undo, soft-delete, reassignment, bulk delete, or category scope expansion.

## Spec Change Log

- Completed implementation and verification for Story 3.3.

## Review Triage Log

- Review agents for Story 3.3 did not return findings within two timed waits and were closed as non-responsive.
- Local blocker scan and verification confirmed custom-only delete, in-use/default protection, cache refresh, and MVP scope boundaries.

## Verification

**Commands:**
- `npm --prefix frontend test`
- `npm --prefix frontend run build`
- `dotnet build backend/backend.csproj --no-restore`
- `dotnet build tests/backend-integration/backend-integration.csproj --no-restore`
- `dotnet test tests/backend-integration/backend-integration.csproj --no-build` -- only when Docker is available.

**Results:**
- `npm --prefix frontend test` -- passed, 76 tests.
- `npm --prefix frontend run build` -- passed.
- `dotnet build backend/backend.csproj --no-restore` -- passed.
- `dotnet build tests/backend-integration/backend-integration.csproj --no-restore` -- passed with existing `SSH.NET` NU1903 advisory warning.
- `dotnet test tests/backend-integration/backend-integration.csproj --no-build` -- blocked by Docker/Testcontainers unavailable in this environment; Docker connection previously failed at `/var/run/docker.sock` and `/Users/wallstreet62/.docker/run/docker.sock`.
