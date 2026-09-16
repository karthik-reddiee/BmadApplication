---
title: 'Story 2.3: Delete an Expense with Confirmation'
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

**Problem:** Expense Detail exposes a Delete affordance, but deletion is not implemented. Users need to remove an incorrect expense only after an explicit confirmation step.

**Approach:** Add an Expense delete endpoint/service method, make the Detail Delete action open an accessible confirmation dialog, delete through the API on confirmation, refresh relevant server state, and return the user to Review with `Expense deleted.` feedback.

## Boundaries & Constraints

**Always:** Delete is only available from Expense Detail, never inline on Home/Review rows. Confirmation dialog has clear title/explanation, Cancel, and visually destructive Delete action. Cancel closes the dialog and leaves the expense visible. Confirm deletes the Expense through the API, invalidates list/detail/summary state, navigates back to Review, and shows `Expense deleted.`. Failure keeps the user in context and shows concise actionable feedback near the dialog/action.

**Never:** Do not add undo, trash, archive, soft-delete recovery, bulk delete, row-level delete controls, auth/user ownership, audit history, or category deletion behavior. Do not alter the no-Docker local setup.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Open confirmation | User activates Delete on Detail | Accessible confirmation dialog opens with Cancel and destructive Delete | N/A |
| Cancel delete | User cancels dialog | Dialog closes; expense remains visible and unchanged | N/A |
| Confirm delete | User confirms | API deletes expense; Review shows `Expense deleted.`; deleted row no longer appears after refresh | N/A |
| Delete failure | API/network delete fails | User stays on Detail/dialog context with actionable failure feedback | Preserve expense detail |
| Missing expense | API returns not-found on delete | Treat as failure/not-found feedback without crashing | Preserve navigation context |

</frozen-after-approval>

## Code Map

- `_bmad-output/implementation-artifacts/epic-2-context.md` -- delete confirmation, feedback, accessibility, and no-undo constraints.
- `_bmad-output/implementation-artifacts/spec-2-2-view-and-edit-expense-details.md` -- completed Detail route/action surface and update-query continuity.
- `backend/Features/Expenses/ExpenseService.cs`, `ExpenseEndpoints.cs` -- add delete service/endpoint with not-found handling.
- `frontend/src/shared/api/expenses.ts` -- add delete API function and reuse query keys/errors.
- `frontend/src/features/expenses/ExpenseDetailPage.tsx` -- replace disabled Delete affordance with dialog state, confirm/cancel behavior, mutation, and failure feedback.
- `frontend/src/app/ReviewPage.tsx` -- display route-state success feedback after delete while preserving empty/list behavior.
- `frontend/src/app/styles.css` -- add minimal dialog/destructive action styling and focus affordances.
- `frontend/src/app/App.test.tsx`, `frontend/src/shared/api/expenses.test.ts`, `tests/backend-integration/**` -- cover confirm, cancel, success refresh/navigation, failure, API shape, backend deletion/not-found.

## Tasks & Acceptance

**Execution:**
- [x] `backend/Features/Expenses/**` -- add `DELETE /api/expenses/{id}` and service method returning no-content or not-found without deleting unrelated rows -- completes REST delete contract.
- [x] `frontend/src/shared/api/expenses.ts` and mutation hook as needed -- add delete function, typed failure behavior, and query invalidations for lists/detail/summary -- keeps server state fresh.
- [x] `frontend/src/features/expenses/ExpenseDetailPage.tsx` -- implement accessible confirmation dialog, cancel, confirm, pending/failure states, and delete success navigation -- completes user workflow.
- [x] `frontend/src/app/ReviewPage.tsx` -- show `Expense deleted.` from route state after successful delete -- provides compact feedback in the destination context.
- [x] `frontend/src/app/styles.css` -- add minimal modal/destructive styling consistent with current UI -- keeps UX clear without redesign.
- [x] Tests -- add frontend/API/backend coverage for confirm, cancel, success feedback/list refresh, failure, deletion, and not-found -- verifies the matrix.

**Acceptance Criteria:**
- Given the user chooses Delete on Expense Detail, when the dialog opens, then confirmation is required before any API delete occurs.
- Given the user cancels, when the dialog closes, then the expense remains visible.
- Given the user confirms deletion and the API succeeds, when Review renders, then `Expense deleted.` appears and the deleted expense is absent from refreshed lists.
- Given delete fails, when feedback is shown, then the user remains in context and can retry or cancel.

## Implementation Notes

- Added `DELETE /api/expenses/{id}` with service-level not-found handling and a concurrency guard that returns not-found if the row disappears before save.
- Added typed frontend delete API/mutation behavior, removing the deleted detail cache, filtering cached expense lists, and invalidating list/summary data after success.
- Replaced the Detail delete affordance with a confirmation dialog that supports cancel, pending/failure states, Escape close, focus restore, and success navigation back to Review.
- Added Review route-state feedback for `Expense deleted.` after successful deletion.

## Spec Change Log

- Completed implementation and verification for Story 2.3.

## Review Triage Log

- Patched: deleted expense detail/list cache was not directly protected by frontend tests; added success-path cache assertions and list filtering.
- Patched: confirmation dialog needed stronger keyboard behavior; added initial focus, Escape close, focus trapping between dialog controls, and focus restore on close.
- Patched: backend delete now catches `DbUpdateConcurrencyException` and returns not-found semantics rather than surfacing a server error for a concurrently removed row.
- Dismissed as disproven: Review page and expense list files/routes were reported missing by one reviewer, but they are present and exercised by passing frontend tests.
- Deferred as not blocking Story 2.3: dependency advisory and Docker/Testcontainers availability are existing environment/dependency verification concerns, not delete implementation defects.

## Verification

**Commands:**
- `npm --prefix frontend test` -- expected: frontend delete/API tests pass.
- `npm --prefix frontend run build` -- expected: TypeScript/Vite build succeeds.
- `dotnet build backend/backend.csproj --no-restore` -- expected: backend compiles.
- `dotnet build tests/backend-integration/backend-integration.csproj --no-restore` -- expected: backend integration test project compiles.
- `dotnet test tests/backend-integration/backend-integration.csproj --no-build` -- expected: run only when Docker is available; otherwise record Docker/Testcontainers unavailability as an environment blocker.

**Results:**
- `npm --prefix frontend test` -- passed, 55 tests.
- `npm --prefix frontend run build` -- passed.
- `dotnet build backend/backend.csproj --no-restore` -- passed.
- `dotnet build tests/backend-integration/backend-integration.csproj --no-restore` -- passed with existing `SSH.NET` NU1903 advisory warning.
- `dotnet test tests/backend-integration/backend-integration.csproj --no-build` -- blocked by Docker/Testcontainers unavailable after rerun with sandbox escalation; failed to connect to Docker endpoints at `/var/run/docker.sock` and `/Users/wallstreet62/.docker/run/docker.sock`.
