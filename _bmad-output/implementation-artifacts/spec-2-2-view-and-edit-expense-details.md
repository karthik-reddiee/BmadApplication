---
title: 'Story 2.2: View and Edit Expense Details'
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

**Problem:** Expense rows now navigate to a placeholder detail route, but users cannot inspect a saved expense or correct mistakes. The MVP needs a read-only Expense Detail surface and an edit flow for amount, Category, date, and optional description.

**Approach:** Add Expense detail/update REST endpoints with explicit DTOs, render a real detail route, add an edit route/form that reuses the Add Expense validation/category-chip pattern, and refresh list/detail server state after updates.

## Boundaries & Constraints

**Always:** Detail shows amount, Category, date, and description when present, read-only by default. Edit and Delete actions are visible on the detail surface, but only Edit is functional in this story; Delete may remain a Story 2.3 placeholder/action affordance. Edit pre-populates amount, selected Category chip, date, and optional description. Save uses an explicit update DTO, returns to Detail, shows `Expense updated.`, and invalidates expense list/detail/summary state. Cancel or Back discards unsaved changes and returns to Detail. Create/update validation rules and ProblemDetails handling match Add Expense.

**Never:** Do not implement delete confirmation/delete API, inline row edit/delete controls, audit history, undo, soft delete, merchant/payment/tags/currency fields, search/filter/grouping, auth, new state libraries, CQRS/MediatR, Docker changes, or startup auto-migrations.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Detail render | Existing expense id | Read-only detail shows INR amount, Category name, date, optional description, Edit and Delete actions | Missing id returns not-found UI without crashing |
| Edit open | User activates Edit | Form is pre-populated with existing values and category chips | Category load failure shows concise feedback |
| Valid update | User changes amount/category/date/description and saves | API updates row; user returns to detail; `Expense updated.` appears; lists/detail refresh | Preserve form during operation failure |
| Invalid edit | Missing/invalid amount/category/date or overlong description | Frontend blocks save with inline feedback; backend repeats validation with ValidationProblemDetails | Preserve entered values |
| Cancel/back | User changes fields then cancels or goes back | Unsaved changes are discarded and original detail remains unchanged | N/A |

</frozen-after-approval>

## Code Map

- `_bmad-output/implementation-artifacts/epic-2-context.md` -- Epic 2 detail/edit constraints and validation/refresh expectations.
- `_bmad-output/implementation-artifacts/spec-2-1-review-recorded-expenses.md` -- completed row navigation, list DTO/API/query keys, and Review route continuity.
- `backend/Domain/Expense.cs` -- add update behavior preserving CreatedAt and refreshing UpdatedAt.
- `backend/Features/Expenses/ExpenseService.cs`, `ExpenseEndpoints.cs`, DTO files -- add get-by-id and update service methods/endpoints using explicit DTOs and existing validation guardrails.
- `frontend/src/shared/api/expenses.ts` -- add detail DTO/API functions, update request, query keys, and typed error reuse.
- `frontend/src/features/expenses/AddExpensePanel.tsx` -- reuse validation concepts/copy; extract only if it keeps the patch smaller and clearer.
- `frontend/src/app/App.tsx` -- replace detail placeholder route with real detail and edit routes.
- `frontend/src/features/expenses/**` or `frontend/src/app/**` -- add detail/edit components using existing Surface, Button, ExpenseList formatting style, and category chips.
- `frontend/src/app/App.test.tsx`, `frontend/src/shared/api/expenses.test.ts`, `tests/backend-integration/**` -- cover detail render, edit prefill/save/cancel/validation, API contracts, valid/invalid update.

## Tasks & Acceptance

**Execution:**
- [x] `backend/Domain/Expense.cs` -- add update method for editable fields with validation-compatible invariants and UpdatedAt refresh -- keeps domain state coherent.
- [x] `backend/Features/Expenses/**` -- add `GET /api/expenses/{id}` and `PUT /api/expenses/{id}` with explicit detail/update DTOs, category-name resolution, not-found handling, and validation problem responses -- supports detail/edit without leaking entities.
- [x] `frontend/src/shared/api/expenses.ts` -- add detail/update DTOs, API functions, and query keys while preserving create/list behavior -- keeps typed boundary and invalidation consistent.
- [x] `frontend/src/app/App.tsx` plus detail/edit components -- render read-only detail, Edit/Delete actions, pre-populated edit form, cancel/back behavior, update success feedback, and not-found/failure states -- completes the user workflow.
- [x] `frontend/src/app/styles.css` -- add modest detail/edit styles and focus affordances without redesign -- keeps UX consistent.
- [x] `frontend/src/app/App.test.tsx`, `frontend/src/shared/api/expenses.test.ts`, `tests/backend-integration/**` -- add focused tests for detail retrieval/rendering, prefilled edit, valid/invalid update, cancel, state refresh, and DTO/API shape -- verifies the matrix.

**Acceptance Criteria:**
- Given a user opens an existing expense row, when Detail renders, then it is read-only and shows amount, Category, date, and optional description plus Edit/Delete actions.
- Given the user edits valid values, when Save succeeds, then the API updates the expense, the user returns to Detail, and `Expense updated.` appears with fresh data.
- Given validation fails on edit, when frontend or backend validation runs, then inline feedback appears and entered values are preserved.
- Given the user cancels edit, when they return to Detail, then unsaved changes are discarded.

## Implementation Notes

- Added explicit expense detail/update backend contracts: `GET /api/expenses/{id}` returns a detail DTO with Category name, and `PUT /api/expenses/{id}` validates through shared service rules, rejects missing categories, updates editable fields, preserves `CreatedAt`, and refreshes `UpdatedAt`.
- Added real Detail and Edit routes. Detail is read-only and shows amount, Category, date, optional description, Edit, and disabled Delete affordance for Story 2.3. Edit pre-populates the existing values, reuses the Add Expense validation/category-chip pattern, preserves form data on failures, and returns to Detail with `Expense updated.` after save.
- Added typed frontend API functions/query keys for detail/update plus update invalidation for list/detail/summary state.
- Review patch seeds the updated detail into TanStack Query cache, avoids refetch-on-mount from replacing freshly updated detail, keeps unsaved edit values from being overwritten by background detail-cache changes, disables edit save when categories fail to load, and handles an unexpected missing detail after backend update without null-forgiving throw.

## Spec Change Log

## Review Triage Log

- medium / patch: Updated detail could display stale cached values beside `Expense updated.`. Seeded `expenseKeys.detail(id)` with the update response, narrowed invalidation to list/summary state, disabled detail refetch-on-mount when cached data exists, and added a test asserting updated amount/category/date/description render after save.
- medium / patch: Edit form rehydrated from every detail query data change, risking unsaved input loss during background cache updates. Added one-shot hydration per expense id and a cache-update test proving unsaved amount remains intact.
- medium / patch: Edit save remained available when category chips failed to load, allowing save with an invisible selected category. Updated copy and disabled Save while category loading has failed; added frontend coverage.
- low / patch: Backend update refetched joined detail with a null-forgiving operator. Returned not-found if the post-update detail lookup unexpectedly fails.
- false: Current Month summary remaining placeholder is Epic 4 scope; Story 2.2 invalidates summary state for future summary implementation but does not calculate summaries.
- false: Bare not-found bodies, README updates, fixture renaming, and disabled Delete explanation are not blockers for Story 2.2; Delete behavior is explicitly reserved for Story 2.3.

## Verification

**Commands:**
- `npm --prefix frontend test` -- passed: 2 files, 46 tests.
- `npm --prefix frontend run build` -- passed: TypeScript/Vite build succeeded.
- `dotnet build backend/backend.csproj --no-restore` -- passed: backend compiled with 0 warnings/errors.
- `dotnet build tests/backend-integration/backend-integration.csproj --no-restore` -- passed: integration test project compiled; warning NU1903 for transitive `SSH.NET` vulnerability remains.
- `docker info --format '{{.ServerVersion}}'` -- blocked: Docker daemon unavailable at `/Users/wallstreet62/.docker/run/docker.sock`, so Testcontainers execution was not run.
