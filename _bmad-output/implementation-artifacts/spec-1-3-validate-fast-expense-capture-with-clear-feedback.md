---
title: 'Story 1.3: Validate Fast Expense Capture with Clear Feedback'
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

**Problem:** Story 1.2 can create an Expense, but the Add Expense form still relies on silent returns, disabled-submit gating, browser behavior, and generic API failures for many invalid states. The user needs clear validation and failure feedback while staying in the fast capture context.

**Approach:** Add explicit frontend validation for amount, category, and date before mutation; preserve entered values on validation and operation failures; parse backend ProblemDetails/ValidationProblemDetails so authoritative validation can surface near the form; and tighten backend tests around the existing validation contract.

## Boundaries & Constraints

**Always:** Missing amount copy must be exactly `Enter an amount to save this expense.` Amount validation must prevent empty, zero, negative, non-numeric, over-precision, and out-of-range values before submit. Category and date validation must produce inline, understandable feedback. Backend validation remains authoritative and returns ASP.NET Core ProblemDetails/ValidationProblemDetails with appropriate status codes. Operation failures keep the user on Home, preserve entered form data, clear stale success copy, and show concise actionable feedback near the action/form area.

**Never:** Do not add merchant, payment method, tags, currency storage, exchange rates, auth/user concepts, Review list/detail behavior, summaries, category management, Redux/Zustand, CQRS, MediatR, Docker changes, or startup auto-migrations. Do not redesign the Add Expense layout or move it to another route.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Missing amount | User submits with no amount | Mutation is not called; inline amount feedback says `Enter an amount to save this expense.` | Preserve category/date/description values |
| Invalid amount | Amount is zero, negative, non-numeric, >2 decimals, or beyond backend max | Mutation is not called; amount feedback explains the issue plainly | Preserve all entered values |
| Missing category | User submits without selected chip | Mutation is not called; category feedback explains that a Category is required | Preserve amount/date/description |
| Invalid date | Date is blank or not a valid `YYYY-MM-DD` calendar date | Mutation is not called; date feedback explains that a valid date is required | Preserve amount/category/description |
| Backend validation | API returns ValidationProblemDetails | Form stays in context and shows relevant field/form feedback from the response | Preserve entered values and clear stale success copy |
| Operation failure | Network/server failure after valid input | Form stays in context with generic actionable failure near Save | Preserve entered values and clear stale success copy |

</frozen-after-approval>

## Code Map

- `_bmad-output/implementation-artifacts/epic-1-context.md` -- Epic 1 validation, feedback, accessibility, and no-scope-expansion constraints.
- `_bmad-output/implementation-artifacts/spec-1-2-create-an-expense-end-to-end.md` -- continuity for the completed create path; preserve success/reset behavior and Story 1.2 backend guardrails.
- `_bmad-output/planning-artifacts/epics.md` -- Story 1.3 acceptance criteria and MVP exclusions.
- `frontend/src/features/expenses/AddExpensePanel.tsx` -- add explicit validation state, inline messages, server-error display, enabled submit attempt path, and failure-preserving behavior.
- `frontend/src/shared/api/expenses.ts` -- parse failed responses, preserving ValidationProblemDetails field errors for UI handling while keeping DTO contracts explicit.
- `frontend/src/features/expenses/useCreateExpense.ts` -- keep the existing TanStack Query mutation/invalidation; no global store.
- `frontend/src/app/styles.css` -- reuse existing inline success/error styling; add only small accessibility/error affordance selectors if needed.
- `frontend/src/app/App.test.tsx` -- add focused interaction tests for frontend validation and preserved state after failed create.
- `frontend/src/shared/api/expenses.test.ts` -- add API-client test for ValidationProblemDetails parsing.
- `tests/backend-integration/CategoryApiTests.cs` -- strengthen invalid create tests to assert ValidationProblemDetails shape/status without changing Testcontainers setup.

## Tasks & Acceptance

**Execution:**
- [x] `frontend/src/shared/api/expenses.ts` -- add a typed API error/validation-error parser for non-OK expense creates -- lets the form show backend validation without custom backend envelopes.
- [x] `frontend/src/features/expenses/AddExpensePanel.tsx` -- add field validation, inline feedback, server validation mapping, and failure-preserving behavior -- satisfies Story 1.3 UX while keeping the fast form in place.
- [x] `frontend/src/app/styles.css` -- add minimal invalid-control/error-summary affordances if required -- keeps feedback visible and accessible without redesign.
- [x] `frontend/src/app/App.test.tsx` -- cover missing/invalid amount, missing category, invalid date, failed mutation preservation, and success path preservation -- verifies the user-facing validation contract.
- [x] `frontend/src/shared/api/expenses.test.ts` -- verify ValidationProblemDetails parsing and generic failure fallback -- protects the frontend/backend boundary.
- [x] `tests/backend-integration/CategoryApiTests.cs` -- assert invalid create responses expose `errors` and HTTP 400 while saving no rows -- verifies authoritative backend validation contract.

**Acceptance Criteria:**
- Given the user attempts to save with invalid amount, category, or date input, when frontend validation runs, then saving is prevented and inline feedback identifies the field to fix.
- Given frontend validation feedback appears, when the user corrects the related input, then the stale field error clears without clearing unrelated entered values.
- Given backend validation or operation failure occurs, when the error returns to the form, then entered data is preserved and concise feedback appears near the relevant field or form action.
- Given create succeeds, when the Story 1.2 happy path is used, then `Expense saved.` and reset-for-next-entry behavior continue to work.

## Implementation Notes

- Added explicit Add Expense validation for missing, non-numeric, zero/negative, over-precision, and out-of-range amount input; missing category; and invalid/blank date.
- Changed amount entry to `type="text"` with decimal input mode so non-numeric input can be preserved and explained instead of silently discarded by browser number-input behavior.
- Added typed `ExpenseApiError` parsing for ASP.NET Core ProblemDetails/ValidationProblemDetails and mapped backend field errors back into the inline form feedback.
- Preserved Story 1.2 success behavior: successful create still shows `Expense saved.` and resets the form for another entry.
- Review patch added frontend description length validation/server-error mapping, clearer negative amount feedback, live regions for success/failure messages, and form-boundary tests for backend CategoryId, ExpenseDate, and Description validation errors.

## Spec Change Log

## Review Triage Log

- low / patch: Self-review found stale success clearing on a later failed save was implemented but under-tested. Added `clears stale success feedback when a later save fails` in `frontend/src/app/App.test.tsx`, which verifies the previous `Expense saved.` message is removed while retry values remain.
- low / patch: Backend `CategoryId` and `ExpenseDate` validation errors were parsed but not verified at the Add Expense form boundary. Added frontend tests that mock `ExpenseApiError` for those fields and assert inline messages plus preserved values.
- medium / patch: Backend `Description` validation could return without inline field feedback. Added `description` to the form error map, frontend description length validation, and tests for both pre-submit and backend-mapped description errors.
- low / patch: Negative amount feedback said "numbers only" because the validation regex rejected the sign before the positive-value check. Updated validation so `-1` shows the positive-amount guidance.
- low / patch: Dynamic success/failure messages lacked live-region semantics. Added `role="status"` for success and `role="alert"` for form failures.
- false: Additional tests for category/date stale-error clearing are useful but not required because current tests cover amount clearing plus backend-mapped category/date rendering and direct category/date frontend validation; no broken behavior was demonstrated.
- false: Malformed JSON/model-binding API tests are outside Story 1.3's fast-capture form contract; existing backend tests cover business-rule invalid requests and ProblemDetails shape for the DTO path used by the app.
- false: Moving max amount/description rules into the domain or adding database check constraints would expand the already-approved architecture/persistence scope; the authoritative service validation and PostgreSQL type constraints remain intact for MVP.
- false: README updates are documentation polish and not a concrete blocker for Story 1.3 implementation.

## Verification

**Commands:**
- `npm --prefix frontend test` -- passed: 2 files, 23 tests.
- `npm --prefix frontend run build` -- passed: TypeScript/Vite build succeeded.
- `dotnet build backend/backend.csproj --no-restore` -- passed: backend compiled with 0 warnings/errors.
- `dotnet build tests/backend-integration/backend-integration.csproj --no-restore` -- passed with existing NU1903 warning for `SSH.NET` 2024.2.0.
- `docker info --format '{{.ServerVersion}}'` -- blocked: Docker daemon unavailable at `/Users/wallstreet62/.docker/run/docker.sock`; Testcontainers suite not run per no-Docker local rule.
