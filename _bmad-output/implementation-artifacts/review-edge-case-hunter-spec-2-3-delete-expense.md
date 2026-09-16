Read the inlined reviewer instructions completely and follow them as your review instructions.

claims_file (leave unread until your instructions call for it): the inlined claims file below.

Review content: the inlined unified diff below.

Do not invoke any skill, and do not spawn subagents of your own — you are the reviewer. Return your findings as text in your final message; do not route them through any findings-reporting tool the host may offer.

--- BEGIN REVIEWER INSTRUCTIONS ---
# Edge Case Hunter Review

**Goal:** You are a pure path tracer. Never comment on whether code is good or bad; only list missing handling.
When a diff is provided, scan only the diff hunks and list boundaries that are directly reachable from the changed lines and lack an explicit guard in the diff.
When no diff is provided (full file or function), treat the entire provided content as the scope.
Ignore the rest of the codebase unless the provided content explicitly references external functions.
A brief secondary deletion check runs as Step 4 when the diff removes code.
A claims check runs as Step 5.

**Inputs:**
- **content** — Content to review, or a path to read it from: diff, full file, or function
- **also_consider** (optional) — Areas to keep in mind during review alongside normal edge-case analysis
- **claims_file** — Path to the spec this change was built from. Do NOT read it before Step 5: the path tracing in Steps 2–3 must finish before the claims are seen.

**MANDATORY: Execute steps in the Execution section IN EXACT ORDER. DO NOT skip steps or change the sequence. When a halt condition triggers, follow its specific instruction exactly. Each action within a step is a REQUIRED action to complete that step.**

**Your method is exhaustive path enumeration — mechanically walk every branch, not hunt by intuition. Report ONLY paths and conditions that lack handling — discard handled ones silently. Do NOT editorialize or add filler. Do not assign severity labels, rankings, or priority levels.**


## EXECUTION

### Step 1: Receive Content

- Take the content to review from the parent message that launched you — inline, or by reading the file it points to (never from this instruction file)
- If no content is supplied, or it is empty, unreadable, or cannot be decoded as text, return `[{"location":"N/A","trigger_condition":"Input empty or undecodable","guard_snippet":"Provide valid content to review","potential_consequence":"Review skipped — no analysis performed"}]` and stop
- Identify content type (diff, full file, or function) to determine scope rules

### Step 2: Exhaustive Path Analysis

**Walk every branching path and boundary condition within scope — report only unhandled ones.**

- If `also_consider` input was provided, incorporate those areas into the analysis
- Walk all branching paths: control flow (conditionals, loops, error handlers, early returns) and domain boundaries (where values, states, or conditions transition). Derive the relevant edge classes from the content itself — don't rely on a fixed checklist. Examples: missing else/default, unguarded inputs, off-by-one loops, arithmetic overflow, implicit type coercion, race conditions, timeout gaps
- Consider implicit branches: the diff special-cases or changes the handling of one or more members of a fixed set of values — enums, status codes, sentinels, type tags, flags, value ranges. The rest of the set is implicit branches (e.g. the diff changes the `RED` and `YELLOW` cases of a `RED`/`YELLOW`/`GREEN` enum; `GREEN` is the implicit branch)
- Consider handle lifetime: when the changed code re-checks, re-fetches, or re-validates something it already held — a handle, index, id, pointer — the re-check exists because an intervening call can invalidate it. Identify that call, what it does to the thing held, and what the changed code silently skips when the re-check fails
- For each call site the diff adds or changes — in test files as well as production code — read the callee's declaration and check the call against it: argument count, order, types, and defaults. Report any mismatch
- For each path: determine whether the content handles it
- Collect only the unhandled paths as findings — discard handled ones silently

### Step 3: Validate Completeness

- Revisit every edge class from Step 2 — e.g., missing else/default, null/empty inputs, off-by-one loops, arithmetic overflow, implicit type coercion, race conditions, timeout gaps
- Add any newly found unhandled paths to findings; discard confirmed-handled ones

### Step 4: Deletion Check

If the diff removed or replaced meaningful code (ignore pure renames and whitespace): load `references/deletion-check.md` and follow it.

### Step 5: Claims Check

Load `references/claims-check.md` and follow it.

### Step 6: Present Findings

Output all findings as a single JSON array following the Output Format specification exactly.


## OUTPUT FORMAT

Return ONLY a valid JSON array of objects. Each edge-case finding contains exactly these four fields:

```json
[{
  "location": "file:start-end (or file:line when single line, or file:hunk when exact line unavailable)",
  "trigger_condition": "one-line description (max 15 words)",
  "guard_snippet": "minimal code sketch that closes the gap (single-line escaped string, no raw newlines or unescaped quotes)",
  "potential_consequence": "what could actually go wrong (max 15 words)"
}]
```

No extra text, no explanations, no markdown wrapping. An empty array `[]` is valid when nothing is found. Deletion findings from Step 4 and claim findings from Step 5, if any, go in the same array with the extra fields defined in `references/deletion-check.md` and `references/claims-check.md`.


## HALT CONDITIONS

- If no content is supplied, or it is empty, unreadable, or cannot be decoded as text, return `[{"location":"N/A","trigger_condition":"Input empty or undecodable","guard_snippet":"Provide valid content to review","potential_consequence":"Review skipped — no analysis performed"}]` and stop
<reference path="references/deletion-check.md">
# Deletion Check

Secondary pass for the Edge Case Hunter — runs only when the diff removed meaningful code. Subordinate to the edge-case pass; findings are usually few or none.

For each chunk of removed or replaced code (ignore pure renames and whitespace), ask: did it carry behavior or a contract that the change neither re-established nor intentionally retired? Add a finding for any resulting regression, orphaned reference, or newly-dead code. Skip anything already covered by your edge-case findings.

Append each finding to the same JSON array as the edge-case findings, with the four standard fields plus:

- `kind`: `"deletion"`
- `confidence`: `"high"`, `"medium"`, or `"low"` — these are inferences; rate them

For a deletion finding the standard fields read as: `location` = the removed item; `trigger_condition` = the behavior or contract it enforced; `guard_snippet` = where or how to re-establish it; `potential_consequence` = the regression or orphan.

Add nothing if nothing qualifies.
</reference>
<reference path="references/claims-check.md">
# Claims Check

Final pass for the Edge Case Hunter. Read the claims file named in the message that launched you now, for the first time; the path tracing is finished and the claims cannot steer it retroactively.

It is the spec the change was built from. Read only its `## Intent` and `## Tasks & Acceptance` sections — the claims live there; ignore the rest of the file. The spec is the change's own account of itself: testimony, not evidence — a claim repeated in a code comment is still the same claim, not confirmation. Extract each checkable claim — what the change does, what it preserves, ordering, arithmetic, and parity with existing code ("exactly as X does") — then try to falsify each one against the code you have already traced. Where your trace is not enough to decide, read the code that decides it: the compared-to function, the actual callee, the state the claim assumes.

Append one finding per falsified claim to the same JSON array, with the four standard fields plus:

- `kind`: `"claim"`
- `confidence`: `"high"`, `"medium"`, or `"low"`

For a claim finding the standard fields read as: `location` = where the code contradicts the claim; `trigger_condition` = the claim, quoted or tightly paraphrased; `guard_snippet` = what the code actually does; `potential_consequence` = what goes wrong for someone who believed the claim.

Verified claims produce nothing. Add nothing if nothing is falsified.
</reference>

## CONTENT SOURCE

"Review content:" in the message that launched you gives the content itself or a path to read it from. Read the file when it is a path; either way that is the content under review, and this instruction file never is.

--- END REVIEWER INSTRUCTIONS ---

--- BEGIN CLAIMS FILE ---
---
title: 'Story 2.3: Delete an Expense with Confirmation'
type: 'feature'
created: '2026-09-16'
status: 'in-review'
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

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npm --prefix frontend test` -- expected: frontend delete/API tests pass.
- `npm --prefix frontend run build` -- expected: TypeScript/Vite build succeeds.
- `dotnet build backend/backend.csproj --no-restore` -- expected: backend compiles.
- `dotnet build tests/backend-integration/backend-integration.csproj --no-restore` -- expected: backend integration test project compiles.
- `dotnet test tests/backend-integration/backend-integration.csproj --no-build` -- expected: run only when Docker is available; otherwise record Docker/Testcontainers unavailability as an environment blocker.

**Results:**
- `npm --prefix frontend test` -- passed, 54 tests.
- `npm --prefix frontend run build` -- passed.
- `dotnet build backend/backend.csproj --no-restore` -- passed.
- `dotnet build tests/backend-integration/backend-integration.csproj --no-restore` -- passed with existing `SSH.NET` NU1903 advisory warning.
- `dotnet test tests/backend-integration/backend-integration.csproj --no-build` -- blocked by Docker/Testcontainers unavailable after rerun with sandbox escalation; failed to connect to Docker endpoints at `/var/run/docker.sock` and `/Users/wallstreet62/.docker/run/docker.sock`.

--- END CLAIMS FILE ---

--- BEGIN UNIFIED DIFF ---
diff --git a/.gitignore b/.gitignore
new file mode 100644
index 0000000..aedfeac
--- /dev/null
+++ b/.gitignore
@@ -0,0 +1,10 @@
+bin/
+obj/
+node_modules/
+dist/
+coverage/
+*.tsbuildinfo
+.env
+.env.*
+!.env.example
+TestResults/
diff --git a/README.md b/README.md
new file mode 100644
index 0000000..c74b180
--- /dev/null
+++ b/README.md
@@ -0,0 +1,33 @@
+# BMAD Expense Tracker
+
+Local MVP scaffold for Story 1.1.
+
+## Run
+
+Backend:
+
+```bash
+dotnet run --project backend
+```
+
+Frontend:
+
+```bash
+npm --prefix frontend install
+npm --prefix frontend run dev
+```
+
+By default the frontend reads categories from `http://localhost:5000/api/categories`.
+Set `VITE_API_BASE_URL` to point at a different backend URL.
+
+## Verify
+
+```bash
+dotnet build
+dotnet test
+npm --prefix frontend test
+npm --prefix frontend run build
+```
+
+EF migrations are committed and must be applied explicitly by developers.
+
diff --git a/_bmad-output/implementation-artifacts/epic-1-context.md b/_bmad-output/implementation-artifacts/epic-1-context.md
new file mode 100644
index 0000000..eb0189a
--- /dev/null
+++ b/_bmad-output/implementation-artifacts/epic-1-context.md
@@ -0,0 +1,61 @@
+# Epic 1 Context: Fast Expense Capture with Starter Categories
+
+<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->
+
+## Goal
+
+Epic 1 establishes the usable starting point for the MVP: a single-user app that opens to Home, exposes starter categories immediately, and lets the user record an everyday expense quickly with only amount, category, and date required. It matters because the product's core value depends on fast manual capture before purchase details are forgotten, while preserving enough validation, persistence, and feedback to make the data trustworthy.
+
+## Stories
+
+- Story 1.1: Open the Home Experience with Starter Categories
+- Story 1.2: Create an Expense End-to-End
+- Story 1.3: Validate Fast Expense Capture with Clear Feedback
+
+## Requirements & Constraints
+
+The app must support creating an Expense with amount, Category, date, and optional description. Amounts display in INR using `₹`; the MVP must not require or store per-expense currency, exchange rates, conversion, or currency selection. The common save path should stay under 30 seconds by requiring only amount entry, Category selection, and Save when the date defaults to today and description is omitted.
+
+New Expense date defaults to today using the fixed application timezone `Asia/Kolkata`, but the user must be able to edit it before saving. Amount, Category, and date are required; saving must be prevented until they are valid. Amount must be positive and allow up to 2 decimal places. Description is optional and must not block saving.
+
+Default Categories must be available immediately as protected seeded data rows, including Food, Transport, Shopping, Bills, Entertainment, Health, Education, and Other. These categories must be usable for Expense creation and editing, and the app must not require any category setup before the first Expense can be captured.
+
+The MVP is single-user and must not include login, registration, sessions, authorization policies, User tables, UserId columns, or a hardcoded current user. Basic security and data integrity still apply: backend validation is authoritative, API inputs are validated, and Expense data should not be unnecessarily exposed.
+
+Save success must provide compact feedback with `Expense saved.`, reset the Add Expense form for rapid additional entry, and refresh or invalidate relevant server-backed state. Operation failures must keep the user in the Add Expense context, preserve entered data where applicable, and show concise actionable feedback near the relevant action or form area. Validation feedback must be inline and understandable; missing amount copy must be `Enter an amount to save this expense.`
+
+Verification for this epic should cover the Home shell and category chip availability, seeded Default Categories against PostgreSQL behavior, valid Expense creation, DTO mapping, decimal/date persistence, invalid create requests, ProblemDetails or ValidationProblemDetails responses, and meaningful frontend form validation/interaction behavior.
+
+## Technical Decisions
+
+The MVP uses a React/Vite TypeScript frontend, ASP.NET Core Web API backend, and PostgreSQL database. UI, API contracts, business rules, and persistence must remain separately identifiable.
+
+Backend implementation lives in one deployable ASP.NET Core Web API project with internal feature/layer folders. Endpoints or controllers stay thin and delegate to feature services. Feature services coordinate validation, domain rules, and persistence. Domain code must not depend on ASP.NET Core or EF Core. Data owns `DbContext`, EF configuration, migrations, and provider-specific persistence.
+
+Frontend TypeScript code is organized as `app`, `features/expenses`, `features/categories`, `shared/ui`, and `shared/api`. DTO types and API functions live in `shared/api`; UI components should not hand-shape raw backend responses. TanStack Query owns API-backed server state and mutations for Expenses and Categories; React state/hooks own form state and temporary selections; React Router owns navigation. Do not add Redux, Zustand, or another global client store.
+
+Every API endpoint must use explicit request/response DTOs and must not expose EF Core or domain entities directly. Use resource-oriented REST endpoints for Expenses and Categories, plus the current-month summary endpoint when needed by the Home shell. Do not introduce CQRS, MediatR, or another mediator framework.
+
+Expense stores `CategoryId`; Category is a first-class entity. Expense must not snapshot Category name. Default Categories are seeded and protected. Monetary values use .NET `decimal` and PostgreSQL `numeric(12,2)`; floating-point monetary amounts are forbidden. `ExpenseDate` uses .NET `DateOnly` mapped to PostgreSQL `date`; `CreatedAt` and `UpdatedAt` are UTC timestamps mapped to `timestamptz`. API dates use `YYYY-MM-DD`, and timestamps use ISO 8601.
+
+Frontend validation is immediate for UX, but backend validation repeats required checks and is authoritative for business rules and data integrity. API errors use ASP.NET Core `ProblemDetails` or `ValidationProblemDetails` with appropriate HTTP status codes; no custom error envelope is required. EF Core migrations are committed and applied explicitly by developers; the app must not auto-run migrations on startup.
+
+## UX & Interaction Patterns
+
+Home is the default landing surface. The app IA has Home, Review, and Categories destinations; Add Expense is not a separate navigation destination. Mobile uses bottom navigation, while desktop preserves the same IA in a compact header or side navigation.
+
+On mobile, Home order is Add Expense first, Current Month summary second, Recent Expenses third. On desktop, Home uses two columns with Add Expense and Current Month summary in the left/main column and Recent Expenses in the right column. Add Expense remains visually primary on all viewports.
+
+The Add Expense form is inline, compact, and immediately visible. Amount is first and visually primary, shows `₹` in or beside the field, uses mobile-optimized numeric input where supported, accepts positive values only, rejects zero/negative values, and allows up to 2 decimal places. Category selection uses directly visible wrapping chips with clear selected state, not a dropdown. Date is visible, compact, editable, and initialized to today. Description appears after required fields, is clearly optional, compact, and visually secondary.
+
+Use the adopted visual system: warm off-white page background, white raised surfaces, clear ink hierarchy, teal primary accent, semantic success/warning/danger colors, system UI typography, practical spacing, and modest radii. The interface should feel like a clean personal utility, not a dense finance dashboard: avoid broad gradients, decorative accent overuse, heavy nested cards, and chart-heavy styling.
+
+Accessibility expectations include meaningful labels, associated validation feedback, keyboard access for fields/buttons/navigation/chips, reading-order focus flow, comfortable touch targets, and selected/error/destructive states that do not rely on color alone.
+
+## Cross-Story Dependencies
+
+Story 1.1 provides the app shell, Home landing surface, frontend/backend structure, and seeded Default Categories needed by the Add Expense form in Stories 1.2 and 1.3.
+
+Story 1.2 depends on the starter Category data and chip selection foundation from Story 1.1, then creates the Expense API, persistence path, DTOs, and successful form reset/server-state refresh behavior that Story 1.3 hardens with validation and failure handling.
+
+Story 1.3 depends on the Add Expense form and create API from Story 1.2 so validation, ProblemDetails handling, preserved form state, accessibility, and success/failure feedback can be verified end to end.
diff --git a/_bmad-output/implementation-artifacts/spec-1-1-open-the-home-experience-with-starter-categories.md b/_bmad-output/implementation-artifacts/spec-1-1-open-the-home-experience-with-starter-categories.md
new file mode 100644
index 0000000..4e645e4
--- /dev/null
+++ b/_bmad-output/implementation-artifacts/spec-1-1-open-the-home-experience-with-starter-categories.md
@@ -0,0 +1,92 @@
+---
+title: 'Story 1.1: Open the Home Experience with Starter Categories'
+type: 'feature'
+created: '2026-09-16'
+status: 'done'
+route: 'dispatch'
+review_loop_iteration: 0
+baseline_commit: '7acbffa7e5e6b98e5b49c3d56f88cbac0f0b13b7'
+context:
+  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
+---
+
+<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">
+
+## Intent
+
+**Problem:** The repository has planning artifacts but no runnable app foundation, so a user cannot open Home or see starter categories. Story 1.1 must establish the local MVP shell and category foundation without drifting into expense creation, authentication, or advanced finance features.
+
+**Approach:** Create the initial React/Vite TypeScript frontend, ASP.NET Core Web API backend, PostgreSQL EF Core data model, and focused tests needed for Home to render with Home/Review/Categories navigation and protected default categories. Keep the UI visually aligned with the adopted design tokens and keep backend data/API boundaries ready for later expense stories.
+
+## Boundaries & Constraints
+
+**Always:** Home is the default frontend landing surface; navigation exposes only Home, Review, and Categories. Default categories are protected seeded database rows: Food, Transport, Shopping, Bills, Entertainment, Health, Education, and Other. Add Expense category chips must be loaded from the backend Category API through `shared/api`, not from a hardcoded UI list. Seeded default categories use stable IDs chosen before the first migration, category names are unique, and default rows are protected through the default/protected flag. Frontend code is organized under `app`, `features/expenses`, `features/categories`, `shared/ui`, and `shared/api`; backend code is one ASP.NET Core Web API with feature folders, `Domain`, `Data`, and only necessary `Common`. API contracts use DTOs, not EF/domain entities. EF migrations are committed but never auto-run on startup.
+
+**Never:** Do not add login, registration, sessions, roles, permissions, User tables, UserId columns, or a hardcoded current user. Do not implement expense save/edit/delete, custom category management, current-month summary calculations, analytics, search/filter-heavy review, Redux/Zustand, CQRS, MediatR, dropdown-based MVP category selection, broad gradients, dense dashboard styling, or nested heavy card treatment.
+
+## I/O & Edge-Case Matrix
+
+| Scenario | Input / State | Expected Output / Behavior | Error Handling |
+|----------|--------------|---------------------------|----------------|
+| Home first render | Frontend opens locally with API available | Home renders first with Add Expense visible, backend-loaded category chips, INR 0 current-month total, no fake category bars, Recent Expenses copy `No expenses yet. Add your first one above.`, and Home/Review/Categories navigation | If categories fail to load, keep Home shell visible and show concise inline failure near the category area |
+| Default category seed | Database migration is applied to an empty PostgreSQL database | Category rows exist for Food, Transport, Shopping, Bills, Entertainment, Health, Education, Other with stable IDs, unique names, and protected/default flag | Duplicate seeding should be prevented by migration/model seed behavior and category-name uniqueness |
+| Category API | Client requests starter categories | Response returns explicit category DTOs with id, name, and default/protected status | API failures use appropriate ASP.NET Core problem response behavior; no custom envelope |
+| Responsive shell | Mobile and desktop viewport widths | Mobile order is Add Expense, Current Month summary, Recent Expenses; desktop uses two columns with Add Expense/summary left and Recent Expenses right | Layout must remain readable without overlapping controls or text |
+
+</frozen-after-approval>
+
+## Code Map
+
+- `_bmad-output/implementation-artifacts/epic-1-context.md` -- distilled Epic 1 requirements, architecture, UX constraints, and cross-story dependencies for implementation.
+- `_bmad-output/planning-artifacts/epics.md` -- source Story 1.1 acceptance criteria and requirement IDs.
+- `_bmad-output/planning-artifacts/architecture/architecture-bmad-expense-tracker-2026-09-15/ARCHITECTURE-SPINE.md` -- structural seed, stack choices, backend/frontend boundaries, no-auth rule, EF/PostgreSQL decisions.
+- `_bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/DESIGN.md` -- visual tokens and constraints for surfaces, ink hierarchy, teal accent, spacing, radius, and anti-dashboard styling.
+- `_bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/EXPERIENCE.md` -- Home IA, mobile/desktop layout order, category chip pattern, accessibility floor, and empty-state behavior.
+- `frontend/` -- does not exist yet; create the Vite React TypeScript app here.
+- `backend/` -- does not exist yet; create the ASP.NET Core Web API project here.
+- `tests/` -- does not exist yet; create focused backend integration and frontend test scaffolding for this story.
+- Do not change or remove existing untracked BMAD planning artifacts; they are approved context for this build run.
+
+## Tasks & Acceptance
+
+**Execution:**
+- [x] `frontend/package.json`, `frontend/vite.config.ts`, `frontend/src/**` -- scaffold React/Vite TypeScript with app providers/routing and the required folder layout -- makes Home a runnable local surface.
+- [x] `frontend/src/app/**`, `frontend/src/features/expenses/**`, `frontend/src/features/categories/**`, `frontend/src/shared/ui/**`, `frontend/src/shared/api/**` -- implement Home shell, responsive navigation, Add Expense placeholder form, finalized empty Home state (INR 0 total, no fake bars, `No expenses yet. Add your first one above.`), backend-loaded category chip display, API client/types, and accessible shared controls -- satisfies IA, layout, chip, and visual-token acceptance.
+- [x] `backend/backend.csproj`, `backend/Program.cs`, `backend/Domain/**`, `backend/Data/**`, `backend/Features/Categories/**` -- scaffold the API, Category domain model, DbContext/configuration, explicit category DTO endpoint, and CORS/dev config as needed -- provides the category foundation without exposing entities.
+- [x] `backend/Data/Migrations/**` -- add the initial EF Core migration that creates protected default categories as seeded rows with stable IDs, unique category names, and default/protected flags -- makes explicit developer-applied PostgreSQL initialization possible.
+- [x] `tests/backend-integration/**` -- add PostgreSQL/Testcontainers-backed tests that apply migrations and assert the protected default category rows and category API contract -- verifies persistence-sensitive seed behavior.
+- [x] `frontend/src/**/*.test.*` or colocated frontend tests -- cover Home default rendering, Home/Review/Categories navigation labels, category chip availability, and basic responsive/layout semantics where practical -- verifies user-visible shell behavior.
+- [x] Root-level solution/config files as needed, such as `.gitignore`, `README.md`, or solution files -- add only minimal project-running and verification support -- keeps the new scaffold understandable.
+
+**Acceptance Criteria:**
+- Given the frontend dev server is run locally, when the user opens the app, then Home is the default landing surface and Home, Review, and Categories navigation are present without auth/user concepts.
+- Given the backend migration is applied to PostgreSQL, when categories are queried, then the eight protected default categories are present as database rows with stable IDs, unique names, protected/default flags, and returned through explicit DTOs.
+- Given Home renders on mobile width, when layout is inspected, then Add Expense appears before Current Month summary and Recent Expenses.
+- Given Home renders on desktop width, when layout is inspected, then Add Expense and Current Month summary are in the left/main column and Recent Expenses is in the right column.
+- Given category choices render in Add Expense, when the user views them, then they are loaded from the backend Category API and appear as wrapping selectable chips with a clear selected state and no dropdown.
+- Given the UI is inspected, when styles are reviewed, then DESIGN tokens and constraints are followed without broad gradients, dense dashboard styling, or nested heavy card treatment.
+- Given tests are run, when verification completes, then frontend Home/category shell tests and backend PostgreSQL-backed default category seed tests pass.
+
+## Implementation Notes
+
+- Implemented initial React/Vite frontend, ASP.NET Core backend, EF Core category seed model/migration, frontend tests, and backend Testcontainers integration tests for Story 1.1.
+- Verified `npm --prefix frontend test`, `npm --prefix frontend run build`, `dotnet build backend/backend.csproj --no-restore`, and `dotnet build tests/backend-integration/backend-integration.csproj --no-restore`.
+- `dotnet test tests/backend-integration/backend-integration.csproj --no-build` is blocked in this environment because Docker is not running or reachable for Testcontainers. The first sandboxed attempt also could not open the test runner socket; the escalated attempt reached the test runner but failed on Docker endpoint discovery.
+- `dotnet build bmad-expense-tracker.sln --no-restore` hung after compiling the backend project and was stopped; project-level builds succeeded.
+- Finalized after rerunning all non-Docker local verification successfully: frontend tests, frontend build, backend project build, and backend integration project build. Testcontainers execution remains an environment verification blocker only; implementation and architecture were kept intact.
+
+## Spec Change Log
+
+## Review Triage Log
+
+## Design Notes
+
+Create only enough Add Expense UI for Story 1.1: a visible, accessible shell with disabled or non-submitting save behavior is acceptable until Story 1.2 implements create. Category chips must use real data from the backend Category API so later stories can reuse the same selection foundation.
+
+## Verification
+
+**Commands:**
+- `dotnet test` -- expected: backend integration tests pass, including PostgreSQL/Testcontainers category seed checks.
+- `npm --prefix frontend test` -- expected: frontend Home shell and category chip tests pass.
+- `npm --prefix frontend run build` -- expected: TypeScript/Vite production build succeeds.
+- `dotnet build` -- expected: backend compiles without warnings that indicate broken contracts or missing references.
diff --git a/_bmad-output/implementation-artifacts/spec-1-2-create-an-expense-end-to-end.md b/_bmad-output/implementation-artifacts/spec-1-2-create-an-expense-end-to-end.md
new file mode 100644
index 0000000..f35e3a6
--- /dev/null
+++ b/_bmad-output/implementation-artifacts/spec-1-2-create-an-expense-end-to-end.md
@@ -0,0 +1,101 @@
+---
+title: 'Story 1.2: Create an Expense End-to-End'
+type: 'feature'
+created: '2026-09-16'
+status: 'done'
+route: 'dispatch'
+review_loop_iteration: 0
+baseline_commit: '7acbffa7e5e6b98e5b49c3d56f88cbac0f0b13b7'
+context:
+  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
+---
+
+<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">
+
+## Intent
+
+**Problem:** Home can show starter categories, but the Add Expense form still cannot save a real Expense. The user needs the common capture path to persist amount, Category, date, and optional description without adding unrelated navigation or broader finance features.
+
+**Approach:** Add the Expense domain/persistence/API path and activate the existing Add Expense form with a TanStack Query mutation. Keep the normal path small: amount entry, Category chip selection, default editable date, optional description, Save, successful persistence, `Expense saved.`, and form reset.
+
+## Boundaries & Constraints
+
+**Always:** Expense stores amount, CategoryId, ExpenseDate, optional description, CreatedAt, and UpdatedAt only. Amount uses .NET `decimal` and PostgreSQL `numeric(12,2)`; ExpenseDate uses `DateOnly` mapped to PostgreSQL `date`; timestamps are UTC `timestamptz`. API contracts use explicit create request/response DTOs and never expose EF/domain entities. Add Expense uses backend-loaded category chips from Story 1.1, keeps the date visible/editable, defaults date using `Asia/Kolkata`, displays INR (`₹`), and resets after a successful save. TanStack Query owns the create mutation and invalidates or updates relevant expense/category/summary query keys.
+
+**Never:** Do not add per-expense currency, exchange rates, conversion, payment method, merchant, receipt, tags, user/auth concepts, search/filter/review features, current-month summary calculations, or custom category management. Do not move Story 1.3's full validation/error-feedback scope into this story, but do not persist obviously invalid server data.
+
+## I/O & Edge-Case Matrix
+
+| Scenario | Input / State | Expected Output / Behavior | Error Handling |
+|----------|--------------|---------------------------|----------------|
+| Common save | Amount `125.50`, selected Default Category, default today date, empty description | POST creates an Expense row and response DTO; form shows `Expense saved.` and resets for another entry | If save request fails, stay on Home and preserve entered form values |
+| Optional description | Valid create with description omitted or blank | Persist/return no meaningful description value; no extra fields are required | N/A |
+| Persistence types | Valid create request reaches backend | Amount stored as `numeric(12,2)`, ExpenseDate as `date`, CreatedAt/UpdatedAt as UTC `timestamptz` | Backend rejects invalid category or missing/invalid core values rather than saving corrupt data |
+| Currency scope | Create request/response and UI display | INR symbol is display-only; no currency field exists in request, response, entity, or migration | N/A |
+
+</frozen-after-approval>
+
+## Code Map
+
+- `_bmad-output/implementation-artifacts/epic-1-context.md` -- Epic 1 constraints, especially create expense, decimal/date persistence, TanStack Query, and Story 1.3 boundary.
+- `_bmad-output/implementation-artifacts/spec-1-1-open-the-home-experience-with-starter-categories.md` -- completed scaffold continuity; keep Story 1.1 files intact while extending them.
+- `_bmad-output/planning-artifacts/epics.md` -- Story 1.2 acceptance criteria and Story 1.3 validation split.
+- `backend/Domain/Category.cs` -- existing domain style; add an `Expense` domain model alongside it.
+- `backend/Data/AppDbContext.cs` and `backend/Data/Migrations/**` -- existing EF model/migration pattern; add `Expenses`, FK to `Category`, decimal/date/timestamp configuration, and a new migration.
+- `backend/Features/Categories/**` and `backend/Program.cs` -- thin endpoint + feature service registration pattern to mirror for `Features/Expenses`.
+- `frontend/src/features/expenses/AddExpensePanel.tsx` -- existing disabled Add Expense shell; convert to controlled submit flow without changing the Home layout contract.
+- `frontend/src/shared/api/categories.ts` and `frontend/src/features/categories/useCategories.ts` -- API/hook pattern; add expense DTO/API/mutation equivalents under `shared/api` and `features/expenses`.
+- `frontend/src/app/App.test.tsx` -- extend or add focused tests for successful create with omitted description and form reset.
+- `tests/backend-integration/CategoryApiTests.cs` -- Testcontainers/WebApplicationFactory pattern; add expense create tests while recognizing Docker may block execution locally.
+- Do not reset, discard, overwrite, or otherwise rework existing Story 1.1 implementation files beyond the smallest Story 1.2 extensions.
+
+## Tasks & Acceptance
+
+**Execution:**
+- [x] `backend/Domain/Expense.cs` -- add Expense entity and creation behavior for amount, category, date, optional description, and timestamps -- centralizes core persisted shape.
+- [x] `backend/Data/AppDbContext.cs`, `backend/Data/Migrations/**` -- add EF mapping/migration for `expenses` with `numeric(12,2)`, `date`, `timestamptz`, required Category FK, and no currency column -- satisfies persistence contract.
+- [x] `backend/Features/Expenses/**`, `backend/Program.cs` -- add create request/response DTOs, feature service, `POST /api/expenses`, and service/endpoint registration -- exposes explicit REST contract without leaking entities.
+- [x] `frontend/src/shared/api/expenses.ts`, `frontend/src/features/expenses/useCreateExpense.ts` -- add DTO/API function and TanStack Query mutation with relevant invalidation/update hooks -- connects UI to backend state ownership.
+- [x] `frontend/src/features/expenses/AddExpensePanel.tsx` -- activate controlled form submit, selected category, editable default date, optional description, success copy, and reset after successful save -- completes the fast capture path.
+- [x] `frontend/src/app/App.test.tsx` or colocated expense tests -- cover successful Add Expense submission with omitted description, API payload, success copy, and reset behavior -- verifies the user-facing happy path.
+- [x] `tests/backend-integration/**` -- cover valid create, DTO mapping, decimal/date/timestamp persistence, Category FK use, and absence of currency fields -- verifies backend contract and PostgreSQL-sensitive behavior.
+
+**Acceptance Criteria:**
+- Given Home has categories, when the user enters amount, selects a category, keeps today's default date, omits description, and saves, then the app creates an Expense and resets the form with `Expense saved.`.
+- Given a valid create request reaches the API, when it is handled, then the response is an explicit DTO containing the saved expense data and no EF/domain entity or currency field.
+- Given the database row is inspected after create, when persistence is verified, then amount/date/timestamps use the required PostgreSQL types and the row references the selected CategoryId.
+- Given the common path is used, when the user records an expense, then no unrelated navigation is required and the amount field remains first with INR display.
+- Given Story 1.3 remains future work, when validation is reviewed, then this story includes enough backend guardrails to avoid corrupt saves but does not attempt the full inline validation/error UX suite.
+
+## Implementation Notes
+
+- Implemented Expense domain/persistence/API path, EF migration, Add Expense create mutation, success/reset behavior, and frontend/backend tests for Story 1.2.
+- Review patch added backend guards for overlong descriptions and values beyond `numeric(12,2)`, replaced fragile locale date formatting with `formatToParts`, kept explicit category chip selection required, and added missing frontend API-client/backend invalid-request tests.
+- Verified `npm --prefix frontend test`, `npm --prefix frontend run build`, `dotnet build backend/backend.csproj --no-restore`, and `dotnet build tests/backend-integration/backend-integration.csproj --no-restore`.
+- `dotnet test tests/backend-integration/backend-integration.csproj --no-build` is blocked in this environment because Docker is not running or reachable for Testcontainers. The tests are present and compile; no Docker workaround or architecture change was introduced.
+
+## Spec Change Log
+
+## Review Triage Log
+
+- patch: Overlarge amounts could reach PostgreSQL and fail at `SaveChangesAsync`; added an explicit `numeric(12,2)` upper-bound guard and invalid-request test coverage.
+- patch: Descriptions longer than the EF column limit could fail as persistence errors; added a 240-character guard and invalid-request test coverage.
+- patch: Default date formatting relied on locale output shape; changed to `formatToParts`-based `YYYY-MM-DD` construction.
+- patch: Invalid backend create branches lacked verification; added parameterized integration tests for amount, category, date, and description validation paths.
+- patch: Frontend create API path was mocked away from tests; added focused `createExpense` fetch-shape and error tests.
+- false: Full frontend field-level validation, field-specific ProblemDetails rendering, and richer operation-failure feedback belong to Story 1.3 per the approved scope.
+- false: Returning `201 Created` with a future expense resource URI is acceptable for the create contract and does not require adding Review/detail retrieval in Story 1.2.
+- deferred-low: Category order verification is useful but not part of Story 1.2's create-expense intent; current work preserves backend-loaded chips from Story 1.1.
+
+## Design Notes
+
+Do not introduce a Review list or real Current Month summary in this story. After create, invalidating placeholder future keys such as `["expenses"]` or `["current-month-summary"]` is acceptable so Story 4 can attach real readers later without changing mutation semantics.
+
+## Verification
+
+**Commands:**
+- `npm --prefix frontend test` -- expected: frontend tests pass, including successful create with omitted description.
+- `npm --prefix frontend run build` -- expected: TypeScript/Vite build succeeds.
+- `dotnet build backend/backend.csproj --no-restore` -- expected: backend compiles.
+- `dotnet build tests/backend-integration/backend-integration.csproj --no-restore` -- expected: backend integration test project compiles.
+- `dotnet test tests/backend-integration/backend-integration.csproj --no-build` -- expected: passes when Docker/Testcontainers is available; record Docker unavailability as an environment verification blocker, not an architecture change.
diff --git a/_bmad-output/implementation-artifacts/sprint-status.yaml b/_bmad-output/implementation-artifacts/sprint-status.yaml
new file mode 100644
index 0000000..b1cd0b4
--- /dev/null
+++ b/_bmad-output/implementation-artifacts/sprint-status.yaml
@@ -0,0 +1,61 @@
+# STATUS DEFINITIONS:
+# ==================
+# Epic Status:
+#   - backlog: Epic not yet started
+#   - in-progress: Epic actively being worked on
+#   - done: All stories in epic completed
+
+# Story Status:
+#   - backlog: Story only exists in epic file
+#   - ready-for-dev: Story file created, ready for development
+#   - in-progress: Developer actively working on implementation
+#   - review: Implementation complete, ready for review
+#   - done: Story completed
+
+# Retrospective Status:
+#   - optional: Can be completed but not required
+#   - done: Retrospective has been completed
+
+# Action Item Status:
+#   - open: Committed during a retrospective, not yet addressed
+#   - in-progress: Actively being worked on
+#   - done: Completed
+
+# WORKFLOW NOTES:
+# ===============
+# - Epic transitions to 'in-progress' automatically when its first story starts (via build's sprint sync)
+# - Stories can be worked in parallel if team capacity allows
+# - Developer typically creates the next story after the previous one is 'done' to incorporate learnings
+# - Dev moves story to 'review', then runs code-review (fresh context, different LLM recommended)
+# - Retrospective appends its action items to action_items; the status view surfaces open ones
+generated: 09-16-2026 12:47
+last_updated: 09-16-2026 15:48
+project: bmad-expense-tracker
+project_key: NOKEY
+tracking_system: file-system
+story_location: 
+  /Users/wallstreet62/Desktop/Projects/bmad-expense-tracker/_bmad-output/implementation-artifacts
+development_status:
+  epic-1: done
+  1-1-open-the-home-experience-with-starter-categories: done
+  1-2-create-an-expense-end-to-end: done
+  1-3-validate-fast-expense-capture-with-clear-feedback: done
+  epic-1-retrospective: optional
+
+  epic-2: in-progress
+  2-1-review-recorded-expenses: done
+  2-2-view-and-edit-expense-details: done
+  2-3-delete-an-expense-with-confirmation: in-progress
+  epic-2-retrospective: optional
+
+  epic-3: backlog
+  3-1-view-categories-and-create-a-custom-category: backlog
+  3-2-rename-a-custom-category-safely: backlog
+  3-3-delete-only-unused-custom-categories: backlog
+  epic-3-retrospective: optional
+
+  epic-4: backlog
+  4-1-calculate-current-month-summary-on-demand: backlog
+  4-2-show-current-month-total-category-breakdown-and-recent-expen: backlog
+  4-3-keep-spending-awareness-fresh-after-expense-changes: backlog
+  epic-4-retrospective: optional
diff --git a/_bmad-output/planning-artifacts/architecture/architecture-bmad-expense-tracker-2026-09-15/.memlog.md b/_bmad-output/planning-artifacts/architecture/architecture-bmad-expense-tracker-2026-09-15/.memlog.md
new file mode 100644
index 0000000..244ea28
--- /dev/null
+++ b/_bmad-output/planning-artifacts/architecture/architecture-bmad-expense-tracker-2026-09-15/.memlog.md
@@ -0,0 +1,45 @@
+---
+scope: bmad-expense-tracker
+purpose: implementation handoff architecture spine for an internal learning project
+altitude: feature
+updated: 2026-09-16T12:30
+---
+
+- (direction) Coaching path selected; challenge weak or premature technical decisions and explain reasoning during elicitation.
+- (decision) Architecture spine is the only deliverable; it serves as implementation handoff for the internal learning project.
+- (decision) Adopt full-stack split application: React frontend, ASP.NET Core Web API backend, PostgreSQL persistence. Binds all MVP features. Prevents frontend-only persistence or backendless implementations that skip the intended API, validation, and persistence learning goals.
+- (constraint) Architecture must stay deliberately small and pragmatic for CRUD MVP: use boundaries that teach or protect real concerns, avoid excessive projects, abstractions, patterns, or infrastructure.
+- (decision) Backend is one deployable ASP.NET Core Web API project with internal folders/layers: Features/Expenses, Features/Categories, Domain, Data or Infrastructure, and Common only where genuinely needed. Binds backend implementation. Prevents premature multi-project Clean Architecture ceremony for the CRUD MVP.
+- (decision) Backend dependency direction: HTTP endpoints/controllers stay thin and delegate validation/business rules to feature/application handlers or services; Domain holds core entities and rules; Data/Infrastructure owns EF Core DbContext, configurations, migrations, and persistence details. Prevents business rules being scattered through controllers or persistence code.
+- (decision) Frontend uses feature-first React structure: app for routing/providers/layout, features/expenses, features/categories, shared/ui, and shared/api. Binds frontend implementation. Prevents screen-by-screen organization or ad hoc shared folders that blur feature ownership.
+- (decision) Frontend server state is managed with TanStack Query: Expenses, Categories, Current Month summary, and all API-backed data. Local UI state stays in React state/hooks; route state is owned by React Router; no Redux, Zustand, or other global client store in MVP. Prevents duplicating server data in client-only stores or over-centralizing temporary UI state.
+- (decision) Frontend API contracts/types are centralized in shared/api rather than letting raw response shapes leak throughout UI components. Prevents incompatible assumptions about backend DTOs across independently built feature screens.
+- (decision) API uses explicit request/response DTOs per operation and never exposes EF Core/domain entities directly. Create/update requests and response DTOs live close to their feature where practical, with explicit mapping between DTOs and domain/EF entities. Binds API, backend, and frontend contracts. Prevents persistence model changes from breaking public API contracts or raw database shapes leaking into UI.
+- (decision) API is resource-oriented REST for Expenses and Categories, with a dedicated Current Month Summary endpoint. Controllers/endpoints stay thin and delegate behavior to feature/application services. No CQRS, MediatR, or mediator framework in MVP unless a concrete later requirement justifies it. Prevents over-engineering the CRUD API while preserving clear contracts.
+- (decision) Category is a first-class entity and Expense references Category by CategoryId foreign key. Expense fields: Id, Amount, CategoryId, ExpenseDate, Description, CreatedAt, UpdatedAt. Category fields: Id, Name, Type or IsDefault, CreatedAt, UpdatedAt. No category name snapshot on Expense. Binds data model and API behavior. Prevents divergent historical-label versus live-category semantics.
+- (decision) Default Categories are seeded database rows protected from edit/delete; Custom Categories are normal rows that can be created, renamed, and deleted only when unused. Category deletion referenced by Expenses must be blocked by business rule and FK integrity. Prevents orphaned Expenses or broken immediately available starter Categories.
+- (decision) Monetary values use .NET decimal and PostgreSQL numeric(12,2); floating-point types are forbidden for amounts. Prevents rounding drift in Expense totals and Current Month summaries.
+- (assumption) No User entity is required for MVP; keep model reasonably extensible for future auth/multi-user support without adding user ownership fields until required.
+- (decision) Date semantics: ExpenseDate is the user-selected occurrence date, stored as .NET DateOnly mapped to PostgreSQL date. CreatedAt and UpdatedAt are UTC timestamps mapped to PostgreSQL timestamptz; CreatedAt is the same-date expense ordering tie-breaker. Binds data model, ordering, and summary behavior. Prevents mixing occurrence dates with record timestamps.
+- (decision) Backend uses fixed application timezone Asia/Kolkata as authoritative for Current Month and today semantics. Frontend may prefill today's date for convenience but sends selected ExpenseDate explicitly. Timezone is not user-editable in MVP. Prevents browser/server timezone drift while avoiding user timezone configuration complexity.
+- (decision) API contracts encode dates as YYYY-MM-DD and timestamps as ISO 8601. Prevents incompatible date parsing assumptions between React frontend and ASP.NET Core API.
+- (decision) Current Month summary is calculated on demand in the backend from normalized Expenses and Categories; no summary table, denormalized summary state, caching, materialized view, or background aggregation in MVP. Binds summary implementation. Prevents inconsistent derived totals after Expense create/update/delete.
+- (decision) GET /api/summaries/current-month returns Home-required summary data: monthStart, monthEnd, totalAmount, categoryBreakdown, and recentExpenses. Summary filters Expenses by ExpenseDate within the Asia/Kolkata current calendar month, groups by CategoryId, resolves Category names, and returns nonzero categories ranked by amount descending. Prevents frontend-side financial aggregation or divergent summary logic.
+- (decision) Validation ownership: frontend performs immediate UX validation for obvious form issues; backend repeats required validation and is authoritative for data integrity and business rules including positive amount, max 2 decimal places, existing Category references, protected Default Categories, and blocking deletion of in-use Custom Categories. Prevents trusting client validation for business correctness.
+- (decision) API error contract uses ASP.NET Core standard ProblemDetails for general errors and ValidationProblemDetails for validation/field-level errors, with appropriate HTTP status codes. Frontend maps validation errors to relevant form fields inline. No custom error envelope in MVP unless a concrete requirement emerges. Prevents incompatible error handling conventions across endpoints and UI forms.
+- (decision) Testing strategy is part of the architecture spine: backend unit tests cover domain/business rules; backend integration tests cover API + EF Core + PostgreSQL behavior using Testcontainers PostgreSQL for migrations, foreign keys, numeric precision, and date behavior; frontend tests cover meaningful component/form validation and interactions; E2E tests stay few and cover critical user journeys. Prevents untested architectural boundaries and database behavior drift.
+- (constraint) Do not target 100% coverage; do not use SQLite/in-memory EF tests as a substitute for PostgreSQL integration tests where database-specific behavior matters; keep tests focused on important behavior rather than implementation details.
+- (decision) Local development envelope: PostgreSQL runs locally as an installed service/application; frontend runs as Vite dev process; backend runs as ASP.NET Core development process. No Docker or Docker Compose required for local development. Binds developer setup. Prevents implementation stories from assuming containerized local app infrastructure.
+- (decision) Backend configuration supports connection strings through appsettings plus environment variables/user-secrets as appropriate. EF Core migrations are committed to source control and applied explicitly by developers; application must not auto-run migrations on startup. Prevents risky startup migration habits and hidden database changes.
+- (question) Production hosting, CI/CD, authentication, and advanced observability are deferred until implementation or later architecture update requires specific decisions.
+- (decision) MVP is single-user with no authentication or authorization: no login, registration, sessions, authorization policies, User table, UserId columns, fake identities, or hardcoded current user. Treat locally running app as belonging to one user. Binds API, data model, and services. Prevents pretend multi-user architecture without a real identity mechanism.
+- (question) Authentication and multi-user data ownership are future architectural changes to introduce at the API/application boundary when there is an actual requirement and identity mechanism; do not thread hypothetical UserId through MVP DTOs or methods.
+- (constraint) No financial integrations, credentials, or sensitive external data sources in MVP.
+- (decision) Frontend is TypeScript-first: React components and application code use TypeScript; API request/response DTO types live in the frontend API layer and align with backend DTO contracts; form models and validation-related types use TypeScript where useful. Avoid JavaScript application code except where tooling/config requires it; avoid unnecessary advanced TypeScript abstractions. Prevents soft or implicit frontend/backend contract drift.
+- (version) Verified 2026-09-16: .NET/ASP.NET Core 10.0.12 LTS is the stable backend target; .NET 11 is RC/preview and not bound for MVP.
+- (version) Verified 2026-09-16: EF Core 10.0.12 and Npgsql.EntityFrameworkCore.PostgreSQL 10.0.3 are stable persistence packages aligned with .NET 10.
+- (version) Verified 2026-09-16: PostgreSQL 18 is current supported major; latest current minor shown as 18.6.
+- (version) Verified 2026-09-16: Node.js 24.21.0 LTS is the frontend runtime target; Vite 8 requires Node 20.19+ or 22.12+, and Node 24 LTS satisfies it.
+- (version) Verified 2026-09-16: React 19.3, Vite 8.3.0, TypeScript 7.0.2, TanStack Query 5.102.8, React Router 8.4.0, Vitest 5.0.1, React Testing Library 16.3.3, Playwright Test 1.63.0, Testcontainers.PostgreSql 4.15.0.
+- (direction) Key rationale/tradeoffs for handoff: full-stack split chosen to practice realistic API/backend/persistence boundaries; single backend project chosen to avoid multi-project ceremony; TanStack Query chosen because app state is primarily server-owned; explicit DTOs chosen to keep API contracts stable; on-demand summary chosen to avoid derived-state inconsistency; no-auth single-user chosen to avoid pretend identity architecture; local installed PostgreSQL chosen for current dev preference while Testcontainers remains test-specific.
+- (event) spine finalized
diff --git a/_bmad-output/planning-artifacts/architecture/architecture-bmad-expense-tracker-2026-09-15/ARCHITECTURE-SPINE.md b/_bmad-output/planning-artifacts/architecture/architecture-bmad-expense-tracker-2026-09-15/ARCHITECTURE-SPINE.md
new file mode 100644
index 0000000..518a473
--- /dev/null
+++ b/_bmad-output/planning-artifacts/architecture/architecture-bmad-expense-tracker-2026-09-15/ARCHITECTURE-SPINE.md
@@ -0,0 +1,265 @@
+---
+name: bmad-expense-tracker
+type: architecture-spine
+purpose: build-substrate
+altitude: feature
+paradigm: pragmatic layered full-stack split
+scope: bmad-expense-tracker MVP
+status: final
+created: 2026-09-16
+updated: 2026-09-16
+binds:
+  - Expense Recording
+  - Expense Review and Maintenance
+  - Category Management
+  - Current-Month Spending Summary
+sources:
+  - ../../briefs/brief-bmad-expense-tracker-2026-09-15/brief.md
+  - ../../prds/prd-bmad-expense-tracker-2026-09-15/prd.md
+  - ../../ux-designs/ux-bmad-expense-tracker-2026-09-15/EXPERIENCE.md
+  - ../../ux-designs/ux-bmad-expense-tracker-2026-09-15/DESIGN.md
+companions:
+  - .memlog.md
+---
+
+# Architecture Spine - bmad-expense-tracker
+
+## Design Paradigm
+
+Use a pragmatic layered full-stack split: React/Vite TypeScript frontend, ASP.NET Core Web API backend, and PostgreSQL persistence. Boundaries are intentionally small and educational: the frontend owns UI composition and server-state orchestration; the API owns contracts and validation; feature services own business behavior; Domain owns core entities/rules; Data owns EF Core persistence.
+
+```mermaid
+flowchart LR
+  UI["React UI\napp + features"] --> APIClient["shared/api\nDTO types + HTTP client"]
+  APIClient --> HTTP["ASP.NET Core endpoints/controllers"]
+  HTTP --> Feature["Feature services\nExpenses + Categories + Summaries"]
+  Feature --> Domain["Domain\nExpense + Category rules"]
+  Feature --> Data["Data\nDbContext + EF config + migrations"]
+  Data --> PG["PostgreSQL"]
+```
+
+## Invariants & Rules
+
+### AD-1 - Full-Stack Split Application [ADOPTED]
+
+- **Binds:** all MVP capabilities
+- **Prevents:** frontend-only, backendless, or persistence-light implementations that skip the intended API, validation, and PostgreSQL learning goals
+- **Rule:** Build the MVP as React frontend + ASP.NET Core Web API + PostgreSQL. UI, API contracts, business rules, and persistence must remain separately identifiable implementation concerns.
+
+### AD-2 - Single Backend Project With Internal Layers [ADOPTED]
+
+- **Binds:** backend implementation
+- **Prevents:** premature multi-project Clean Architecture ceremony and controller/data-layer business-rule scattering
+- **Rule:** The backend is one deployable ASP.NET Core Web API project organized internally around `Features/Expenses`, `Features/Categories`, `Domain`, `Data` or `Infrastructure`, and `Common` only where genuinely needed. Do not introduce separate Application/Core/Infrastructure projects without a concrete later requirement.
+
+### AD-3 - Backend Dependency Direction [ADOPTED]
+
+- **Binds:** backend implementation
+- **Prevents:** HTTP endpoints, EF Core configuration, and domain behavior depending on each other inconsistently
+- **Rule:** Endpoints/controllers stay thin and call feature/application services. Feature services coordinate validation, domain rules, and persistence. Domain must not depend on ASP.NET Core or EF Core. Data owns `DbContext`, EF configurations, migrations, and provider-specific persistence.
+
+```mermaid
+flowchart TD
+  Endpoints["Endpoints / Controllers"] --> Services["Feature Services"]
+  Services --> Domain["Domain"]
+  Services --> Data["Data / Infrastructure"]
+  Data --> Domain
+  Data --> PostgreSQL["PostgreSQL"]
+```
+
+### AD-4 - Feature-First TypeScript Frontend [ADOPTED]
+
+- **Binds:** frontend implementation
+- **Prevents:** screen-by-screen organization, ad hoc shared folders, and soft frontend/backend contracts
+- **Rule:** Frontend application code is TypeScript-first and organized as `app`, `features/expenses`, `features/categories`, `shared/ui`, and `shared/api`. API request/response DTO types live in `shared/api`; raw backend response shapes must not leak directly across UI components.
+
+### AD-5 - Frontend State Ownership [ADOPTED]
+
+- **Binds:** frontend data flow
+- **Prevents:** duplicating server data in global client stores or over-centralizing local UI state
+- **Rule:** TanStack Query owns API-backed server state: Expenses, Categories, Current Month summary, and related mutations. React state/hooks own local UI state such as forms, dialogs, and temporary selections. React Router owns navigation state. Do not add Redux, Zustand, or another global client store in the MVP.
+
+### AD-6 - Explicit API DTO Contracts [ADOPTED]
+
+- **Binds:** API, backend, frontend contracts
+- **Prevents:** EF/domain entities becoming the public API and persistence changes breaking UI contracts
+- **Rule:** Every endpoint uses explicit request/response DTOs. Do not expose EF Core/domain entities directly. Keep DTOs close to their feature where practical and map explicitly between DTOs and entities.
+
+### AD-7 - Resource-Oriented REST Without Mediator Framework [ADOPTED]
+
+- **Binds:** API shape
+- **Prevents:** CQRS/MediatR ceremony for CRUD workflows and incompatible route conventions
+- **Rule:** Use resource-oriented REST endpoints for Expenses and Categories plus `GET /api/summaries/current-month`. Controllers/endpoints delegate behavior to feature services. Do not introduce CQRS, MediatR, or another mediator framework in the MVP.
+
+### AD-8 - Category Identity Model [ADOPTED]
+
+- **Binds:** data model, API behavior, category UX
+- **Prevents:** divergent historical-label versus live-category semantics
+- **Rule:** `Category` is a first-class entity. `Expense` stores `CategoryId` as a foreign key and does not snapshot category name. Renaming a Category preserves existing Expense associations.
+
+### AD-9 - Protected Default Categories [ADOPTED]
+
+- **Binds:** category management, data integrity
+- **Prevents:** orphaned Expenses, missing starter categories, or automatic category reassignment
+- **Rule:** Default Categories are seeded database rows protected from edit/delete. Custom Categories can be created, renamed, and deleted only when unused. Category deletion referenced by Expenses must be blocked by business rule and FK integrity.
+
+### AD-10 - Money Uses Decimal/Numeric [ADOPTED]
+
+- **Binds:** Expense amounts, totals, category breakdowns
+- **Prevents:** floating-point rounding drift in monetary values
+- **Rule:** Monetary values use .NET `decimal` and PostgreSQL `numeric(12,2)`. Floating-point types are forbidden for amounts and summaries.
+
+### AD-11 - Date and Time Semantics [ADOPTED]
+
+- **Binds:** Expense ordering, Current Month filtering, API contracts
+- **Prevents:** mixing user occurrence dates with record timestamps or browser/server timezone drift
+- **Rule:** `ExpenseDate` is the user-selected occurrence date, stored as .NET `DateOnly` mapped to PostgreSQL `date`. `CreatedAt` and `UpdatedAt` are UTC timestamps mapped to `timestamptz`; `CreatedAt` is the same-date ordering tie-breaker. Backend uses fixed application timezone `Asia/Kolkata` for Current Month and "today" semantics. API dates use `YYYY-MM-DD`; timestamps use ISO 8601.
+
+### AD-12 - On-Demand Current Month Summary [ADOPTED]
+
+- **Binds:** Current-Month Spending Summary
+- **Prevents:** inconsistent denormalized summary state after Expense create/update/delete
+- **Rule:** `GET /api/summaries/current-month` calculates summary data on demand in the backend from normalized Expenses and Categories. No summary table, materialized view, background aggregation, or caching in the MVP. The response includes `monthStart`, `monthEnd`, `totalAmount`, `categoryBreakdown`, and `recentExpenses`.
+
+### AD-13 - Backend-Owned Summary Logic [ADOPTED]
+
+- **Binds:** Home summary, Recent Expenses, category breakdown
+- **Prevents:** frontend-side financial aggregation or divergent Current Month rules
+- **Rule:** Backend filters Expenses by `ExpenseDate` within the `Asia/Kolkata` current calendar month, groups by `CategoryId`, resolves Category names, returns nonzero categories ranked by amount descending, and returns Recent Expenses ordered by `ExpenseDate` descending then `CreatedAt` descending.
+
+### AD-14 - Validation and Error Contract [ADOPTED]
+
+- **Binds:** forms, API errors, data integrity
+- **Prevents:** trusting client validation and incompatible error handling conventions
+- **Rule:** Frontend performs immediate UX validation, but backend repeats required validation and is authoritative for data integrity/business rules. API errors use ASP.NET Core `ProblemDetails` and `ValidationProblemDetails` with appropriate HTTP status codes. No custom error envelope in the MVP.
+
+### AD-15 - Single-User No-Auth MVP [ADOPTED]
+
+- **Binds:** API, data model, service boundaries
+- **Prevents:** fake multi-user architecture without an identity mechanism
+- **Rule:** The MVP has no login, registration, sessions, authorization policies, User table, UserId columns, or hardcoded current user. Treat the locally running app as belonging to one user. Introduce authentication and user ownership later only with a real identity requirement.
+
+### AD-16 - Testing Strategy Is Architectural [ADOPTED]
+
+- **Binds:** implementation verification
+- **Prevents:** untested architectural boundaries and missed PostgreSQL-specific behavior
+- **Rule:** Backend unit tests cover business/domain rules. Backend integration tests cover API + EF Core + PostgreSQL behavior with Testcontainers PostgreSQL for persistence-sensitive scenarios. Frontend tests cover meaningful component/form validation and interactions. E2E tests stay few and cover critical user journeys. Do not target 100% coverage, and do not substitute SQLite/in-memory EF tests where PostgreSQL behavior matters.
+
+### AD-17 - Local Development Envelope [ADOPTED]
+
+- **Binds:** developer setup
+- **Prevents:** implementation stories assuming containerized local app infrastructure or hidden database mutation
+- **Rule:** PostgreSQL runs locally as an installed service/application. Frontend runs as a Vite dev process. Backend runs as an ASP.NET Core dev process. Backend config supports appsettings plus environment variables/user-secrets. EF Core migrations are committed and applied explicitly by developers; the app must not auto-run migrations on startup.
+
+## Consistency Conventions
+
+| Concern | Convention |
+| --- | --- |
+| Backend feature folders | `Features/Expenses`, `Features/Categories`, `Features/Summaries` only if a separate summary feature folder improves clarity. |
+| Backend contract names | Use operation-specific DTO names such as `CreateExpenseRequest`, `UpdateExpenseRequest`, `ExpenseResponse`, `CreateCategoryRequest`, `UpdateCategoryRequest`, `CategoryResponse`, `CurrentMonthSummaryResponse`. |
+| Frontend API types | Keep DTO types and API functions in `shared/api`; feature UI imports those types/functions rather than hand-shaping raw responses. |
+| Entity ids | Use backend-generated ids consistently across DTOs and entities; exact id type is [ASSUMPTION] `Guid` unless implementation selects a simpler numeric id before first migration. |
+| Amounts | Amounts are INR application-level values, represented as decimal/numeric with two decimal places. No per-expense currency. |
+| Dates | Dates are `YYYY-MM-DD`; timestamps are ISO 8601 UTC. |
+| Errors | Use `ProblemDetails` / `ValidationProblemDetails`; frontend maps field errors inline. |
+| Categories | Default Categories are seeded and protected. Custom Categories are mutable unless referenced by Expenses for delete. |
+
+## Stack
+
+| Name | Version |
+| --- | --- |
+| Node.js | 24.21.0 LTS |
+| React | 19.3 |
+| Vite | 8.3.0 |
+| TypeScript | 7.0.2 |
+| TanStack Query | 5.102.8 |
+| React Router | 8.4.0 |
+| ASP.NET Core / .NET | 10.0.12 LTS |
+| EF Core | 10.0.12 |
+| Npgsql.EntityFrameworkCore.PostgreSQL | 10.0.3 |
+| PostgreSQL | 18.6 |
+| Vitest | 5.0.1 |
+| React Testing Library | 16.3.3 |
+| Playwright Test | 1.63.0 |
+| Testcontainers.PostgreSql | 4.15.0 |
+
+## Structural Seed
+
+```text
+/
+  frontend/
+    src/
+      app/                  # routing, providers, layout composition
+      features/
+        expenses/           # Home, Review, Detail/Edit, expense forms/hooks
+        categories/         # category management and category selection
+      shared/
+        api/                # DTO types, HTTP client, API functions
+        ui/                 # reusable UI primitives only
+  backend/
+    Features/
+      Expenses/             # endpoints/controllers, DTOs, services for Expenses
+      Categories/           # endpoints/controllers, DTOs, services for Categories
+      Summaries/            # current-month endpoint/service if separated
+    Domain/                 # Expense, Category, domain/business rules
+    Data/                   # DbContext, EF configurations, migrations
+    Common/                 # cross-cutting helpers only when genuinely needed
+  tests/
+    backend-unit/
+    backend-integration/
+    e2e/
+```
+
+```mermaid
+erDiagram
+  CATEGORY ||--o{ EXPENSE : classifies
+  CATEGORY {
+    id Id
+    string Name
+    bool IsDefault
+    timestamptz CreatedAt
+    timestamptz UpdatedAt
+  }
+  EXPENSE {
+    id Id
+    numeric Amount
+    id CategoryId
+    date ExpenseDate
+    string Description
+    timestamptz CreatedAt
+    timestamptz UpdatedAt
+  }
+```
+
+```mermaid
+flowchart TD
+  LocalPG["Local PostgreSQL service"] <-->|connection string| API["ASP.NET Core Web API"]
+  API <-->|REST JSON DTOs| Web["Vite React TypeScript app"]
+  Dev["Developer"] -->|explicit dotnet ef database update| LocalPG
+  Dev -->|npm run dev| Web
+  Dev -->|dotnet run| API
+```
+
+## Capability -> Architecture Map
+
+| Capability / Area | Lives in | Governed by |
+| --- | --- | --- |
+| FR-1 to FR-4 Expense Recording | `features/expenses`, `Features/Expenses`, `Domain`, `Data` | AD-1, AD-3, AD-5, AD-6, AD-10, AD-11, AD-14 |
+| FR-5 to FR-8 Expense Review and Maintenance | `features/expenses`, `Features/Expenses`, `Data` | AD-4, AD-6, AD-7, AD-11, AD-14 |
+| FR-9 to FR-13 Category Management | `features/categories`, `Features/Categories`, `Domain`, `Data` | AD-8, AD-9, AD-14 |
+| FR-14 to FR-17 Current-Month Spending Summary | `features/expenses` Home summary, `Features/Summaries` or `Features/Expenses`, `Data` | AD-11, AD-12, AD-13 |
+| UX fast mobile-first capture | `features/expenses` form and Home layout | AD-4, AD-5, DESIGN/EXPERIENCE sources |
+| Single-user learning MVP | API/data model | AD-15, AD-17 |
+| Automated verification | test projects/suites | AD-16 |
+
+## Deferred
+
+| Deferred Decision | Revisit When |
+| --- | --- |
+| Production hosting, CI/CD, environment topology, and deployment automation | A deployment target becomes part of the learning or product goal. |
+| Authentication, authorization, User entity, and per-user data ownership | The product needs real login or multi-user use. |
+| Advanced observability beyond basic ASP.NET Core logging and frontend console/dev tooling | The app is prepared for shared/hosted use or production troubleshooting. |
+| Caching/materialized summaries/background aggregation | Measured performance on realistic data requires optimization. |
+| Docker/Docker Compose for local app development | Local installed PostgreSQL becomes a burden or team portability becomes a real need. |
+| Per-expense currency, exchange rates, imports, receipt/OCR, advanced analytics | A later PRD update expands the MVP scope. |
+| Exact id type | Before the first EF Core migration if `Guid` is not desired. |
diff --git a/_bmad-output/planning-artifacts/epics.md b/_bmad-output/planning-artifacts/epics.md
new file mode 100644
index 0000000..af48868
--- /dev/null
+++ b/_bmad-output/planning-artifacts/epics.md
@@ -0,0 +1,810 @@
+---
+stepsCompleted:
+  - step-01-validate-prerequisites
+  - step-02-design-epics
+  - step-03-create-stories
+  - step-04-final-validation
+inputDocuments:
+  - _bmad-output/planning-artifacts/briefs/brief-bmad-expense-tracker-2026-09-15/brief.md
+  - _bmad-output/planning-artifacts/prds/prd-bmad-expense-tracker-2026-09-15/prd.md
+  - _bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/DESIGN.md
+  - _bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/EXPERIENCE.md
+  - _bmad-output/planning-artifacts/architecture/architecture-bmad-expense-tracker-2026-09-15/ARCHITECTURE-SPINE.md
+  - _bmad-output/specs/spec-bmad-expense-tracker/SPEC.md
+---
+
+# bmad-expense-tracker - Epic Breakdown
+
+## Overview
+
+This document provides the complete epic and story breakdown for bmad-expense-tracker, decomposing the requirements from the Product Brief, PRD, UX Design and Experience spines, Architecture Spine, and canonical SPEC into implementable stories.
+
+## Requirements Inventory
+
+### Functional Requirements
+
+FR1: The user can create an Expense with amount, Category, date, and optional description; amounts display in INR (₹), and the MVP does not require or store per-expense currency.
+
+FR2: A new Expense defaults the date to today while keeping the date editable before saving.
+
+FR3: The system prevents saving an Expense until amount, Category, and date are valid, with understandable validation feedback.
+
+FR4: The common Expense entry path keeps recording under 30 seconds by requiring only amount entry, Category selection, and save when using the default date and no description; amount is first, Add Expense is prominent, and no unrelated navigation is required.
+
+FR5: The user can view Recent Expenses in a list ordered by Expense date descending with a stable same-date tie-breaker, and each row shows enough identifying information including amount, Category, date, and description when available or accessible.
+
+FR6: The user can view an individual Expense detail from a list or summary context; detail shows amount, Category, date, optional description, and access to edit/delete.
+
+FR7: The user can edit an existing Expense's amount, Category, date, or description; edit uses create validation, updates lists/summaries after save, and cancel leaves the Expense unchanged.
+
+FR8: The user can delete an existing Expense only after confirmation; confirm removes it from Recent Expenses and summaries, cancel leaves it unchanged, and the MVP does not provide undo, trash, archive, or recovery.
+
+FR9: The product provides immediately available Default Categories for Expense creation and editing, including everyday options such as Food, Transport, Shopping, Bills, Entertainment, Health, Education, and Other.
+
+FR10: The user can create a Custom Category with a valid user-provided name, and the created Category becomes available for Expense creation and editing.
+
+FR11: The user can rename an existing Custom Category with a valid name, preserving its association with existing Expenses.
+
+FR12: The user can delete a Custom Category only when it is unused; deletion of an in-use Custom Category is blocked with explanatory feedback and no automatic reassignment or orphaning.
+
+FR13: Default Categories are protected from deletion and inappropriate modification, remaining available for Expense creation and editing.
+
+FR14: The product shows total spending for the Current Month, including Expenses dated within the Current Month and excluding Expenses dated outside it.
+
+FR15: The product shows Current Month spending grouped by Category, including only Expenses dated within the Current Month, helping the user understand where money went without advanced analytics.
+
+FR16: The product shows Recent Expenses from the Current Month as part of the main spending-awareness experience, with enough information to identify each Expense.
+
+FR17: The Spending Summary updates after relevant Expense add, edit, and delete operations; the MVP excludes previous-month comparisons, percentage changes, trends, and month-over-month analytics.
+
+### NonFunctional Requirements
+
+NFR1: The application must be approachable, mobile-friendly, low-friction, and understandable without instructions, with the common Expense entry flow kept simple and quick.
+
+NFR2: Common screens and Expense save operations should feel responsive for the expected small personal dataset; production-scale load targets are not required.
+
+NFR3: Expense and Category operations must maintain consistent associations and accurate Spending Summaries; Category deletion must not leave stale, orphaned, or inconsistent data.
+
+NFR4: The interface must meet basic accessibility expectations: semantic structure, meaningful labels, keyboard access where applicable, associated validation feedback, comfortable touch targets, and sufficient usability for common assistive technologies.
+
+NFR5: The single-user learning MVP does not require real authentication, but it must avoid unnecessary exposure of Expense data, validate inputs, and follow reasonable basic web security practices.
+
+NFR6: Save, edit, and delete operations should provide visible success or failure feedback while preserving user context and entered data where applicable.
+
+NFR7: Amount values must be positive, may include up to 2 decimal places, display with INR (₹), and must not introduce per-expense currency, exchange rates, or currency conversion.
+
+NFR8: The MVP must preserve the narrow Record -> Review -> Understand scope and avoid features that slow Expense entry or broaden the product into full personal finance.
+
+NFR9: Verification must cover backend business rules, PostgreSQL-sensitive API/EF behavior, meaningful frontend form and interaction behavior, and a few critical E2E journeys without targeting 100 percent coverage.
+
+### Additional Requirements
+
+- Build the MVP as a React/Vite TypeScript frontend, ASP.NET Core Web API backend, and PostgreSQL database, keeping UI, API contracts, business rules, and persistence separately identifiable.
+- Organize the backend as one deployable ASP.NET Core Web API project with internal layers/folders for `Features/Expenses`, `Features/Categories`, optional `Features/Summaries`, `Domain`, `Data` or `Infrastructure`, and `Common` only when needed.
+- Keep endpoints/controllers thin; feature services coordinate validation, domain rules, and persistence; Domain must not depend on ASP.NET Core or EF Core; Data owns DbContext, EF configuration, migrations, and provider-specific persistence.
+- Organize frontend TypeScript code as `app`, `features/expenses`, `features/categories`, `shared/ui`, and `shared/api`; DTO types and API functions live in `shared/api` and raw backend shapes must not leak through UI components.
+- Use TanStack Query for API-backed server state and mutations; use React state/hooks for local UI state; use React Router for navigation; do not add Redux, Zustand, or another global client store.
+- Use explicit request/response DTOs for every endpoint; do not expose EF Core/domain entities directly through the public API.
+- Use resource-oriented REST endpoints for Expenses and Categories plus `GET /api/summaries/current-month`; do not introduce CQRS, MediatR, or another mediator framework.
+- Model Category as a first-class entity and Expense as storing `CategoryId`; do not snapshot Category name on Expense, so Category renames preserve existing Expense associations.
+- Seed Default Categories as protected database rows; block edit/delete of defaults and block deletion of Custom Categories referenced by Expenses using business rules and FK integrity.
+- Represent money with .NET `decimal` and PostgreSQL `numeric(12,2)`; floating-point monetary amounts and summaries are forbidden.
+- Store `ExpenseDate` as .NET `DateOnly` mapped to PostgreSQL `date`; store `CreatedAt`/`UpdatedAt` as UTC timestamps mapped to `timestamptz`; use `CreatedAt` as the same-date ordering tie-breaker.
+- Use fixed application timezone `Asia/Kolkata` for Current Month and "today" semantics; API dates use `YYYY-MM-DD`, and timestamps use ISO 8601.
+- Calculate Current Month summary on demand in the backend from normalized Expenses and Categories; do not use summary tables, materialized views, background aggregation, or caching in the MVP.
+- Backend summary logic filters by `ExpenseDate` within the Asia/Kolkata current calendar month, groups by `CategoryId`, resolves Category names, ranks nonzero Category breakdowns by amount descending, and returns Recent Expenses ordered by `ExpenseDate` descending then `CreatedAt` descending.
+- Frontend validation is immediate for UX, but backend validation is authoritative for data integrity and business rules; API errors use ASP.NET Core `ProblemDetails` and `ValidationProblemDetails`.
+- The MVP must have no login, registration, sessions, authorization policies, User table, UserId columns, or hardcoded current user.
+- PostgreSQL runs locally as an installed service/application; frontend runs as Vite dev process; backend runs as ASP.NET Core dev process; backend config supports appsettings plus environment variables/user-secrets.
+- EF Core migrations are committed and applied explicitly by developers; the app must not auto-run migrations on startup.
+- Backend unit tests cover business/domain rules; backend integration tests cover API + EF Core + PostgreSQL behavior with Testcontainers PostgreSQL for persistence-sensitive scenarios; frontend tests cover meaningful component/form validation and interactions; E2E tests cover critical user journeys.
+- The canonical SPEC and companion DESIGN, EXPERIENCE, and ARCHITECTURE-SPINE files are the complete preservation-validated contract for what to build, test, and validate.
+
+### UX Design Requirements
+
+UX-DR1: Implement the adopted visual tokens from DESIGN.md: warm off-white base surface, white raised surfaces, ink hierarchy, teal primary accent, semantic success/warning/danger colors, system UI typography, practical type scale, and specified spacing/radius values.
+
+UX-DR2: Maintain a clean, dependable utility aesthetic: readable hierarchy, minimal depth, no broad gradients, no decorative accent overuse, no dense fintech/dashboard feel, and no nested heavy card treatment for every section.
+
+UX-DR3: Implement a mobile-first responsive IA with Home, Review, and Categories destinations; Home is the default landing screen, Add Expense is not a separate navigation destination, and desktop preserves the same IA in a compact header or side navigation.
+
+UX-DR4: Home must show inline Add Expense first, then Current Month summary, then Recent Expenses on mobile; desktop uses two columns with Add Expense and Current Month summary in the left/main column and Recent Expenses in the right column, with Add Expense remaining visually primary.
+
+UX-DR5: Mobile navigation uses a bottom nav with Home, Review, and Categories; desktop adapts navigation without adding separate destinations.
+
+UX-DR6: The Add Expense form is compact and immediately visible; amount is first and visually primary, shows ₹ in or beside the field, uses mobile-optimized numeric input where supported, accepts positive amounts only, rejects zero/negative values, allows up to 2 decimal places, and validates before save.
+
+UX-DR7: Category selection in Add/Edit Expense uses directly visible wrapping Category chips for Default and Custom Categories with clear selected state, not a dropdown for the MVP.
+
+UX-DR8: Date is a visible compact field that defaults to today, remains easy to change, and clearly displays the selected date.
+
+UX-DR9: Description is visible after required fields, clearly optional, compact, visually secondary, and never blocks saving.
+
+UX-DR10: After a successful Expense save, show `Expense saved.`, reset the form for quick additional entry, and update Current Month summary and Recent Expenses.
+
+UX-DR11: Current Month total shows the total Expense amount for the Current Month using INR (₹) and updates after Expense add/edit/delete.
+
+UX-DR12: Category breakdown is ranked by Current Month spending amount highest first, shows every Category with nonzero Current Month spending, includes Category name, amount, and a simple horizontal bar, and does not hide lower-ranked Categories behind expand/collapse.
+
+UX-DR13: Home Recent Expenses shows exactly 5 Expenses ordered by Expense date descending then recorded time/CreatedAt descending; rows show amount, Category, date, and optional description as secondary text; row opens Expense Detail.
+
+UX-DR14: Expense Review shows all recorded Expenses in one simple scrollable list ordered by Expense date descending then recorded time/CreatedAt descending, using the same row structure as Home; no grouping, pagination, infinite scroll, search, filtering, sorting, or analytics in the MVP.
+
+UX-DR15: Expense rows open Expense Detail and do not show inline Edit/Delete controls directly.
+
+UX-DR16: Expense Detail is read-only and shows amount, Category, date, and optional description, with Edit and Delete actions.
+
+UX-DR17: Edit Expense uses the same form pattern as Add Expense, pre-populated with existing values; Save returns to Expense Detail, and Cancel/Back discards unsaved changes and returns without changing the Expense.
+
+UX-DR18: Delete confirmation is a simple accessible dialog with concise title/explanation, Cancel action, and visually destructive Delete action; Expense deletion copy indicates permanent removal; no undo/recovery is required.
+
+UX-DR19: Category Management has two sections: protected Default Categories with no edit/delete and Custom Categories with Add/Edit/Delete; Add/Edit uses a compact inline form on the Categories screen.
+
+UX-DR20: Empty states must follow EXPERIENCE.md: Home keeps Add Expense usable, shows INR 0 total with no fake bars, and uses `No expenses yet. Add your first one above.`; Review uses `No expenses recorded yet.` with a clear route back to Home; Custom Categories uses `No custom categories yet. Add one to get started.`
+
+UX-DR21: Success feedback uses compact transient toasts with specified copy for Expense saved/updated/deleted and Category added/updated/deleted.
+
+UX-DR22: Validation errors stay in context with concise inline feedback near the relevant field/action and do not rely on toasts for errors requiring user action; include specified copy such as `Enter an amount to save this expense.`
+
+UX-DR23: Operation failures keep the user in context, preserve entered data where applicable, and show concise actionable failure feedback near the relevant action or form area.
+
+UX-DR24: Category name cannot be empty, and validation feedback appears near the name field.
+
+UX-DR25: In-use Custom Category deletion is blocked before confirmation and explains `This category is used by existing expenses. Reassign those expenses before deleting it.`
+
+UX-DR26: Accessibility floor requires meaningful labels, associated validation feedback, keyboard access for applicable fields/buttons/navigation/chips/confirmation actions, reading-order focus flow, comfortable touch targets, and no reliance on color alone for selected/error/destructive states.
+
+### FR Coverage Map
+
+FR1: Epic 1 - Create expense with amount, category, date, optional description, and INR display.
+
+FR2: Epic 1 - Default new expense date to today while keeping it editable.
+
+FR3: Epic 1 - Validate required expense fields with understandable feedback.
+
+FR4: Epic 1 - Keep common expense entry fast, prominent, and free of unrelated navigation.
+
+FR5: Epic 2 - View recent expenses in a predictable, identifiable list.
+
+FR6: Epic 2 - View expense details from list or summary context.
+
+FR7: Epic 2 - Edit an existing expense and keep dependent views current.
+
+FR8: Epic 2 - Delete an expense only after confirmation.
+
+FR9: Epic 1 - Provide default categories immediately for expense creation and editing.
+
+FR10: Epic 3 - Create a valid custom category.
+
+FR11: Epic 3 - Rename a custom category while preserving expense associations.
+
+FR12: Epic 3 - Delete only unused custom categories and block in-use deletion.
+
+FR13: Epic 3 - Protect default categories from destructive modification.
+
+FR14: Epic 4 - Show total spending for the Current Month.
+
+FR15: Epic 4 - Show Current Month spending grouped by Category.
+
+FR16: Epic 4 - Show Current Month Recent Expenses.
+
+FR17: Epic 4 - Update spending summary after relevant expense changes.
+
+## Epic List
+
+### Epic 1: Fast Expense Capture with Starter Categories
+Users can open the app and quickly record an expense using amount, category, today's date, and optional description, with default categories available immediately.
+**FRs covered:** FR1, FR2, FR3, FR4, FR9
+
+### Epic 2: Expense Review and Maintenance
+Users can review recorded expenses, inspect one expense, correct mistakes, and delete an expense only after confirmation.
+**FRs covered:** FR5, FR6, FR7, FR8
+
+### Epic 3: Simple Category Management
+Users can manage custom categories while default categories remain protected and existing expense-category associations stay safe.
+**FRs covered:** FR10, FR11, FR12, FR13
+
+### Epic 4: Current-Month Spending Awareness
+Users can understand current-month spending from the main experience through total spending, category breakdown, and current-month recent expenses that stay fresh after changes.
+**FRs covered:** FR14, FR15, FR16, FR17
+
+## Epic 1: Fast Expense Capture with Starter Categories
+
+Users can open the app and quickly record an expense using amount, category, today's date, and optional description, with default categories available immediately.
+
+### Story 1.1: Open the Home Experience with Starter Categories
+
+As a single expense tracker user,
+I want the app to open to a usable Home screen with starter categories available,
+So that I can begin recording expenses without setup.
+
+**Requirements:** FR9, NFR1, NFR4, NFR5, UX-DR1, UX-DR2, UX-DR3, UX-DR4, UX-DR5, UX-DR7, UX-DR26, Architecture AD-1, AD-2, AD-4, AD-9, AD-15, AD-17
+
+**Acceptance Criteria:**
+
+**Given** the application is run locally in the MVP development envelope
+**When** the user opens the frontend
+**Then** Home is the default landing surface
+**And** the app exposes Home, Review, and Categories navigation without adding authentication, accounts, roles, permissions, User tables, UserId columns, sessions, or a hardcoded current user.
+
+**Given** the backend and database are initialized for local development
+**When** EF Core migrations are applied explicitly by the developer
+**Then** protected Default Categories are seeded as database rows
+**And** the starter set includes Food, Transport, Shopping, Bills, Entertainment, Health, Education, and Other.
+
+**Given** the user opens Home on a mobile-width viewport
+**When** the page renders
+**Then** the inline Add Expense form is visible first
+**And** the layout follows the mobile order Add Expense, Current Month summary, Recent Expenses.
+
+**Given** the user opens Home on a desktop-width viewport
+**When** the page renders
+**Then** Home uses two columns with Add Expense and Current Month summary in the left/main column and Recent Expenses in the right column
+**And** desktop navigation preserves the same Home, Review, and Categories information architecture.
+
+**Given** frontend and backend code are created for this story
+**When** the implementation is reviewed
+**Then** frontend code is organized under `app`, `features/expenses`, `features/categories`, `shared/ui`, and `shared/api`
+**And** backend code is organized as one ASP.NET Core Web API project with feature folders, Domain, Data or Infrastructure, and only genuinely needed Common helpers.
+
+**Given** Default Categories are loaded for the Add Expense form
+**When** the user views category choices
+**Then** categories are shown as tappable wrapping chips with a clear selected state
+**And** no dropdown is used for MVP category selection.
+
+**Given** the UI renders shared surfaces and controls
+**When** visual styles are inspected
+**Then** the adopted DESIGN.md tokens are used for base/raised surfaces, ink hierarchy, teal primary accent, semantic colors, system typography, spacing, and radius
+**And** the interface avoids broad gradients, decorative accent overuse, dense dashboard styling, and nested heavy card treatment.
+
+**Given** the app shell and category foundation are implemented
+**When** tests are run
+**Then** frontend tests cover navigation/rendering of the Home shell and category chip availability
+**And** backend integration tests cover seeded Default Categories against PostgreSQL behavior.
+
+### Story 1.2: Create an Expense End-to-End
+
+As a single expense tracker user,
+I want to save an expense with only amount, category, and date required,
+So that I can capture everyday spending before I forget it.
+
+**Requirements:** FR1, FR2, FR4, NFR1, NFR2, NFR7, UX-DR6, UX-DR7, UX-DR8, UX-DR9, UX-DR10, Architecture AD-3, AD-5, AD-6, AD-7, AD-10, AD-11
+
+**Acceptance Criteria:**
+
+**Given** the user is on Home and Default Categories are available
+**When** the user enters a positive amount, selects a Category, keeps today's default date, optionally leaves description empty, and saves
+**Then** a new Expense is persisted
+**And** the saved Expense contains amount, Category, date, and description only when provided.
+
+**Given** the Add Expense form is ready for input
+**When** the form renders
+**Then** amount is the first required entry field and receives primary visual emphasis
+**And** the amount control displays the INR symbol `₹` in or beside the field.
+
+**Given** the user starts a new Expense
+**When** the form initializes the date
+**Then** the date defaults to today's date using the fixed application timezone `Asia/Kolkata`
+**And** the date remains visible, compact, editable, and displayed as the selected date.
+
+**Given** the user records a normal Expense using the default date and no description
+**When** they complete the common path
+**Then** the path requires only amount entry, Category chip selection, and Save
+**And** no unrelated screen navigation is required.
+
+**Given** the backend receives a create Expense request
+**When** amount, CategoryId, and ExpenseDate are valid
+**Then** the API creates the Expense through explicit request/response DTOs
+**And** it does not expose EF Core or domain entities directly.
+
+**Given** the Expense is persisted
+**When** the database row is inspected
+**Then** amount uses .NET `decimal` and PostgreSQL `numeric(12,2)`
+**And** ExpenseDate uses .NET `DateOnly` mapped to PostgreSQL `date`
+**And** CreatedAt and UpdatedAt are UTC `timestamptz` values.
+
+**Given** currency handling is inspected
+**When** an Expense is created or displayed
+**Then** amounts display as INR (₹)
+**And** the MVP does not store per-expense currency, exchange rates, conversion, or currency selection.
+
+**Given** the Expense creation succeeds
+**When** the API response is returned to the frontend
+**Then** TanStack Query updates or invalidates relevant expense/category-backed server state
+**And** React local state resets the Add Expense form for fast additional entry.
+
+**Given** this story is implemented
+**When** tests are run
+**Then** backend unit or integration tests cover valid Expense creation, DTO mapping, decimal/date persistence, and no floating-point monetary use
+**And** frontend tests cover successful Add Expense submission with optional description omitted.
+
+### Story 1.3: Validate Fast Expense Capture with Clear Feedback
+
+As a single expense tracker user,
+I want clear validation and feedback while recording an expense,
+So that I can fix mistakes quickly without losing context.
+
+**Requirements:** FR3, FR4, NFR4, NFR6, NFR9, UX-DR21, UX-DR22, UX-DR23, UX-DR26, Architecture AD-14, AD-16
+
+**Acceptance Criteria:**
+
+**Given** the user attempts to save an Expense without an amount
+**When** frontend validation runs
+**Then** saving is prevented
+**And** inline feedback near the amount field says `Enter an amount to save this expense.`
+
+**Given** the user enters an amount
+**When** the amount is zero, negative, non-numeric, or has more than 2 decimal places
+**Then** saving is prevented
+**And** the feedback is understandable to a user with basic-to-moderate software comfort.
+
+**Given** the user attempts to save without a selected Category
+**When** validation runs
+**Then** saving is prevented
+**And** inline feedback explains that a Category is required.
+
+**Given** the user attempts to save without a valid date
+**When** validation runs
+**Then** saving is prevented
+**And** inline feedback explains that a valid date is required.
+
+**Given** a create request reaches the backend
+**When** required fields or business rules are invalid
+**Then** the backend repeats validation authoritatively
+**And** returns ASP.NET Core `ValidationProblemDetails` or `ProblemDetails` with an appropriate HTTP status code.
+
+**Given** a valid save fails due to an operation failure
+**When** the failure is shown to the user
+**Then** the user remains in the Add Expense context
+**And** entered data is preserved where applicable
+**And** concise actionable failure feedback appears near the relevant action or form area.
+
+**Given** a valid save succeeds
+**When** the Expense is created
+**Then** compact transient feedback says `Expense saved.`
+**And** the form resets for quick additional entry.
+
+**Given** the Add Expense form is used with keyboard or assistive technology
+**When** the user tabs through fields, Category chips, validation messages, and Save
+**Then** focus follows reading order
+**And** controls have meaningful labels
+**And** validation feedback is associated with the relevant fields
+**And** selected/error/destructive states do not rely on color alone.
+
+**Given** this story is implemented
+**When** verification is performed
+**Then** frontend component tests cover required-field, amount, category, and date validation
+**And** backend tests cover invalid create requests and ProblemDetails/ValidationProblemDetails responses.
+
+## Epic 2: Expense Review and Maintenance
+
+Users can review recorded expenses, inspect one expense, correct mistakes, and delete an expense only after confirmation.
+
+### Story 2.1: Review Recorded Expenses
+
+As a single expense tracker user,
+I want to review recently recorded and all recorded expenses,
+So that I can confirm what I captured and when.
+
+**Requirements:** FR5, NFR1, NFR2, NFR4, UX-DR13, UX-DR14, UX-DR15, UX-DR20, Architecture AD-4, AD-5, AD-6, AD-7, AD-11, AD-16
+
+**Acceptance Criteria:**
+
+**Given** Expenses exist in the system
+**When** the user opens Home
+**Then** Recent Expenses are shown as clean rows containing amount, Category, date, and optional description as secondary text when present
+**And** each row opens Expense Detail.
+
+**Given** more than 5 Expenses exist
+**When** Home renders Recent Expenses
+**Then** Home shows exactly 5 Expenses
+**And** they are ordered by ExpenseDate descending then CreatedAt descending as the stable same-date tie-breaker.
+
+**Given** Expenses exist across any dates
+**When** the user opens Review
+**Then** Review shows all recorded Expenses in one simple scrollable list
+**And** the list uses the same row structure and ordering as Home.
+
+**Given** the user is on Review
+**When** the list renders
+**Then** the MVP does not provide grouping, pagination, infinite scroll, search, filtering, sorting, chart exploration, or analytics.
+
+**Given** no Expenses exist
+**When** Home renders
+**Then** the Add Expense form remains visible and usable
+**And** Recent Expenses shows `No expenses yet. Add your first one above.`
+
+**Given** no Expenses exist
+**When** Review renders
+**Then** Review shows `No expenses recorded yet.`
+**And** provides a clear route back to Home.
+
+**Given** expenses are retrieved from the API
+**When** the implementation is reviewed
+**Then** the frontend imports typed DTOs and API functions from `shared/api`
+**And** TanStack Query owns the server state for Expense lists.
+
+**Given** this story is implemented
+**When** tests are run
+**Then** backend tests cover ordered expense retrieval
+**And** frontend tests cover Home recent limit, Review all-expense rendering, empty states, and row navigation affordance.
+
+### Story 2.2: View and Edit Expense Details
+
+As a single expense tracker user,
+I want to inspect and edit a recorded expense,
+So that I can correct mistakes in amount, category, date, or description.
+
+**Requirements:** FR6, FR7, NFR3, NFR4, NFR6, NFR7, UX-DR15, UX-DR16, UX-DR17, UX-DR21, UX-DR22, UX-DR23, Architecture AD-5, AD-6, AD-7, AD-10, AD-11, AD-14, AD-16
+
+**Acceptance Criteria:**
+
+**Given** the user opens an Expense row from Home or Review
+**When** Expense Detail renders
+**Then** it shows amount, Category, date, and description when provided
+**And** it is read-only by default.
+
+**Given** the user is on Expense Detail
+**When** they inspect available actions
+**Then** Edit and Delete actions are available from the detail surface
+**And** list rows themselves do not show inline Edit/Delete controls.
+
+**Given** the user chooses Edit
+**When** the Edit Expense form opens
+**Then** it uses the same Expense form pattern as Add Expense
+**And** amount, Category chip selection, date, and optional description are pre-populated from the existing Expense.
+
+**Given** the user edits amount, Category, date, or description with valid values
+**When** they save
+**Then** the Expense is updated through an explicit update DTO
+**And** the user returns to Expense Detail
+**And** compact transient feedback says `Expense updated.`
+
+**Given** the user edits an Expense
+**When** required fields or amount rules are invalid
+**Then** the same frontend and backend validation rules from Expense creation apply
+**And** invalid backend requests return `ValidationProblemDetails` or `ProblemDetails`.
+
+**Given** the user is editing an Expense
+**When** they choose Cancel or Back
+**Then** unsaved changes are discarded
+**And** the user returns to Expense Detail without changing the Expense.
+
+**Given** an update succeeds
+**When** Home, Review, Expense Detail, or relevant server state is viewed
+**Then** the changed amount, Category, date, or description is reflected consistently
+**And** stale list data is not shown after completion.
+
+**Given** this story is implemented
+**When** tests are run
+**Then** backend tests cover valid and invalid Expense updates
+**And** frontend tests cover detail rendering, pre-populated edit form behavior, save, cancel, and validation feedback.
+
+### Story 2.3: Delete an Expense with Confirmation
+
+As a single expense tracker user,
+I want to delete an expense only after confirming,
+So that accidental destructive changes are less likely.
+
+**Requirements:** FR8, NFR3, NFR4, NFR6, UX-DR18, UX-DR21, UX-DR23, UX-DR26, Architecture AD-5, AD-6, AD-7, AD-14, AD-16
+
+**Acceptance Criteria:**
+
+**Given** the user is on Expense Detail
+**When** they choose Delete
+**Then** an accessible confirmation dialog appears before deletion
+**And** the dialog includes a concise title/explanation, a Cancel action, and a visually destructive Delete action.
+
+**Given** the delete confirmation is open
+**When** the user cancels
+**Then** the dialog closes
+**And** the Expense remains unchanged and visible.
+
+**Given** the delete confirmation is open
+**When** the user confirms deletion
+**Then** the Expense is deleted through the API
+**And** compact transient feedback says `Expense deleted.`
+
+**Given** an Expense is deleted
+**When** the user returns to Home or Review
+**Then** the deleted Expense no longer appears in Recent Expenses or Review
+**And** relevant server state is invalidated or refreshed.
+
+**Given** the MVP delete behavior is inspected
+**When** an Expense is deleted
+**Then** no undo, trash, archive, recovery, or soft-delete recovery workflow is required.
+
+**Given** a valid delete request fails
+**When** the failure is shown
+**Then** the user remains in context
+**And** concise actionable failure feedback appears near the relevant action or dialog area.
+
+**Given** the confirmation dialog is used with keyboard or assistive technology
+**When** the dialog opens
+**Then** focus is managed into the dialog
+**And** Cancel/Delete actions are keyboard accessible
+**And** destructive state is not conveyed by color alone.
+
+**Given** this story is implemented
+**When** tests are run
+**Then** backend tests cover Expense deletion and not-found/error cases
+**And** frontend tests cover confirm, cancel, success feedback, and list refresh behavior.
+
+## Epic 3: Simple Category Management
+
+Users can manage custom categories while default categories remain protected and existing expense-category associations stay safe.
+
+### Story 3.1: View Categories and Create a Custom Category
+
+As a single expense tracker user,
+I want to view default categories and add a custom category,
+So that category choices can reflect my spending while still being simple.
+
+**Requirements:** FR10, FR13, NFR1, NFR3, NFR4, NFR6, UX-DR19, UX-DR20, UX-DR21, UX-DR24, Architecture AD-5, AD-6, AD-7, AD-8, AD-9, AD-14, AD-16
+
+**Acceptance Criteria:**
+
+**Given** the user opens Categories
+**When** the page renders
+**Then** it shows two sections: Default Categories and Custom Categories
+**And** Default Categories are shown as protected with no edit/delete controls.
+
+**Given** the user has no Custom Categories
+**When** the Custom Categories section renders
+**Then** it shows `No custom categories yet. Add one to get started.`
+
+**Given** the user enters a valid Custom Category name
+**When** they save through the compact inline Categories form
+**Then** the Custom Category is persisted
+**And** compact transient feedback says `Category added.`
+
+**Given** a Custom Category is created
+**When** the user opens Add Expense or Edit Expense
+**Then** the new Custom Category is available as a Category chip
+**And** it uses the same selection behavior as Default Categories.
+
+**Given** the user attempts to save a Custom Category with an empty name
+**When** validation runs
+**Then** saving is prevented
+**And** inline feedback appears near the name field.
+
+**Given** a create Category request reaches the backend
+**When** the name is valid
+**Then** the API uses explicit Category DTOs
+**And** the created Category is marked as custom rather than default.
+
+**Given** this story is implemented
+**When** tests are run
+**Then** backend tests cover Custom Category creation and empty-name validation
+**And** frontend tests cover Categories section rendering, empty state, inline creation, validation, and chip availability in Expense forms.
+
+### Story 3.2: Rename a Custom Category Safely
+
+As a single expense tracker user,
+I want to rename a custom category,
+So that my category labels stay useful without losing existing expense history.
+
+**Requirements:** FR11, FR13, NFR3, NFR4, NFR6, UX-DR19, UX-DR21, UX-DR24, Architecture AD-6, AD-7, AD-8, AD-9, AD-14, AD-16
+
+**Acceptance Criteria:**
+
+**Given** a Custom Category exists
+**When** the user edits its name through the compact inline Categories form
+**Then** the Category name is updated
+**And** compact transient feedback says `Category updated.`
+
+**Given** the renamed Custom Category is associated with existing Expenses
+**When** the rename succeeds
+**Then** existing Expenses remain associated with the same CategoryId
+**And** those Expenses display the updated Category name.
+
+**Given** the Category data model is inspected
+**When** Expenses are persisted
+**Then** Expense stores CategoryId as a foreign key
+**And** Expense does not snapshot Category name.
+
+**Given** the user attempts to rename a Custom Category to an empty name
+**When** validation runs
+**Then** saving is prevented
+**And** inline feedback appears near the name field.
+
+**Given** a Default Category exists
+**When** the user views the Default Categories section
+**Then** no rename control is available for that Default Category in the MVP.
+
+**Given** an update Category request reaches the backend
+**When** the Category is custom and the name is valid
+**Then** the API updates the Category through an explicit update DTO
+**And** backend validation prevents inappropriate Default Category modification.
+
+**Given** this story is implemented
+**When** tests are run
+**Then** backend tests cover Custom Category rename, empty-name rejection, default modification rejection, and preserved Expense associations
+**And** frontend tests cover rename success, validation feedback, and protected Default Category rendering.
+
+### Story 3.3: Delete Only Unused Custom Categories
+
+As a single expense tracker user,
+I want category deletion to be allowed only when safe,
+So that existing expenses are not orphaned or silently reassigned.
+
+**Requirements:** FR12, FR13, NFR3, NFR4, NFR6, UX-DR18, UX-DR19, UX-DR21, UX-DR23, UX-DR25, UX-DR26, Architecture AD-6, AD-7, AD-8, AD-9, AD-14, AD-16
+
+**Acceptance Criteria:**
+
+**Given** a Custom Category has no associated Expenses
+**When** the user initiates deletion
+**Then** an accessible confirmation dialog appears
+**And** the dialog includes a Cancel action and visually destructive Delete action.
+
+**Given** the unused Custom Category delete confirmation is open
+**When** the user confirms deletion
+**Then** the Category is deleted
+**And** compact transient feedback says `Category deleted.`
+**And** the Category is no longer available in Add/Edit Expense Category chips.
+
+**Given** the unused Custom Category delete confirmation is open
+**When** the user cancels
+**Then** the Category remains unchanged.
+
+**Given** a Custom Category is associated with one or more Expenses
+**When** the user attempts deletion
+**Then** deletion is blocked before confirmation
+**And** feedback says `This category is used by existing expenses. Reassign those expenses before deleting it.`
+
+**Given** an in-use Custom Category deletion is blocked
+**When** backend behavior is inspected
+**Then** business rules and foreign-key integrity prevent deletion
+**And** the product does not automatically reassign Expenses or create orphaned Expense records.
+
+**Given** a Default Category exists
+**When** the user views or attempts category maintenance
+**Then** Default Categories cannot be deleted
+**And** they remain available for Expense creation and editing.
+
+**Given** this story is implemented
+**When** tests are run
+**Then** backend tests cover unused Custom Category deletion, in-use deletion blocking, Default Category deletion blocking, and FK integrity
+**And** frontend tests cover confirmation, cancel, blocked feedback, success feedback, and chip removal after successful deletion.
+
+## Epic 4: Current-Month Spending Awareness
+
+Users can understand current-month spending from the main experience through total spending, category breakdown, and current-month recent expenses that stay fresh after changes.
+
+### Story 4.1: Calculate Current-Month Summary on Demand
+
+As a single expense tracker user,
+I want current-month spending calculated consistently,
+So that totals and category amounts are accurate and trustworthy.
+
+**Requirements:** FR14, FR15, FR16, NFR2, NFR3, NFR7, NFR9, Architecture AD-6, AD-7, AD-10, AD-11, AD-12, AD-13, AD-16
+
+**Acceptance Criteria:**
+
+**Given** Expenses exist inside and outside the current calendar month
+**When** the frontend calls `GET /api/summaries/current-month`
+**Then** the backend calculates the summary on demand from normalized Expenses and Categories
+**And** no summary table, materialized view, background aggregation, or caching is introduced for the MVP.
+
+**Given** the backend calculates the Current Month
+**When** date boundaries are determined
+**Then** the fixed application timezone `Asia/Kolkata` is used
+**And** the response includes `monthStart` and `monthEnd` using `YYYY-MM-DD`.
+
+**Given** the summary includes total spending
+**When** Expenses are dated within the Current Month
+**Then** their amounts are included in `totalAmount`
+**And** Expenses dated outside the Current Month are excluded.
+
+**Given** the summary includes category breakdown
+**When** Current Month Expenses are grouped
+**Then** grouping is by CategoryId
+**And** Category names are resolved from Category rows
+**And** only Categories with nonzero Current Month spending are returned
+**And** breakdown items are ranked by amount descending.
+
+**Given** the summary includes recent expenses
+**When** Current Month Recent Expenses are returned
+**Then** only Expenses dated within the Current Month are included
+**And** they are ordered by ExpenseDate descending then CreatedAt descending.
+
+**Given** summary API contracts are inspected
+**When** implementation is reviewed
+**Then** `CurrentMonthSummaryResponse` and related nested DTOs are explicit API contracts
+**And** EF/domain entities are not exposed directly.
+
+**Given** this story is implemented
+**When** tests are run
+**Then** backend integration tests cover PostgreSQL-backed current-month filtering, category grouping, decimal totals, ordering, and Asia/Kolkata boundary behavior.
+
+### Story 4.2: Show Current-Month Total, Category Breakdown, and Recent Expenses on Home
+
+As a single expense tracker user,
+I want the Home screen to show current-month total, category breakdown, and recent expenses,
+So that I can understand where my money went this month without opening analytics.
+
+**Requirements:** FR14, FR15, FR16, NFR1, NFR4, NFR8, UX-DR4, UX-DR11, UX-DR12, UX-DR13, UX-DR20, UX-DR26, Architecture AD-4, AD-5, AD-13
+
+**Acceptance Criteria:**
+
+**Given** the user opens Home
+**When** the Current Month summary renders
+**Then** total spending is displayed using INR (₹)
+**And** it answers "How much did I spend this month?" from the main experience.
+
+**Given** Current Month category spending exists
+**When** the Category breakdown renders
+**Then** every nonzero Category is shown
+**And** each item includes Category name, amount, and a simple horizontal bar
+**And** items are ranked highest spending first.
+
+**Given** many nonzero Categories exist
+**When** the Category breakdown renders
+**Then** lower-ranked Categories are not hidden behind expand/collapse in the MVP
+**And** no donut/pie chart or multiple chart types are introduced.
+
+**Given** no Current Month Expenses exist
+**When** Home renders
+**Then** Current Month total visibly shows INR 0
+**And** the Category breakdown uses empty copy instead of fake bars
+**And** the Add Expense form remains fully visible and usable.
+
+**Given** Current Month Recent Expenses exist
+**When** Home renders the summary context
+**Then** Recent Expenses include amount, Category, date, and optional description as secondary text
+**And** rows open Expense Detail.
+
+**Given** the Home layout is inspected on mobile
+**When** content renders
+**Then** Add Expense remains first, followed by Current Month summary and Recent Expenses
+**And** common form controls are usable at common mobile widths.
+
+**Given** the Home UI is inspected for accessibility
+**When** users navigate with keyboard or assistive technology
+**Then** summary content uses semantic structure
+**And** visual bars do not rely on color alone to convey meaning.
+
+**Given** this story is implemented
+**When** tests are run
+**Then** frontend tests cover total, ranked breakdown, zero state, no fake bars, Recent Expense row content, and responsive ordering expectations where practical.
+
+### Story 4.3: Keep Spending Awareness Fresh After Expense Changes
+
+As a single expense tracker user,
+I want summaries and recent lists to update after expense changes,
+So that the main experience never gives me stale spending information.
+
+**Requirements:** FR17, NFR2, NFR3, NFR6, NFR8, NFR9, UX-DR10, UX-DR11, UX-DR21, UX-DR23, Architecture AD-5, AD-12, AD-13, AD-16
+
+**Acceptance Criteria:**
+
+**Given** the user adds an Expense dated within the Current Month
+**When** the create operation succeeds
+**Then** Current Month total, Category breakdown, and Current Month Recent Expenses update to include it.
+
+**Given** the user adds an Expense dated outside the Current Month
+**When** the create operation succeeds
+**Then** Current Month total and Category breakdown do not include it
+**And** it is not required to appear in Current Month Recent Expenses.
+
+**Given** the user edits an Expense amount, Category, date, or description
+**When** the update succeeds
+**Then** affected list rows, Expense Detail, Current Month total, Category breakdown, and Current Month Recent Expenses reflect the change consistently.
+
+**Given** the user deletes an Expense included in the Current Month summary
+**When** deletion succeeds
+**Then** Current Month total, Category breakdown, and Current Month Recent Expenses update to remove it.
+
+**Given** TanStack Query manages server state
+**When** create, update, or delete mutations succeed
+**Then** relevant expenses, categories, and current-month summary queries are invalidated or updated
+**And** no Redux, Zustand, or additional global client store is introduced.
+
+**Given** the MVP scope is inspected
+**When** summary freshness is implemented
+**Then** previous-month comparisons, percentage changes, trends, month-over-month analytics, search/filter/sort-heavy review, and advanced analytics remain out of scope.
+
+**Given** this story is implemented
+**When** end-to-end verification is performed
+**Then** at least one critical E2E journey covers recording an Expense and seeing the Home summary/list update
+**And** meaningful frontend/backend tests cover summary freshness after create, update, and delete.
diff --git a/_bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/.memlog.md b/_bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/.memlog.md
new file mode 100644
index 0000000..801f974
--- /dev/null
+++ b/_bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/.memlog.md
@@ -0,0 +1,64 @@
+---
+topic: bmad-expense-tracker UX
+updated: 2026-09-15T20:16
+---
+
+- (decision) Create UX spines in coaching mode using finalized PRD as primary source: _bmad-output/planning-artifacts/prds/prd-bmad-expense-tracker-2026-09-15/prd.md.
+- (decision) Mobile first-screen layout must prioritize quick entry and must not force the user to scroll through a large dashboard before recording an Expense.
+- (decision) Mobile first-screen layout must prioritize quick entry and must not force the user to scroll through a large dashboard before recording an Expense.
+- (decision) Main screen shows 5 Recent Expenses by default: enough recent context to catch mistakes while keeping first screen compact and capture-focused.
+- (decision) Main-screen Recent Expenses are ordered by most recently recorded first; main screen must not become a full Expense browser.
+- (decision) Expense Review screen is a simple list ordered by most recently recorded/dated first, with access to Expense detail/edit/delete; advanced search, filtering, sorting, pagination, and analytics are out of MVP unless later UX decision proves need.
+- (decision) Expense Review screen is a simple list ordered by most recently recorded/dated first, with access to Expense detail/edit/delete; advanced search, filtering, sorting, pagination, and analytics are out of MVP unless later UX decision proves need.
+- (decision) Approved IA surfaces: Home, Expense Review, Expense Detail, and Category Management.
+- (decision) Category Management is its own lightweight screen, not hidden inside Add/Edit Expense, to keep fast capture simple while allowing independent Custom Category create/edit/delete and Default Category protection.
+- (decision) Form factor is mobile-first responsive web app: phone-first for immediate post-purchase entry, desktop fully supported through same responsive IA without separate experiences.
+- (decision) Navigation should be compact for the small MVP surface set, prioritize Home/Add Expense and Expense Review, keep Category Management reachable via main or secondary navigation, and avoid complex navigation patterns.
+- (decision) Home uses compact inline quick-entry form at top, immediately visible on open, with amount field as primary visual focus; no extra dialogs, steps, or navigation for normal Expense entry.
+- (decision) Add Expense fields: amount primary, Category required, date defaults to today and remains easy to change, description optional, Save prominent; after save the form resets for quick additional entry.
+- (decision) Add/Edit Expense uses visible tappable Category chips for Default and Custom Categories; chips are compact, responsive, wrap on mobile, have clear selected state, and no dropdown/More interaction in MVP unless category count later makes chips impractical.
+- (decision) Current Month Category breakdown uses compact ranked list with simple horizontal bars, highest spending first, showing Category name and total amount; only Categories with Current Month spending appear; no donut/pie chart or combined chart/list in MVP.
+- (decision) Home Spending Summary updates after Expense add/edit/delete and remains compact/readable on mobile.
+- (decision) Expense rows in Recent Expenses and Expense Review show Amount, Category, Date, and optional Description as secondary text; row opens Expense Detail; Edit/Delete actions appear only in Expense Detail, not list rows.
+- (decision) Delete is initiated from Expense Detail and requires explicit confirmation before removal; lists remain visually clean and scan-friendly on mobile.
+- (decision) Expense Detail is read-only showing Amount, Category, Date, and optional Description; Edit action opens pre-populated Expense form using same pattern as Add Expense; saving returns to Expense Detail.
+- (decision) Do not use inline editable fields in Expense Detail; Delete is available on Expense Detail and requires explicit confirmation; interaction remains consistent across mobile and desktop.
+- (decision) Category Management uses two sections: Default Categories shown as protected with no edit/delete actions, and Custom Categories with Add/Edit/Delete actions.
+- (decision) Deleting a Custom Category used by Expenses is blocked with clear explanation; Category Management stays simple/mobile-scannable with no nested categories, rules, automatic categorization, or advanced category features.
+- (decision) Mobile navigation uses bottom navigation with Home, Review, and Categories; Home is default landing screen; Add Expense remains primary interaction on Home, not a separate navigation destination.
+- (decision) Desktop adapts same Home/Review/Categories IA into compact header or side navigation as appropriate; no separate desktop destinations or divergent navigation structure.
+- (decision) Voice and feedback are friendly but restrained: clear, approachable, concise, actionable, not playful or overly conversational; avoid jokes and overly casual financial language.
+- (decision) Core microcopy examples: 'Expense saved.', 'Enter an amount to save this expense.', 'No expenses yet. Add your first one above.', 'No expenses recorded yet.', 'No custom categories yet. Add one to get started.', and blocked category deletion message.
+- (decision) Visual direction is clean utility with subtle warmth: crisp, trustworthy, readable, fast-scanning, strong hierarchy, generous spacing, minimal decoration, restrained emphasis for Add Expense/Save/Current Month total, and accessible typography/contrast across mobile and desktop.
+- (decision) Avoid heavy fintech/dashboard aesthetic, excessive cards, gradients, illustrations, animations, decorative graphics, and visual effects; interface should feel like simple dependable personal utility.
+- (decision) Palette uses teal as primary accent for primary actions, selected navigation, important interactive elements, and key emphasis; neutral grays for text/borders/supporting UI; subtle warm off-white backgrounds where appropriate.
+- (decision) Semantic colors green/amber/red are used only for success/warning/destructive meaning; accent colors are not decorative or excessive; all text, controls, and states maintain sufficient contrast.
+- (change) Drafted initial DESIGN.md and EXPERIENCE.md sections from captured coaching decisions: visual tokens, brand/style, IA, voice, component patterns, state patterns, interactions, accessibility floor, and key flows.
+- (decision) Mobile Home shows Current Month total followed by all nonzero Categories ranked by spending with simple horizontal bars; no expand/collapse or hiding lower-ranked Categories in MVP; Recent Expenses remain below summary.
+- (change) Updated EXPERIENCE.md Home/category breakdown behavior to show all nonzero Current Month Categories ranked by spending, no expand/collapse, with Recent Expenses below summary.
+- (decision) Expense Review MVP uses one simple scrollable list of all recorded Expenses, ordered most recently recorded/dated first, consistent with Home rows; no grouping, pagination, infinite scroll, search, filtering, or sorting; assumes small personal dataset.
+- (change) Updated EXPERIENCE.md Expense Review to specify one simple scrollable all-Expense list, same row pattern as Home, and no grouping/pagination/search/filter/sort in MVP.
+- (decision) Successful create/update/delete actions use compact transient toast feedback that does not interrupt flow; validation and blocking errors appear inline near relevant field/action and are clear/actionable; avoid success dialogs/screens.
+- (change) Updated EXPERIENCE.md voice/state patterns with compact success toast copy and inline validation/blocking error behavior.
+- (decision) Empty Home keeps inline Add Expense form fully visible and immediately usable; no onboarding flow, intro screen, or sample/demo Expenses; summary/recent areas show concise empty states within normal Home structure.
+- (change) Updated EXPERIENCE.md Empty Home state: quick-entry remains visible, no onboarding/demo data, summary/recent use concise empty states.
+- (decision) Add/Edit Expense forms include visible compact date field, defaulting to today for new Expenses, easy to change, visually secondary to Amount/Category, using native/browser date picker where available; date is not hidden behind More/advanced.
+- (change) Updated EXPERIENCE.md Add/Edit Expense form pattern to include visible compact date field with clear selected date and native/browser picker where available.
+- (decision) Description is visible in Add/Edit forms after Amount, Category, and Date; clearly optional, visually secondary, compact, no reveal tap, and no character-count-heavy or advanced text behavior in MVP.
+- (change) Updated EXPERIENCE.md Add/Edit form pattern so Description is visible after required fields, optional, compact, and visually secondary.
+- (decision) Expense deletion and eligible Custom Category deletion use the same accessible simple confirmation dialog with concise title/explanation, Cancel and destructive Delete actions; no inline or separate mobile/desktop patterns.
+- (decision) Expense delete dialog indicates permanent removal; Custom Category delete confirmation appears only when category is eligible, while in-use categories are blocked before confirmation with explanation.
+- (change) Updated DESIGN.md/EXPERIENCE.md for shared accessible delete confirmation dialog, destructive button token, permanent Expense deletion copy, and pre-confirmation block for in-use Custom Categories.
+- (decision) Custom Category add/edit uses compact inline form on Categories screen with category name and Save/Add action; validate non-empty name; no extra fields/config; save updates Custom Categories and shows toast; cancel edit leaves category unchanged.
+- (change) Updated EXPERIENCE.md Category Management with inline Add/Edit Category form, non-empty validation, success toast, cancel behavior, and updated category flow.
+- (decision) Amount input shows ₹/INR prefix or symbol, is first and most visually prominent, uses mobile-optimized numeric input where supported, accepts positive amounts only, rejects zero/negative, allows up to 2 decimal places, and validates inline before save.
+- (change) Updated DESIGN.md and EXPERIENCE.md with Amount input token/pattern: ₹ prefix, mobile numeric input, positive-only validation, max 2 decimals, inline errors.
+- (decision) Desktop Home uses two-column layout: left/main column contains Add Expense and Current Month summary; right column contains Recent Expenses; Add Expense remains strongest priority; smaller screens collapse to single-column mobile layout; no three-column dashboard.
+- (change) Updated DESIGN.md/EXPERIENCE.md with desktop two-column Home layout and mobile collapse behavior.
+- (decision) Create four lightweight HTML key-screen mockups: Home mobile, Expense Review mobile, Categories mobile, and Home desktop; mockups validate hierarchy, spacing, navigation, form behavior, and responsive structure, not production UI.
+- (change) Created four lightweight offline HTML key-screen mockups in .working: Home mobile, Expense Review mobile, Categories mobile, and Home desktop.
+- (decision) Mock coverage confirmed: existing four mockups are sufficient; Expense Detail/Edit/Delete remain spine-only because interaction patterns are clear in EXPERIENCE.md; create no additional mockups unless unresolved interaction appears.
+- (change) Promoted four key-screen mockups to mockups/ and linked them from DESIGN.md and EXPERIENCE.md with spines-win-on-conflict note.
+- (change) Applied PRD reconciliation fixes in EXPERIENCE.md: Expense date descending ordering with recorded-time tie-breaker, INR 0 empty summary, edit cancel behavior, operation failure feedback, and Custom Category rename association preservation.
+- (decision) Heavy UX validation skipped by user for internal learning MVP after discovery, PRD reconciliation, recommended fixes, mockups, and spine coverage were completed.
+- (event) spines finalized
diff --git a/_bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/.working/key-categories-mobile.html b/_bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/.working/key-categories-mobile.html
new file mode 100644
index 0000000..c770a80
--- /dev/null
+++ b/_bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/.working/key-categories-mobile.html
@@ -0,0 +1,96 @@
+<!doctype html>
+<html lang="en">
+<head>
+  <meta charset="utf-8">
+  <meta name="viewport" content="width=device-width, initial-scale=1">
+  <title>bmad-expense-tracker — Categories Mobile Mockup</title>
+  <style>
+    /*
+      Governed by DESIGN.md: Colors, Typography, Components.
+      Governed by EXPERIENCE.md: Information Architecture, Component Patterns, State Patterns, Key Flow 4.
+    */
+    :root {
+      --surface-base: #FAFAF8;
+      --surface-raised: #FFFFFF;
+      --ink-primary: #1F2933;
+      --ink-secondary: #5B6673;
+      --ink-muted: #8A94A3;
+      --border-subtle: #E2E8ED;
+      --accent: #0F766E;
+      --accent-strong: #0B5F59;
+      --danger: #B42318;
+      --radius-md: 8px;
+      --radius-lg: 12px;
+      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
+    }
+    * { box-sizing: border-box; }
+    body { margin: 0; min-height: 100vh; background: #ECEFEB; display: grid; place-items: center; padding: 24px; color: var(--ink-primary); }
+    .phone { width: 390px; min-height: 844px; background: var(--surface-base); border: 1px solid #D5DBE1; border-radius: 32px; overflow: hidden; box-shadow: 0 18px 50px rgba(31, 41, 51, 0.16); position: relative; }
+    .screen { padding: 22px 16px 88px; }
+    h1 { margin: 0 0 4px; font-size: 24px; line-height: 1.25; letter-spacing: 0; }
+    .subtitle { color: var(--ink-secondary); font-size: 14px; margin-bottom: 18px; }
+    .section { background: var(--surface-raised); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 14px; margin-bottom: 14px; }
+    h2 { margin: 0 0 12px; font-size: 18px; line-height: 1.3; letter-spacing: 0; }
+    .pill-grid { display: flex; flex-wrap: wrap; gap: 8px; }
+    .pill { border: 1px solid var(--border-subtle); border-radius: 9999px; padding: 7px 11px; font-size: 14px; background: #fff; }
+    .protected { color: var(--ink-secondary); background: #F5F7F7; }
+    label { display: block; color: var(--ink-secondary); font-size: 13px; margin-bottom: 6px; }
+    .inline-form { display: grid; grid-template-columns: 1fr auto; gap: 8px; margin-bottom: 12px; }
+    .input { border: 1px solid var(--border-subtle); border-radius: var(--radius-md); background: #fff; padding: 10px; font-size: 15px; min-height: 42px; }
+    .add { border: 0; border-radius: var(--radius-md); background: var(--accent); color: #fff; font-weight: 700; padding: 0 14px; }
+    .category-row { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 10px; padding: 12px 0; border-top: 1px solid var(--border-subtle); }
+    .category-row:first-of-type { border-top: 0; }
+    .meta { color: var(--ink-secondary); font-size: 14px; }
+    .actions { display: flex; gap: 8px; }
+    .link { color: var(--accent-strong); font-weight: 650; font-size: 14px; }
+    .delete { color: var(--danger); font-weight: 650; font-size: 14px; }
+    .blocked { margin-top: 12px; color: var(--ink-secondary); font-size: 14px; border-top: 1px solid var(--border-subtle); padding-top: 12px; }
+    .bottom-nav { position: absolute; left: 0; right: 0; bottom: 0; display: grid; grid-template-columns: repeat(3, 1fr); background: rgba(255, 255, 255, 0.96); border-top: 1px solid var(--border-subtle); padding: 8px 10px 14px; }
+    .nav-item { text-align: center; color: var(--ink-secondary); font-size: 13px; padding: 8px 4px; border-radius: var(--radius-md); }
+    .nav-item.active { color: var(--accent-strong); font-weight: 700; background: #E7F3F1; }
+  </style>
+</head>
+<body>
+  <main class="phone" aria-label="Categories mobile mockup">
+    <div class="screen">
+      <h1>Categories</h1>
+      <div class="subtitle">Manage simple spending categories.</div>
+      <section class="section" aria-label="Default Categories">
+        <h2>Default Categories</h2>
+        <div class="pill-grid">
+          <span class="pill protected">Food · Protected</span>
+          <span class="pill protected">Transport · Protected</span>
+          <span class="pill protected">Shopping · Protected</span>
+          <span class="pill protected">Bills · Protected</span>
+          <span class="pill protected">Entertainment · Protected</span>
+          <span class="pill protected">Health · Protected</span>
+          <span class="pill protected">Education · Protected</span>
+          <span class="pill protected">Other · Protected</span>
+        </div>
+      </section>
+      <section class="section" aria-label="Custom Categories">
+        <h2>Custom Categories</h2>
+        <label>Add Category</label>
+        <div class="inline-form">
+          <div class="input">Coffee</div>
+          <button class="add">Add</button>
+        </div>
+        <div class="category-row">
+          <div><strong>Coffee</strong><div class="meta">Used by 3 expenses</div></div>
+          <div class="actions"><span class="link">Edit</span><span class="delete">Delete</span></div>
+        </div>
+        <div class="category-row">
+          <div><strong>Subscriptions</strong><div class="meta">Not used yet</div></div>
+          <div class="actions"><span class="link">Edit</span><span class="delete">Delete</span></div>
+        </div>
+        <div class="blocked">This category is used by existing expenses. Reassign those expenses before deleting it.</div>
+      </section>
+    </div>
+    <nav class="bottom-nav" aria-label="Primary navigation">
+      <div class="nav-item">Home</div>
+      <div class="nav-item">Review</div>
+      <div class="nav-item active">Categories</div>
+    </nav>
+  </main>
+</body>
+</html>
diff --git a/_bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/.working/key-home-desktop.html b/_bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/.working/key-home-desktop.html
new file mode 100644
index 0000000..e6c4d6e
--- /dev/null
+++ b/_bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/.working/key-home-desktop.html
@@ -0,0 +1,115 @@
+<!doctype html>
+<html lang="en">
+<head>
+  <meta charset="utf-8">
+  <meta name="viewport" content="width=device-width, initial-scale=1">
+  <title>bmad-expense-tracker — Home Desktop Mockup</title>
+  <style>
+    /*
+      Governed by DESIGN.md: Brand & Style, Layout & Spacing, Components.
+      Governed by EXPERIENCE.md: Foundation, Information Architecture, Component Patterns, Key Flows 1 and 3.
+    */
+    :root {
+      --surface-base: #FAFAF8;
+      --surface-raised: #FFFFFF;
+      --ink-primary: #1F2933;
+      --ink-secondary: #5B6673;
+      --border-subtle: #E2E8ED;
+      --accent: #0F766E;
+      --accent-strong: #0B5F59;
+      --radius-md: 8px;
+      --radius-lg: 12px;
+      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
+    }
+    * { box-sizing: border-box; }
+    body { margin: 0; min-height: 100vh; background: var(--surface-base); color: var(--ink-primary); }
+    .app { max-width: 1120px; margin: 0 auto; padding: 24px; }
+    .topbar { display: flex; justify-content: space-between; align-items: center; padding: 12px 0 24px; }
+    .brand { font-weight: 800; font-size: 20px; }
+    .nav { display: flex; gap: 8px; }
+    .nav span { padding: 9px 12px; border-radius: var(--radius-md); color: var(--ink-secondary); font-size: 14px; }
+    .nav .active { color: var(--accent-strong); background: #E7F3F1; font-weight: 700; }
+    .grid { display: grid; grid-template-columns: minmax(0, 1.45fr) 360px; gap: 24px; align-items: start; }
+    h1 { margin: 0 0 4px; font-size: 28px; line-height: 1.25; letter-spacing: 0; }
+    .subtitle { color: var(--ink-secondary); font-size: 15px; margin-bottom: 18px; }
+    .card { background: var(--surface-raised); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 18px; margin-bottom: 16px; }
+    h2 { margin: 0 0 14px; font-size: 18px; line-height: 1.3; letter-spacing: 0; }
+    label { display: block; font-size: 13px; color: var(--ink-secondary); margin-bottom: 6px; }
+    .amount-field { display: flex; align-items: center; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); background: #fff; min-height: 58px; padding: 0 14px; margin-bottom: 14px; max-width: 380px; }
+    .currency { color: var(--ink-secondary); font-size: 24px; margin-right: 8px; }
+    .amount { font-size: 30px; font-weight: 750; }
+    .chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
+    .chip { border: 1px solid var(--border-subtle); border-radius: 9999px; padding: 8px 12px; font-size: 14px; background: #fff; }
+    .chip.selected { background: var(--accent); border-color: var(--accent); color: #fff; }
+    .fields { display: grid; grid-template-columns: 190px minmax(220px, 1fr) auto; gap: 12px; align-items: end; }
+    .input { border: 1px solid var(--border-subtle); border-radius: var(--radius-md); background: #fff; min-height: 44px; padding: 11px; color: var(--ink-primary); font-size: 15px; }
+    .save { min-height: 44px; border: 0; border-radius: var(--radius-md); background: var(--accent); color: #fff; font-weight: 750; padding: 0 18px; }
+    .total { font-size: 34px; font-weight: 800; margin: 0 0 2px; }
+    .muted { color: var(--ink-secondary); font-size: 14px; }
+    .bar-row { margin-top: 14px; }
+    .bar-meta { display: flex; justify-content: space-between; gap: 12px; font-size: 14px; margin-bottom: 6px; }
+    .track { height: 8px; background: #EAF0EF; border-radius: 9999px; overflow: hidden; }
+    .fill { height: 100%; background: var(--accent); border-radius: 9999px; }
+    .expense-row { display: grid; grid-template-columns: 1fr auto; gap: 12px; padding: 13px 0; border-top: 1px solid var(--border-subtle); }
+    .expense-row:first-of-type { border-top: 0; padding-top: 0; }
+    .expense-title { font-weight: 650; margin-bottom: 2px; }
+    .expense-note { font-size: 14px; color: var(--ink-secondary); }
+    .expense-amount { font-weight: 750; white-space: nowrap; }
+    @media (max-width: 760px) {
+      .grid { grid-template-columns: 1fr; }
+      .fields { grid-template-columns: 1fr; }
+      .nav { display: none; }
+    }
+  </style>
+</head>
+<body>
+  <main class="app" aria-label="Home desktop mockup">
+    <div class="topbar">
+      <div class="brand">bmad-expense-tracker</div>
+      <nav class="nav" aria-label="Primary navigation">
+        <span class="active">Home</span>
+        <span>Review</span>
+        <span>Categories</span>
+      </nav>
+    </div>
+    <h1>Home</h1>
+    <div class="subtitle">Fast capture first, with this month’s spending in view.</div>
+    <div class="grid">
+      <section>
+        <div class="card">
+          <h2>Add Expense</h2>
+          <label>Amount</label>
+          <div class="amount-field"><span class="currency">₹</span><span class="amount">480.00</span></div>
+          <label>Category</label>
+          <div class="chips">
+            <span class="chip selected">Food</span><span class="chip">Transport</span><span class="chip">Shopping</span><span class="chip">Bills</span><span class="chip">Entertainment</span><span class="chip">Health</span><span class="chip">Other</span>
+          </div>
+          <div class="fields">
+            <div><label>Date</label><div class="input">15 Sep 2026</div></div>
+            <div><label>Description optional</label><div class="input">Lunch</div></div>
+            <button class="save">Save Expense</button>
+          </div>
+        </div>
+        <div class="card">
+          <h2>Current Month</h2>
+          <p class="total">₹18,420</p>
+          <div class="muted">Total spending this month</div>
+          <div class="bar-row"><div class="bar-meta"><span>Food</span><strong>₹7,280</strong></div><div class="track"><div class="fill" style="width:100%"></div></div></div>
+          <div class="bar-row"><div class="bar-meta"><span>Transport</span><strong>₹3,100</strong></div><div class="track"><div class="fill" style="width:43%"></div></div></div>
+          <div class="bar-row"><div class="bar-meta"><span>Shopping</span><strong>₹2,800</strong></div><div class="track"><div class="fill" style="width:38%"></div></div></div>
+          <div class="bar-row"><div class="bar-meta"><span>Bills</span><strong>₹2,400</strong></div><div class="track"><div class="fill" style="width:33%"></div></div></div>
+          <div class="bar-row"><div class="bar-meta"><span>Health</span><strong>₹1,540</strong></div><div class="track"><div class="fill" style="width:21%"></div></div></div>
+        </div>
+      </section>
+      <aside class="card" aria-label="Recent Expenses">
+        <h2>Recent Expenses</h2>
+        <div class="expense-row"><div><div class="expense-title">Food</div><div class="expense-note">Lunch · Today</div></div><div class="expense-amount">₹480</div></div>
+        <div class="expense-row"><div><div class="expense-title">Transport</div><div class="expense-note">Cab home · Today</div></div><div class="expense-amount">₹260</div></div>
+        <div class="expense-row"><div><div class="expense-title">Shopping</div><div class="expense-note">Notebook · Yesterday</div></div><div class="expense-amount">₹350</div></div>
+        <div class="expense-row"><div><div class="expense-title">Bills</div><div class="expense-note">Mobile plan · 13 Sep</div></div><div class="expense-amount">₹799</div></div>
+        <div class="expense-row"><div><div class="expense-title">Health</div><div class="expense-note">Pharmacy · 12 Sep</div></div><div class="expense-amount">₹420</div></div>
+      </aside>
+    </div>
+  </main>
+</body>
+</html>
diff --git a/_bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/.working/key-home-mobile.html b/_bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/.working/key-home-mobile.html
new file mode 100644
index 0000000..af56f82
--- /dev/null
+++ b/_bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/.working/key-home-mobile.html
@@ -0,0 +1,320 @@
+<!doctype html>
+<html lang="en">
+<head>
+  <meta charset="utf-8">
+  <meta name="viewport" content="width=device-width, initial-scale=1">
+  <title>bmad-expense-tracker — Home Mobile Mockup</title>
+  <style>
+    /*
+      Governed by DESIGN.md: Brand & Style, Colors, Typography, Layout & Spacing, Components.
+      Governed by EXPERIENCE.md: Information Architecture, Component Patterns, State Patterns, Key Flows 1 and 3.
+    */
+    :root {
+      --surface-base: #FAFAF8;
+      --surface-raised: #FFFFFF;
+      --ink-primary: #1F2933;
+      --ink-secondary: #5B6673;
+      --ink-muted: #8A94A3;
+      --border-subtle: #E2E8ED;
+      --accent: #0F766E;
+      --accent-strong: #0B5F59;
+      --danger: #B42318;
+      --radius-md: 8px;
+      --radius-lg: 12px;
+      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
+    }
+    * { box-sizing: border-box; }
+    body {
+      margin: 0;
+      min-height: 100vh;
+      background: #ECEFEB;
+      color: var(--ink-primary);
+      display: grid;
+      place-items: center;
+      padding: 24px;
+    }
+    .phone {
+      width: 390px;
+      min-height: 844px;
+      background: var(--surface-base);
+      border: 1px solid #D5DBE1;
+      border-radius: 32px;
+      overflow: hidden;
+      box-shadow: 0 18px 50px rgba(31, 41, 51, 0.16);
+      position: relative;
+    }
+    .screen {
+      padding: 22px 16px 88px;
+    }
+    header {
+      display: flex;
+      justify-content: space-between;
+      align-items: flex-start;
+      gap: 12px;
+      margin-bottom: 18px;
+    }
+    h1 {
+      margin: 0;
+      font-size: 24px;
+      line-height: 1.25;
+      letter-spacing: 0;
+    }
+    .month {
+      color: var(--ink-secondary);
+      font-size: 14px;
+      margin-top: 3px;
+    }
+    .card {
+      background: var(--surface-raised);
+      border: 1px solid var(--border-subtle);
+      border-radius: var(--radius-lg);
+      padding: 14px;
+      margin-bottom: 14px;
+    }
+    .quick h2,
+    .summary h2,
+    .recent h2 {
+      margin: 0 0 12px;
+      font-size: 18px;
+      line-height: 1.3;
+      letter-spacing: 0;
+    }
+    label {
+      display: block;
+      font-size: 13px;
+      color: var(--ink-secondary);
+      margin-bottom: 6px;
+    }
+    .amount-field {
+      display: flex;
+      align-items: center;
+      border: 1px solid var(--border-subtle);
+      border-radius: var(--radius-md);
+      background: #fff;
+      min-height: 52px;
+      padding: 0 12px;
+      margin-bottom: 12px;
+    }
+    .currency {
+      color: var(--ink-secondary);
+      font-size: 24px;
+      margin-right: 8px;
+    }
+    .amount {
+      font-size: 28px;
+      font-weight: 700;
+      color: var(--ink-primary);
+    }
+    .chips {
+      display: flex;
+      flex-wrap: wrap;
+      gap: 8px;
+      margin-bottom: 12px;
+    }
+    .chip {
+      border: 1px solid var(--border-subtle);
+      border-radius: 9999px;
+      padding: 7px 11px;
+      font-size: 14px;
+      background: #fff;
+      color: var(--ink-primary);
+    }
+    .chip.selected {
+      background: var(--accent);
+      border-color: var(--accent);
+      color: #fff;
+    }
+    .row {
+      display: grid;
+      grid-template-columns: 1fr 1fr;
+      gap: 10px;
+      margin-bottom: 12px;
+    }
+    .input {
+      border: 1px solid var(--border-subtle);
+      border-radius: var(--radius-md);
+      background: #fff;
+      min-height: 42px;
+      padding: 10px;
+      color: var(--ink-primary);
+      font-size: 15px;
+    }
+    .save {
+      width: 100%;
+      min-height: 46px;
+      border: 0;
+      border-radius: var(--radius-md);
+      background: var(--accent);
+      color: #fff;
+      font-size: 16px;
+      font-weight: 700;
+    }
+    .total {
+      font-size: 30px;
+      line-height: 1.1;
+      font-weight: 750;
+      margin: 0 0 4px;
+    }
+    .muted {
+      color: var(--ink-secondary);
+      font-size: 14px;
+    }
+    .bar-row {
+      margin-top: 12px;
+    }
+    .bar-meta {
+      display: flex;
+      justify-content: space-between;
+      gap: 10px;
+      font-size: 14px;
+      margin-bottom: 6px;
+    }
+    .track {
+      height: 8px;
+      background: #EAF0EF;
+      border-radius: 9999px;
+      overflow: hidden;
+    }
+    .fill {
+      height: 100%;
+      background: var(--accent);
+      border-radius: 9999px;
+    }
+    .expense-row {
+      display: grid;
+      grid-template-columns: 1fr auto;
+      gap: 12px;
+      padding: 11px 0;
+      border-top: 1px solid var(--border-subtle);
+    }
+    .expense-row:first-of-type { border-top: 0; padding-top: 0; }
+    .expense-title {
+      font-weight: 650;
+      margin-bottom: 2px;
+    }
+    .expense-note {
+      font-size: 14px;
+      color: var(--ink-secondary);
+    }
+    .expense-amount {
+      font-weight: 700;
+      white-space: nowrap;
+    }
+    .bottom-nav {
+      position: absolute;
+      left: 0;
+      right: 0;
+      bottom: 0;
+      display: grid;
+      grid-template-columns: repeat(3, 1fr);
+      background: rgba(255, 255, 255, 0.96);
+      border-top: 1px solid var(--border-subtle);
+      padding: 8px 10px 14px;
+    }
+    .nav-item {
+      text-align: center;
+      color: var(--ink-secondary);
+      font-size: 13px;
+      padding: 8px 4px;
+      border-radius: var(--radius-md);
+    }
+    .nav-item.active {
+      color: var(--accent-strong);
+      font-weight: 700;
+      background: #E7F3F1;
+    }
+  </style>
+</head>
+<body>
+  <main class="phone" aria-label="Home mobile mockup">
+    <div class="screen">
+      <header>
+        <div>
+          <h1>Home</h1>
+          <div class="month">September 2026</div>
+        </div>
+      </header>
+
+      <section class="card quick" aria-label="Add Expense">
+        <h2>Add Expense</h2>
+        <label for="amount">Amount</label>
+        <div class="amount-field" id="amount">
+          <span class="currency">₹</span>
+          <span class="amount">480.00</span>
+        </div>
+        <label>Category</label>
+        <div class="chips">
+          <span class="chip selected">Food</span>
+          <span class="chip">Transport</span>
+          <span class="chip">Shopping</span>
+          <span class="chip">Bills</span>
+          <span class="chip">Entertainment</span>
+          <span class="chip">Other</span>
+        </div>
+        <div class="row">
+          <div>
+            <label>Date</label>
+            <div class="input">15 Sep 2026</div>
+          </div>
+          <div>
+            <label>Description optional</label>
+            <div class="input">Lunch</div>
+          </div>
+        </div>
+        <button class="save">Save Expense</button>
+      </section>
+
+      <section class="card summary" aria-label="Current Month Spending Summary">
+        <h2>Current Month</h2>
+        <p class="total">₹18,420</p>
+        <div class="muted">Total spending this month</div>
+        <div class="bar-row">
+          <div class="bar-meta"><span>Food</span><strong>₹7,280</strong></div>
+          <div class="track"><div class="fill" style="width: 100%"></div></div>
+        </div>
+        <div class="bar-row">
+          <div class="bar-meta"><span>Transport</span><strong>₹3,100</strong></div>
+          <div class="track"><div class="fill" style="width: 43%"></div></div>
+        </div>
+        <div class="bar-row">
+          <div class="bar-meta"><span>Shopping</span><strong>₹2,800</strong></div>
+          <div class="track"><div class="fill" style="width: 38%"></div></div>
+        </div>
+        <div class="bar-row">
+          <div class="bar-meta"><span>Bills</span><strong>₹2,400</strong></div>
+          <div class="track"><div class="fill" style="width: 33%"></div></div>
+        </div>
+      </section>
+
+      <section class="card recent" aria-label="Recent Expenses">
+        <h2>Recent Expenses</h2>
+        <div class="expense-row">
+          <div><div class="expense-title">Food</div><div class="expense-note">Lunch · Today</div></div>
+          <div class="expense-amount">₹480</div>
+        </div>
+        <div class="expense-row">
+          <div><div class="expense-title">Transport</div><div class="expense-note">Cab home · Today</div></div>
+          <div class="expense-amount">₹260</div>
+        </div>
+        <div class="expense-row">
+          <div><div class="expense-title">Shopping</div><div class="expense-note">Notebook · Yesterday</div></div>
+          <div class="expense-amount">₹350</div>
+        </div>
+        <div class="expense-row">
+          <div><div class="expense-title">Bills</div><div class="expense-note">Mobile plan · 13 Sep</div></div>
+          <div class="expense-amount">₹799</div>
+        </div>
+        <div class="expense-row">
+          <div><div class="expense-title">Health</div><div class="expense-note">Pharmacy · 12 Sep</div></div>
+          <div class="expense-amount">₹420</div>
+        </div>
+      </section>
+    </div>
+    <nav class="bottom-nav" aria-label="Primary navigation">
+      <div class="nav-item active">Home</div>
+      <div class="nav-item">Review</div>
+      <div class="nav-item">Categories</div>
+    </nav>
+  </main>
+</body>
+</html>
diff --git a/_bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/.working/key-review-mobile.html b/_bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/.working/key-review-mobile.html
new file mode 100644
index 0000000..287f50b
--- /dev/null
+++ b/_bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/.working/key-review-mobile.html
@@ -0,0 +1,63 @@
+<!doctype html>
+<html lang="en">
+<head>
+  <meta charset="utf-8">
+  <meta name="viewport" content="width=device-width, initial-scale=1">
+  <title>bmad-expense-tracker — Expense Review Mobile Mockup</title>
+  <style>
+    /*
+      Governed by DESIGN.md: Colors, Typography, Components.
+      Governed by EXPERIENCE.md: Information Architecture, Component Patterns, Interaction Primitives, Key Flow 2.
+    */
+    :root {
+      --surface-base: #FAFAF8;
+      --surface-raised: #FFFFFF;
+      --ink-primary: #1F2933;
+      --ink-secondary: #5B6673;
+      --border-subtle: #E2E8ED;
+      --accent: #0F766E;
+      --accent-strong: #0B5F59;
+      --radius-md: 8px;
+      --radius-lg: 12px;
+      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
+    }
+    * { box-sizing: border-box; }
+    body { margin: 0; min-height: 100vh; background: #ECEFEB; display: grid; place-items: center; padding: 24px; color: var(--ink-primary); }
+    .phone { width: 390px; min-height: 844px; background: var(--surface-base); border: 1px solid #D5DBE1; border-radius: 32px; overflow: hidden; box-shadow: 0 18px 50px rgba(31, 41, 51, 0.16); position: relative; }
+    .screen { padding: 22px 16px 88px; }
+    h1 { margin: 0 0 4px; font-size: 24px; line-height: 1.25; letter-spacing: 0; }
+    .subtitle { color: var(--ink-secondary); font-size: 14px; margin-bottom: 18px; }
+    .list { background: var(--surface-raised); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 4px 14px; }
+    .expense-row { display: grid; grid-template-columns: 1fr auto; gap: 12px; padding: 14px 0; border-top: 1px solid var(--border-subtle); }
+    .expense-row:first-child { border-top: 0; }
+    .category { font-weight: 650; margin-bottom: 3px; }
+    .meta { color: var(--ink-secondary); font-size: 14px; line-height: 1.4; }
+    .amount { font-weight: 750; white-space: nowrap; }
+    .bottom-nav { position: absolute; left: 0; right: 0; bottom: 0; display: grid; grid-template-columns: repeat(3, 1fr); background: rgba(255, 255, 255, 0.96); border-top: 1px solid var(--border-subtle); padding: 8px 10px 14px; }
+    .nav-item { text-align: center; color: var(--ink-secondary); font-size: 13px; padding: 8px 4px; border-radius: var(--radius-md); }
+    .nav-item.active { color: var(--accent-strong); font-weight: 700; background: #E7F3F1; }
+  </style>
+</head>
+<body>
+  <main class="phone" aria-label="Expense Review mobile mockup">
+    <div class="screen">
+      <h1>Review</h1>
+      <div class="subtitle">All recorded expenses, most recent first.</div>
+      <section class="list" aria-label="All Expenses">
+        <div class="expense-row"><div><div class="category">Food</div><div class="meta">Lunch · 15 Sep 2026</div></div><div class="amount">₹480</div></div>
+        <div class="expense-row"><div><div class="category">Transport</div><div class="meta">Cab home · 15 Sep 2026</div></div><div class="amount">₹260</div></div>
+        <div class="expense-row"><div><div class="category">Shopping</div><div class="meta">Notebook · 14 Sep 2026</div></div><div class="amount">₹350</div></div>
+        <div class="expense-row"><div><div class="category">Bills</div><div class="meta">Mobile plan · 13 Sep 2026</div></div><div class="amount">₹799</div></div>
+        <div class="expense-row"><div><div class="category">Health</div><div class="meta">Pharmacy · 12 Sep 2026</div></div><div class="amount">₹420</div></div>
+        <div class="expense-row"><div><div class="category">Education</div><div class="meta">Course book · 10 Sep 2026</div></div><div class="amount">₹1,200</div></div>
+        <div class="expense-row"><div><div class="category">Entertainment</div><div class="meta">Movie · 08 Sep 2026</div></div><div class="amount">₹650</div></div>
+      </section>
+    </div>
+    <nav class="bottom-nav" aria-label="Primary navigation">
+      <div class="nav-item">Home</div>
+      <div class="nav-item active">Review</div>
+      <div class="nav-item">Categories</div>
+    </nav>
+  </main>
+</body>
+</html>
diff --git a/_bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/DESIGN.md b/_bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/DESIGN.md
new file mode 100644
index 0000000..b179aff
--- /dev/null
+++ b/_bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/DESIGN.md
@@ -0,0 +1,143 @@
+---
+name: bmad-expense-tracker
+description: Clean, dependable personal expense tracking utility focused on fast capture and current-month awareness.
+title: DESIGN: bmad-expense-tracker
+status: final
+created: 2026-09-15
+updated: 2026-09-15
+sources:
+  - ../../prds/prd-bmad-expense-tracker-2026-09-15/prd.md
+colors:
+  surface-base: '#FAFAF8'
+  surface-raised: '#FFFFFF'
+  ink-primary: '#1F2933'
+  ink-secondary: '#5B6673'
+  ink-muted: '#8A94A3'
+  border-subtle: '#E2E8ED'
+  accent: '#0F766E'
+  accent-strong: '#0B5F59'
+  success: '#15803D'
+  warning: '#B45309'
+  danger: '#B42318'
+typography:
+  title:
+    fontFamily: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
+    fontSize: 24px
+    fontWeight: 700
+    lineHeight: 1.25
+    letterSpacing: 0
+  section:
+    fontFamily: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
+    fontSize: 18px
+    fontWeight: 650
+    lineHeight: 1.3
+    letterSpacing: 0
+  body:
+    fontFamily: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
+    fontSize: 16px
+    fontWeight: 400
+    lineHeight: 1.5
+    letterSpacing: 0
+  meta:
+    fontFamily: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
+    fontSize: 14px
+    fontWeight: 400
+    lineHeight: 1.4
+    letterSpacing: 0
+rounded:
+  sm: 6px
+  md: 8px
+  lg: 12px
+  full: 9999px
+spacing:
+  '1': 4px
+  '2': 8px
+  '3': 12px
+  '4': 16px
+  '5': 20px
+  '6': 24px
+  '8': 32px
+  mobile-margin: 16px
+  desktop-gutter: 24px
+components:
+  button-primary:
+    background: '{colors.accent}'
+    foreground: '#FFFFFF'
+    radius: '{rounded.md}'
+  button-danger:
+    background: '{colors.danger}'
+    foreground: '#FFFFFF'
+    radius: '{rounded.md}'
+  input:
+    background: '{colors.surface-raised}'
+    border: '{colors.border-subtle}'
+    radius: '{rounded.md}'
+  amount-input:
+    background: '{colors.surface-raised}'
+    border: '{colors.border-subtle}'
+    prefix-color: '{colors.ink-secondary}'
+    radius: '{rounded.md}'
+  category-chip:
+    background: '{colors.surface-raised}'
+    selected-background: '{colors.accent}'
+    selected-foreground: '#FFFFFF'
+    radius: '{rounded.full}'
+---
+
+## Brand & Style
+
+bmad-expense-tracker should feel like a simple, dependable personal utility. The visual system is clean, crisp, and trustworthy, with subtle warmth in the base surface and enough spacing to make capture and review feel calm rather than dense.
+
+The interface prioritizes readability, fast scanning, and clear hierarchy over visual effects. Primary actions such as Add Expense and Save use restrained emphasis. The Current Month total may receive stronger type treatment, but the product should not drift into a heavy fintech or analytics-dashboard aesthetic.
+
+## Colors
+
+- **Warm off-white (`{colors.surface-base}`)** is the default page background. It keeps the utility from feeling clinical while staying neutral.
+- **White (`{colors.surface-raised}`)** is used for form surfaces, list rows, and compact content groups.
+- **Ink (`{colors.ink-primary}` / `{colors.ink-secondary}` / `{colors.ink-muted}`)** carries hierarchy for labels, values, and secondary metadata.
+- **Teal (`{colors.accent}` / `{colors.accent-strong}`)** is the primary accent for important actions, selected navigation states, selected Category chips, and key emphasis.
+- **Semantic colors (`{colors.success}`, `{colors.warning}`, `{colors.danger}`)** are used only when the meaning requires success, warning, or destructive emphasis.
+
+Avoid decorative accent use, broad gradients, finance-app green as the default brand signal, and chart palettes that make the MVP feel like an analytics dashboard.
+
+## Typography
+
+Use system UI typography for a crisp, familiar web-app feel across mobile and desktop. The type scale stays practical: one title level for the main Current Month total or page title, section headings for compact groups, body text for controls and rows, and meta text for dates, helper text, and secondary descriptions.
+
+Typography must maintain strong contrast and readable sizing on mobile. Do not use display type, negative letter spacing, all-caps section labels, or tiny metadata that makes Expense review harder.
+
+## Layout & Spacing
+
+The layout is mobile-first and responsive. Mobile uses a single-column flow with the Add Expense form first, followed by Current Month context and Recent Expenses. Desktop uses a two-column Home layout: Add Expense and Current Month summary in the left/main column, Recent Expenses in the right column. The layout uses desktop space without becoming a three-column dashboard or creating separate destinations.
+
+Visual references: [Home mobile](mockups/home-mobile.html), [Expense Review mobile](mockups/review-mobile.html), [Categories mobile](mockups/categories-mobile.html), and [Home desktop](mockups/home-desktop.html). The spines win on conflict with mockups.
+
+Spacing should make the Home screen feel calm but efficient. Major groups use generous vertical separation; tightly related fields and list metadata use smaller gaps. Avoid nested cards and avoid turning every section into a heavy standalone panel.
+
+## Elevation & Depth
+
+Depth is minimal. Use borders, surface tone, spacing, and typography for hierarchy before shadows. If elevation is used, keep it subtle and functional for overlays or confirmation surfaces only.
+
+## Shapes
+
+Use modest rounded corners: `{rounded.md}` for inputs, buttons, list rows, and compact surfaces; `{rounded.full}` only for Category chips or small pill-like controls where the shape improves selection scanning.
+
+## Components
+
+- **Primary button** — Teal background, white text, used for Save and other primary actions. Should be easy to reach and visually clear without oversized styling.
+- **Destructive button** — Red semantic color, used only for confirmed delete actions. Pair with a clear Cancel action in confirmation dialogs.
+- **Input** — White surface, subtle border, clear label, readable validation text. Amount receives primary visual focus in Add Expense.
+- **Amount input** — Most visually prominent form field. Shows INR prefix/symbol (`₹`) clearly in or beside the field without competing with the entered number.
+- **Category chip** — Compact tappable chip with clear selected state. Default and Custom Categories share the same selection behavior in Add/Edit Expense.
+- **Expense row** — Clean row with amount, Category, date, and optional description as secondary text. No inline edit/delete actions.
+- **Bottom navigation item** — Teal selected state, neutral inactive state. Mobile destinations are Home, Review, and Categories.
+
+## Do's and Don'ts
+
+| Do | Don't |
+|---|---|
+| Keep the interface clean, readable, and fast to scan. | Make the UI feel like a dense financial dashboard. |
+| Use teal for primary actions and selected states. | Use accent color decoratively or excessively. |
+| Keep the Add Expense form visually primary on Home. | Bury expense entry below summary content on mobile. |
+| Use simple horizontal bars for Category spending. | Use donut/pie charts or multiple chart types in MVP. |
+| Keep lists clean and mobile-scannable. | Put Edit/Delete controls directly on every Expense row. |
diff --git a/_bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/EXPERIENCE.md b/_bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/EXPERIENCE.md
new file mode 100644
index 0000000..37cc488
--- /dev/null
+++ b/_bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/EXPERIENCE.md
@@ -0,0 +1,145 @@
+---
+title: EXPERIENCE: bmad-expense-tracker
+status: final
+created: 2026-09-15
+updated: 2026-09-15
+sources:
+  - ../../prds/prd-bmad-expense-tracker-2026-09-15/prd.md
+---
+
+# bmad-expense-tracker — Experience Spine
+
+## Foundation
+
+bmad-expense-tracker is a mobile-first responsive web app. The primary usage moment is immediately after a purchase, so the experience optimizes for fast Expense capture on a phone while supporting the same IA on desktop. Desktop adapts the layout and navigation to the wider viewport; it does not introduce separate destinations or a different experience.
+
+`DESIGN.md` owns the visual identity and design tokens. This spine owns information architecture, behavior, states, interactions, accessibility, and key flows.
+
+## Information Architecture
+
+| Surface | Reached from | Purpose |
+|---|---|---|
+| Home | App open, Home navigation | Fast Expense capture, complete Current Month nonzero Category awareness, and 5 Recent Expenses |
+| Expense Review | Review navigation, Home link/action | Browse all recorded Expenses in one simple scrollable list and open Expense Detail |
+| Expense Detail | Recent Expense row, Expense Review row | Read one Expense and access Edit/Delete |
+| Edit Expense | Expense Detail → Edit | Update amount, Category, date, or optional description |
+| Category Management | Categories navigation | View Default Categories and manage Custom Categories |
+
+Mobile navigation uses a bottom navigation bar with Home, Review, and Categories. Home is the default landing screen. Add Expense is not a separate navigation destination; it remains the primary interaction on Home.
+
+Desktop uses the same Home, Review, and Categories IA in a compact header or side navigation as appropriate for the layout.
+
+Home uses a two-column layout on desktop: Add Expense and Current Month summary in the left/main column, Recent Expenses in the right column. Add Expense remains the strongest visual priority. Smaller screens collapse naturally to the mobile single-column order: Add Expense, Current Month summary, Recent Expenses.
+
+Mockup references: [Home mobile](mockups/home-mobile.html), [Expense Review mobile](mockups/review-mobile.html), [Categories mobile](mockups/categories-mobile.html), and [Home desktop](mockups/home-desktop.html). These illustrate hierarchy and layout; this spine and `DESIGN.md` win on conflict.
+
+## Voice and Tone
+
+Microcopy is friendly but restrained: clear, approachable, concise, and actionable. Avoid jokes, excessive personality, and overly casual financial language.
+
+| Situation | Preferred copy |
+|---|---|
+| Expense saved | `Expense saved.` |
+| Expense updated | `Expense updated.` |
+| Expense deleted | `Expense deleted.` |
+| Category added | `Category added.` |
+| Category updated | `Category updated.` |
+| Category deleted | `Category deleted.` |
+| Missing amount | `Enter an amount to save this expense.` |
+| Empty Home | `No expenses yet. Add your first one above.` |
+| Empty Review | `No expenses recorded yet.` |
+| Empty Custom Categories | `No custom categories yet. Add one to get started.` |
+| Category deletion blocked | `This category is used by existing expenses. Reassign those expenses before deleting it.` |
+
+## Component Patterns
+
+Behavioral rules live here; visual specifications live in `DESIGN.md`.
+
+| Component | Use | Behavioral rules |
+|---|---|---|
+| Add Expense form | Top of Home | Inline, compact, immediately visible. Amount is first and visually primary, shows `₹` in or beside the field, uses mobile-optimized numeric input where supported, accepts positive amounts only, rejects zero/negative values, and allows up to 2 decimal places. Category is required. Date is a visible compact field that defaults to today, remains easy to change, and clearly displays the selected date. Description is visible after the required fields, clearly optional, compact, and visually secondary. Save is prominent. After save, reset the form for quick additional entry. |
+| Category chips | Add/Edit Expense | Show available Default and Custom Categories directly in the form. Chips wrap on mobile, have a clear selected state, and replace a dropdown for MVP. |
+| Current Month total | Home | Shows total Expense amount for the Current Month using INR (₹). Updates after Expense add/edit/delete. |
+| Category breakdown | Home | Ranked by Current Month spending amount, highest first. Shows every Category with nonzero Current Month spending using Category name, amount, and a simple horizontal bar. Do not hide lower-ranked Categories behind expand/collapse in MVP. |
+| Recent Expenses | Home | Shows 5 Expenses ordered by Expense date descending, with recorded time descending as the stable same-date tie-breaker. Rows show amount, Category, date, and optional description as secondary text. Row opens Expense Detail. |
+| Expense Review list | Review | Shows all recorded Expenses in one simple scrollable list ordered by Expense date descending, with recorded time descending as the stable same-date tie-breaker, using the same row structure as Home. Tapping a row opens Expense Detail. No grouping by month/date, pagination, infinite scroll, search, filtering, sorting, or analytics in MVP. |
+| Expense row | Home, Review | Opens Expense Detail. Does not show Edit/Delete controls directly. |
+| Expense Detail | Detail | Read-only view of amount, Category, date, and optional description. Provides Edit and Delete actions. |
+| Edit Expense form | Edit | Uses the same Expense form pattern as Add Expense, including visible date field, Category chips, and optional Description, pre-populated with existing values. Save returns to Expense Detail. Cancel or Back discards unsaved changes and returns to Expense Detail without changing the Expense. |
+| Delete confirmation | Expense Detail, Categories | Simple accessible confirmation dialog with concise title and explanation, Cancel action, and visually destructive Delete action. Expense deletion copy indicates permanent removal. Eligible Custom Category deletion uses the same pattern; in-use Custom Categories are blocked before confirmation. Cancel leaves the item unchanged. No undo/recovery in MVP. |
+| Category Management | Categories | Two sections: Default Categories and Custom Categories. Default Categories are shown as protected with no edit/delete. Custom Categories support Add/Edit/Delete. Add/Edit uses a compact inline form on the Categories screen with category name and clear Add/Save action. Renaming a Custom Category preserves its association with existing Expenses. |
+
+## State Patterns
+
+| State | Surface | Treatment |
+|---|---|---|
+| Empty Home | Home | Keep the inline Add Expense form fully visible and usable. Do not show onboarding, intro screens, or sample/demo Expenses. Current Month summary shows a visible INR 0 total when there are no Current Month Expenses; Category breakdown uses empty copy instead of fake bars. Recent Expenses uses `No expenses yet. Add your first one above.` |
+| Empty Review | Review | `No expenses recorded yet.` Provide a clear route back to Home. |
+| Empty Custom Categories | Categories | `No custom categories yet. Add one to get started.` |
+| Success toast | Global | Successful create/update/delete actions use compact transient feedback that does not interrupt flow: `Expense saved.`, `Expense updated.`, `Expense deleted.`, `Category added.`, `Category updated.`, or `Category deleted.` |
+| Validation error | Add/Edit Expense, Categories | Keep the user in context and show concise inline feedback near the relevant field/action, such as `Enter an amount to save this expense.` Do not rely on toast messages for errors that require user action. |
+| Operation failure | Global | If a valid save, update, or delete action fails, keep the user in context, preserve entered data where applicable, and show concise actionable failure feedback near the relevant action or form area. |
+| Amount validation | Add/Edit Expense | Validate before save. Amount must be positive and may include up to 2 decimal places. Show inline actionable feedback when missing or invalid. |
+| Category name validation | Categories | Category name cannot be empty. Show inline feedback near the name field. |
+| Delete confirmation | Expense Detail, Categories | Confirmation appears before Expense deletion or eligible Custom Category deletion. Confirm removes the item; cancel leaves it unchanged. |
+| Category deletion blocked | Categories | Explain that the Category is used by existing Expenses and those Expenses must be reassigned before deletion. Do not show the delete confirmation until the Category is eligible. |
+
+## Interaction Primitives
+
+- Tap/click primary actions directly; avoid extra steps for normal Expense entry.
+- Tap/click an Expense row to open Expense Detail.
+- Keep Edit/Delete actions inside Expense Detail, not on list rows.
+- Bottom navigation switches between Home, Review, and Categories on mobile.
+- Use confirmation for destructive deletion.
+- Avoid advanced table interactions, chart exploration, drag/drop, swipe-only actions, and hidden gestures in MVP.
+
+## Accessibility Floor
+
+- Form fields and controls need meaningful labels.
+- Validation feedback must be understandable and associated with the relevant field.
+- Keyboard access should work for applicable fields, buttons, navigation items, Category chips, and confirmation actions.
+- Focus order follows reading order on every surface.
+- Interactive targets should be comfortable on touch screens.
+- Visual contrast requirements are owned by `DESIGN.md`; the experience must not rely on color alone to convey selected, error, or destructive states.
+
+## Key Flows
+
+### Flow 1 — Record a purchase immediately
+
+1. User opens the app to Home.
+2. The Add Expense form is already visible at the top.
+3. User enters amount.
+4. User selects a Category chip.
+5. Date remains today's date unless changed.
+6. User optionally adds a description.
+7. User taps Save.
+8. **Climax:** `Expense saved.` appears, the form resets, and Current Month summary/Recent Expenses update.
+
+### Flow 2 — Review and correct a recent Expense
+
+1. User opens Home or Review.
+2. User scans Recent Expenses or the Expense Review list, both ordered by Expense date descending with recorded time as the same-date tie-breaker.
+3. User taps an Expense row.
+4. Expense Detail opens in read-only mode.
+5. User taps Edit.
+6. Pre-populated Expense form opens.
+7. User saves changes.
+8. **Climax:** Updated Expense appears in detail/list context and affected summaries update.
+
+### Flow 3 — Understand Current Month spending
+
+1. User opens Home.
+2. User sees Add Expense first, then Current Month total.
+3. User scans all nonzero Current Month Categories ranked by spending with simple bars.
+4. User checks 5 Recent Expenses below the summary for context.
+5. **Climax:** User can answer how much they spent this month and where most of the money went without opening a complex analytics view.
+
+### Flow 4 — Manage Custom Categories
+
+1. User opens Categories.
+2. User sees protected Default Categories and manageable Custom Categories.
+3. User adds or renames a Custom Category through the compact inline form.
+4. Saving updates the Custom Categories section and shows a success toast; renaming preserves existing Expense associations.
+5. User deletes an unused Custom Category through confirmation.
+6. If a Custom Category is used by Expenses, deletion is blocked with an explanation.
+7. **Climax:** Category choices stay useful for Expense entry without adding complexity to the Add Expense flow.
diff --git a/_bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/mockups/categories-mobile.html b/_bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/mockups/categories-mobile.html
new file mode 100644
index 0000000..c770a80
--- /dev/null
+++ b/_bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/mockups/categories-mobile.html
@@ -0,0 +1,96 @@
+<!doctype html>
+<html lang="en">
+<head>
+  <meta charset="utf-8">
+  <meta name="viewport" content="width=device-width, initial-scale=1">
+  <title>bmad-expense-tracker — Categories Mobile Mockup</title>
+  <style>
+    /*
+      Governed by DESIGN.md: Colors, Typography, Components.
+      Governed by EXPERIENCE.md: Information Architecture, Component Patterns, State Patterns, Key Flow 4.
+    */
+    :root {
+      --surface-base: #FAFAF8;
+      --surface-raised: #FFFFFF;
+      --ink-primary: #1F2933;
+      --ink-secondary: #5B6673;
+      --ink-muted: #8A94A3;
+      --border-subtle: #E2E8ED;
+      --accent: #0F766E;
+      --accent-strong: #0B5F59;
+      --danger: #B42318;
+      --radius-md: 8px;
+      --radius-lg: 12px;
+      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
+    }
+    * { box-sizing: border-box; }
+    body { margin: 0; min-height: 100vh; background: #ECEFEB; display: grid; place-items: center; padding: 24px; color: var(--ink-primary); }
+    .phone { width: 390px; min-height: 844px; background: var(--surface-base); border: 1px solid #D5DBE1; border-radius: 32px; overflow: hidden; box-shadow: 0 18px 50px rgba(31, 41, 51, 0.16); position: relative; }
+    .screen { padding: 22px 16px 88px; }
+    h1 { margin: 0 0 4px; font-size: 24px; line-height: 1.25; letter-spacing: 0; }
+    .subtitle { color: var(--ink-secondary); font-size: 14px; margin-bottom: 18px; }
+    .section { background: var(--surface-raised); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 14px; margin-bottom: 14px; }
+    h2 { margin: 0 0 12px; font-size: 18px; line-height: 1.3; letter-spacing: 0; }
+    .pill-grid { display: flex; flex-wrap: wrap; gap: 8px; }
+    .pill { border: 1px solid var(--border-subtle); border-radius: 9999px; padding: 7px 11px; font-size: 14px; background: #fff; }
+    .protected { color: var(--ink-secondary); background: #F5F7F7; }
+    label { display: block; color: var(--ink-secondary); font-size: 13px; margin-bottom: 6px; }
+    .inline-form { display: grid; grid-template-columns: 1fr auto; gap: 8px; margin-bottom: 12px; }
+    .input { border: 1px solid var(--border-subtle); border-radius: var(--radius-md); background: #fff; padding: 10px; font-size: 15px; min-height: 42px; }
+    .add { border: 0; border-radius: var(--radius-md); background: var(--accent); color: #fff; font-weight: 700; padding: 0 14px; }
+    .category-row { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 10px; padding: 12px 0; border-top: 1px solid var(--border-subtle); }
+    .category-row:first-of-type { border-top: 0; }
+    .meta { color: var(--ink-secondary); font-size: 14px; }
+    .actions { display: flex; gap: 8px; }
+    .link { color: var(--accent-strong); font-weight: 650; font-size: 14px; }
+    .delete { color: var(--danger); font-weight: 650; font-size: 14px; }
+    .blocked { margin-top: 12px; color: var(--ink-secondary); font-size: 14px; border-top: 1px solid var(--border-subtle); padding-top: 12px; }
+    .bottom-nav { position: absolute; left: 0; right: 0; bottom: 0; display: grid; grid-template-columns: repeat(3, 1fr); background: rgba(255, 255, 255, 0.96); border-top: 1px solid var(--border-subtle); padding: 8px 10px 14px; }
+    .nav-item { text-align: center; color: var(--ink-secondary); font-size: 13px; padding: 8px 4px; border-radius: var(--radius-md); }
+    .nav-item.active { color: var(--accent-strong); font-weight: 700; background: #E7F3F1; }
+  </style>
+</head>
+<body>
+  <main class="phone" aria-label="Categories mobile mockup">
+    <div class="screen">
+      <h1>Categories</h1>
+      <div class="subtitle">Manage simple spending categories.</div>
+      <section class="section" aria-label="Default Categories">
+        <h2>Default Categories</h2>
+        <div class="pill-grid">
+          <span class="pill protected">Food · Protected</span>
+          <span class="pill protected">Transport · Protected</span>
+          <span class="pill protected">Shopping · Protected</span>
+          <span class="pill protected">Bills · Protected</span>
+          <span class="pill protected">Entertainment · Protected</span>
+          <span class="pill protected">Health · Protected</span>
+          <span class="pill protected">Education · Protected</span>
+          <span class="pill protected">Other · Protected</span>
+        </div>
+      </section>
+      <section class="section" aria-label="Custom Categories">
+        <h2>Custom Categories</h2>
+        <label>Add Category</label>
+        <div class="inline-form">
+          <div class="input">Coffee</div>
+          <button class="add">Add</button>
+        </div>
+        <div class="category-row">
+          <div><strong>Coffee</strong><div class="meta">Used by 3 expenses</div></div>
+          <div class="actions"><span class="link">Edit</span><span class="delete">Delete</span></div>
+        </div>
+        <div class="category-row">
+          <div><strong>Subscriptions</strong><div class="meta">Not used yet</div></div>
+          <div class="actions"><span class="link">Edit</span><span class="delete">Delete</span></div>
+        </div>
+        <div class="blocked">This category is used by existing expenses. Reassign those expenses before deleting it.</div>
+      </section>
+    </div>
+    <nav class="bottom-nav" aria-label="Primary navigation">
+      <div class="nav-item">Home</div>
+      <div class="nav-item">Review</div>
+      <div class="nav-item active">Categories</div>
+    </nav>
+  </main>
+</body>
+</html>
diff --git a/_bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/mockups/home-desktop.html b/_bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/mockups/home-desktop.html
new file mode 100644
index 0000000..e6c4d6e
--- /dev/null
+++ b/_bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/mockups/home-desktop.html
@@ -0,0 +1,115 @@
+<!doctype html>
+<html lang="en">
+<head>
+  <meta charset="utf-8">
+  <meta name="viewport" content="width=device-width, initial-scale=1">
+  <title>bmad-expense-tracker — Home Desktop Mockup</title>
+  <style>
+    /*
+      Governed by DESIGN.md: Brand & Style, Layout & Spacing, Components.
+      Governed by EXPERIENCE.md: Foundation, Information Architecture, Component Patterns, Key Flows 1 and 3.
+    */
+    :root {
+      --surface-base: #FAFAF8;
+      --surface-raised: #FFFFFF;
+      --ink-primary: #1F2933;
+      --ink-secondary: #5B6673;
+      --border-subtle: #E2E8ED;
+      --accent: #0F766E;
+      --accent-strong: #0B5F59;
+      --radius-md: 8px;
+      --radius-lg: 12px;
+      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
+    }
+    * { box-sizing: border-box; }
+    body { margin: 0; min-height: 100vh; background: var(--surface-base); color: var(--ink-primary); }
+    .app { max-width: 1120px; margin: 0 auto; padding: 24px; }
+    .topbar { display: flex; justify-content: space-between; align-items: center; padding: 12px 0 24px; }
+    .brand { font-weight: 800; font-size: 20px; }
+    .nav { display: flex; gap: 8px; }
+    .nav span { padding: 9px 12px; border-radius: var(--radius-md); color: var(--ink-secondary); font-size: 14px; }
+    .nav .active { color: var(--accent-strong); background: #E7F3F1; font-weight: 700; }
+    .grid { display: grid; grid-template-columns: minmax(0, 1.45fr) 360px; gap: 24px; align-items: start; }
+    h1 { margin: 0 0 4px; font-size: 28px; line-height: 1.25; letter-spacing: 0; }
+    .subtitle { color: var(--ink-secondary); font-size: 15px; margin-bottom: 18px; }
+    .card { background: var(--surface-raised); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 18px; margin-bottom: 16px; }
+    h2 { margin: 0 0 14px; font-size: 18px; line-height: 1.3; letter-spacing: 0; }
+    label { display: block; font-size: 13px; color: var(--ink-secondary); margin-bottom: 6px; }
+    .amount-field { display: flex; align-items: center; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); background: #fff; min-height: 58px; padding: 0 14px; margin-bottom: 14px; max-width: 380px; }
+    .currency { color: var(--ink-secondary); font-size: 24px; margin-right: 8px; }
+    .amount { font-size: 30px; font-weight: 750; }
+    .chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
+    .chip { border: 1px solid var(--border-subtle); border-radius: 9999px; padding: 8px 12px; font-size: 14px; background: #fff; }
+    .chip.selected { background: var(--accent); border-color: var(--accent); color: #fff; }
+    .fields { display: grid; grid-template-columns: 190px minmax(220px, 1fr) auto; gap: 12px; align-items: end; }
+    .input { border: 1px solid var(--border-subtle); border-radius: var(--radius-md); background: #fff; min-height: 44px; padding: 11px; color: var(--ink-primary); font-size: 15px; }
+    .save { min-height: 44px; border: 0; border-radius: var(--radius-md); background: var(--accent); color: #fff; font-weight: 750; padding: 0 18px; }
+    .total { font-size: 34px; font-weight: 800; margin: 0 0 2px; }
+    .muted { color: var(--ink-secondary); font-size: 14px; }
+    .bar-row { margin-top: 14px; }
+    .bar-meta { display: flex; justify-content: space-between; gap: 12px; font-size: 14px; margin-bottom: 6px; }
+    .track { height: 8px; background: #EAF0EF; border-radius: 9999px; overflow: hidden; }
+    .fill { height: 100%; background: var(--accent); border-radius: 9999px; }
+    .expense-row { display: grid; grid-template-columns: 1fr auto; gap: 12px; padding: 13px 0; border-top: 1px solid var(--border-subtle); }
+    .expense-row:first-of-type { border-top: 0; padding-top: 0; }
+    .expense-title { font-weight: 650; margin-bottom: 2px; }
+    .expense-note { font-size: 14px; color: var(--ink-secondary); }
+    .expense-amount { font-weight: 750; white-space: nowrap; }
+    @media (max-width: 760px) {
+      .grid { grid-template-columns: 1fr; }
+      .fields { grid-template-columns: 1fr; }
+      .nav { display: none; }
+    }
+  </style>
+</head>
+<body>
+  <main class="app" aria-label="Home desktop mockup">
+    <div class="topbar">
+      <div class="brand">bmad-expense-tracker</div>
+      <nav class="nav" aria-label="Primary navigation">
+        <span class="active">Home</span>
+        <span>Review</span>
+        <span>Categories</span>
+      </nav>
+    </div>
+    <h1>Home</h1>
+    <div class="subtitle">Fast capture first, with this month’s spending in view.</div>
+    <div class="grid">
+      <section>
+        <div class="card">
+          <h2>Add Expense</h2>
+          <label>Amount</label>
+          <div class="amount-field"><span class="currency">₹</span><span class="amount">480.00</span></div>
+          <label>Category</label>
+          <div class="chips">
+            <span class="chip selected">Food</span><span class="chip">Transport</span><span class="chip">Shopping</span><span class="chip">Bills</span><span class="chip">Entertainment</span><span class="chip">Health</span><span class="chip">Other</span>
+          </div>
+          <div class="fields">
+            <div><label>Date</label><div class="input">15 Sep 2026</div></div>
+            <div><label>Description optional</label><div class="input">Lunch</div></div>
+            <button class="save">Save Expense</button>
+          </div>
+        </div>
+        <div class="card">
+          <h2>Current Month</h2>
+          <p class="total">₹18,420</p>
+          <div class="muted">Total spending this month</div>
+          <div class="bar-row"><div class="bar-meta"><span>Food</span><strong>₹7,280</strong></div><div class="track"><div class="fill" style="width:100%"></div></div></div>
+          <div class="bar-row"><div class="bar-meta"><span>Transport</span><strong>₹3,100</strong></div><div class="track"><div class="fill" style="width:43%"></div></div></div>
+          <div class="bar-row"><div class="bar-meta"><span>Shopping</span><strong>₹2,800</strong></div><div class="track"><div class="fill" style="width:38%"></div></div></div>
+          <div class="bar-row"><div class="bar-meta"><span>Bills</span><strong>₹2,400</strong></div><div class="track"><div class="fill" style="width:33%"></div></div></div>
+          <div class="bar-row"><div class="bar-meta"><span>Health</span><strong>₹1,540</strong></div><div class="track"><div class="fill" style="width:21%"></div></div></div>
+        </div>
+      </section>
+      <aside class="card" aria-label="Recent Expenses">
+        <h2>Recent Expenses</h2>
+        <div class="expense-row"><div><div class="expense-title">Food</div><div class="expense-note">Lunch · Today</div></div><div class="expense-amount">₹480</div></div>
+        <div class="expense-row"><div><div class="expense-title">Transport</div><div class="expense-note">Cab home · Today</div></div><div class="expense-amount">₹260</div></div>
+        <div class="expense-row"><div><div class="expense-title">Shopping</div><div class="expense-note">Notebook · Yesterday</div></div><div class="expense-amount">₹350</div></div>
+        <div class="expense-row"><div><div class="expense-title">Bills</div><div class="expense-note">Mobile plan · 13 Sep</div></div><div class="expense-amount">₹799</div></div>
+        <div class="expense-row"><div><div class="expense-title">Health</div><div class="expense-note">Pharmacy · 12 Sep</div></div><div class="expense-amount">₹420</div></div>
+      </aside>
+    </div>
+  </main>
+</body>
+</html>
diff --git a/_bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/mockups/home-mobile.html b/_bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/mockups/home-mobile.html
new file mode 100644
index 0000000..af56f82
--- /dev/null
+++ b/_bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/mockups/home-mobile.html
@@ -0,0 +1,320 @@
+<!doctype html>
+<html lang="en">
+<head>
+  <meta charset="utf-8">
+  <meta name="viewport" content="width=device-width, initial-scale=1">
+  <title>bmad-expense-tracker — Home Mobile Mockup</title>
+  <style>
+    /*
+      Governed by DESIGN.md: Brand & Style, Colors, Typography, Layout & Spacing, Components.
+      Governed by EXPERIENCE.md: Information Architecture, Component Patterns, State Patterns, Key Flows 1 and 3.
+    */
+    :root {
+      --surface-base: #FAFAF8;
+      --surface-raised: #FFFFFF;
+      --ink-primary: #1F2933;
+      --ink-secondary: #5B6673;
+      --ink-muted: #8A94A3;
+      --border-subtle: #E2E8ED;
+      --accent: #0F766E;
+      --accent-strong: #0B5F59;
+      --danger: #B42318;
+      --radius-md: 8px;
+      --radius-lg: 12px;
+      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
+    }
+    * { box-sizing: border-box; }
+    body {
+      margin: 0;
+      min-height: 100vh;
+      background: #ECEFEB;
+      color: var(--ink-primary);
+      display: grid;
+      place-items: center;
+      padding: 24px;
+    }
+    .phone {
+      width: 390px;
+      min-height: 844px;
+      background: var(--surface-base);
+      border: 1px solid #D5DBE1;
+      border-radius: 32px;
+      overflow: hidden;
+      box-shadow: 0 18px 50px rgba(31, 41, 51, 0.16);
+      position: relative;
+    }
+    .screen {
+      padding: 22px 16px 88px;
+    }
+    header {
+      display: flex;
+      justify-content: space-between;
+      align-items: flex-start;
+      gap: 12px;
+      margin-bottom: 18px;
+    }
+    h1 {
+      margin: 0;
+      font-size: 24px;
+      line-height: 1.25;
+      letter-spacing: 0;
+    }
+    .month {
+      color: var(--ink-secondary);
+      font-size: 14px;
+      margin-top: 3px;
+    }
+    .card {
+      background: var(--surface-raised);
+      border: 1px solid var(--border-subtle);
+      border-radius: var(--radius-lg);
+      padding: 14px;
+      margin-bottom: 14px;
+    }
+    .quick h2,
+    .summary h2,
+    .recent h2 {
+      margin: 0 0 12px;
+      font-size: 18px;
+      line-height: 1.3;
+      letter-spacing: 0;
+    }
+    label {
+      display: block;
+      font-size: 13px;
+      color: var(--ink-secondary);
+      margin-bottom: 6px;
+    }
+    .amount-field {
+      display: flex;
+      align-items: center;
+      border: 1px solid var(--border-subtle);
+      border-radius: var(--radius-md);
+      background: #fff;
+      min-height: 52px;
+      padding: 0 12px;
+      margin-bottom: 12px;
+    }
+    .currency {
+      color: var(--ink-secondary);
+      font-size: 24px;
+      margin-right: 8px;
+    }
+    .amount {
+      font-size: 28px;
+      font-weight: 700;
+      color: var(--ink-primary);
+    }
+    .chips {
+      display: flex;
+      flex-wrap: wrap;
+      gap: 8px;
+      margin-bottom: 12px;
+    }
+    .chip {
+      border: 1px solid var(--border-subtle);
+      border-radius: 9999px;
+      padding: 7px 11px;
+      font-size: 14px;
+      background: #fff;
+      color: var(--ink-primary);
+    }
+    .chip.selected {
+      background: var(--accent);
+      border-color: var(--accent);
+      color: #fff;
+    }
+    .row {
+      display: grid;
+      grid-template-columns: 1fr 1fr;
+      gap: 10px;
+      margin-bottom: 12px;
+    }
+    .input {
+      border: 1px solid var(--border-subtle);
+      border-radius: var(--radius-md);
+      background: #fff;
+      min-height: 42px;
+      padding: 10px;
+      color: var(--ink-primary);
+      font-size: 15px;
+    }
+    .save {
+      width: 100%;
+      min-height: 46px;
+      border: 0;
+      border-radius: var(--radius-md);
+      background: var(--accent);
+      color: #fff;
+      font-size: 16px;
+      font-weight: 700;
+    }
+    .total {
+      font-size: 30px;
+      line-height: 1.1;
+      font-weight: 750;
+      margin: 0 0 4px;
+    }
+    .muted {
+      color: var(--ink-secondary);
+      font-size: 14px;
+    }
+    .bar-row {
+      margin-top: 12px;
+    }
+    .bar-meta {
+      display: flex;
+      justify-content: space-between;
+      gap: 10px;
+      font-size: 14px;
+      margin-bottom: 6px;
+    }
+    .track {
+      height: 8px;
+      background: #EAF0EF;
+      border-radius: 9999px;
+      overflow: hidden;
+    }
+    .fill {
+      height: 100%;
+      background: var(--accent);
+      border-radius: 9999px;
+    }
+    .expense-row {
+      display: grid;
+      grid-template-columns: 1fr auto;
+      gap: 12px;
+      padding: 11px 0;
+      border-top: 1px solid var(--border-subtle);
+    }
+    .expense-row:first-of-type { border-top: 0; padding-top: 0; }
+    .expense-title {
+      font-weight: 650;
+      margin-bottom: 2px;
+    }
+    .expense-note {
+      font-size: 14px;
+      color: var(--ink-secondary);
+    }
+    .expense-amount {
+      font-weight: 700;
+      white-space: nowrap;
+    }
+    .bottom-nav {
+      position: absolute;
+      left: 0;
+      right: 0;
+      bottom: 0;
+      display: grid;
+      grid-template-columns: repeat(3, 1fr);
+      background: rgba(255, 255, 255, 0.96);
+      border-top: 1px solid var(--border-subtle);
+      padding: 8px 10px 14px;
+    }
+    .nav-item {
+      text-align: center;
+      color: var(--ink-secondary);
+      font-size: 13px;
+      padding: 8px 4px;
+      border-radius: var(--radius-md);
+    }
+    .nav-item.active {
+      color: var(--accent-strong);
+      font-weight: 700;
+      background: #E7F3F1;
+    }
+  </style>
+</head>
+<body>
+  <main class="phone" aria-label="Home mobile mockup">
+    <div class="screen">
+      <header>
+        <div>
+          <h1>Home</h1>
+          <div class="month">September 2026</div>
+        </div>
+      </header>
+
+      <section class="card quick" aria-label="Add Expense">
+        <h2>Add Expense</h2>
+        <label for="amount">Amount</label>
+        <div class="amount-field" id="amount">
+          <span class="currency">₹</span>
+          <span class="amount">480.00</span>
+        </div>
+        <label>Category</label>
+        <div class="chips">
+          <span class="chip selected">Food</span>
+          <span class="chip">Transport</span>
+          <span class="chip">Shopping</span>
+          <span class="chip">Bills</span>
+          <span class="chip">Entertainment</span>
+          <span class="chip">Other</span>
+        </div>
+        <div class="row">
+          <div>
+            <label>Date</label>
+            <div class="input">15 Sep 2026</div>
+          </div>
+          <div>
+            <label>Description optional</label>
+            <div class="input">Lunch</div>
+          </div>
+        </div>
+        <button class="save">Save Expense</button>
+      </section>
+
+      <section class="card summary" aria-label="Current Month Spending Summary">
+        <h2>Current Month</h2>
+        <p class="total">₹18,420</p>
+        <div class="muted">Total spending this month</div>
+        <div class="bar-row">
+          <div class="bar-meta"><span>Food</span><strong>₹7,280</strong></div>
+          <div class="track"><div class="fill" style="width: 100%"></div></div>
+        </div>
+        <div class="bar-row">
+          <div class="bar-meta"><span>Transport</span><strong>₹3,100</strong></div>
+          <div class="track"><div class="fill" style="width: 43%"></div></div>
+        </div>
+        <div class="bar-row">
+          <div class="bar-meta"><span>Shopping</span><strong>₹2,800</strong></div>
+          <div class="track"><div class="fill" style="width: 38%"></div></div>
+        </div>
+        <div class="bar-row">
+          <div class="bar-meta"><span>Bills</span><strong>₹2,400</strong></div>
+          <div class="track"><div class="fill" style="width: 33%"></div></div>
+        </div>
+      </section>
+
+      <section class="card recent" aria-label="Recent Expenses">
+        <h2>Recent Expenses</h2>
+        <div class="expense-row">
+          <div><div class="expense-title">Food</div><div class="expense-note">Lunch · Today</div></div>
+          <div class="expense-amount">₹480</div>
+        </div>
+        <div class="expense-row">
+          <div><div class="expense-title">Transport</div><div class="expense-note">Cab home · Today</div></div>
+          <div class="expense-amount">₹260</div>
+        </div>
+        <div class="expense-row">
+          <div><div class="expense-title">Shopping</div><div class="expense-note">Notebook · Yesterday</div></div>
+          <div class="expense-amount">₹350</div>
+        </div>
+        <div class="expense-row">
+          <div><div class="expense-title">Bills</div><div class="expense-note">Mobile plan · 13 Sep</div></div>
+          <div class="expense-amount">₹799</div>
+        </div>
+        <div class="expense-row">
+          <div><div class="expense-title">Health</div><div class="expense-note">Pharmacy · 12 Sep</div></div>
+          <div class="expense-amount">₹420</div>
+        </div>
+      </section>
+    </div>
+    <nav class="bottom-nav" aria-label="Primary navigation">
+      <div class="nav-item active">Home</div>
+      <div class="nav-item">Review</div>
+      <div class="nav-item">Categories</div>
+    </nav>
+  </main>
+</body>
+</html>
diff --git a/_bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/mockups/review-mobile.html b/_bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/mockups/review-mobile.html
new file mode 100644
index 0000000..287f50b
--- /dev/null
+++ b/_bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/mockups/review-mobile.html
@@ -0,0 +1,63 @@
+<!doctype html>
+<html lang="en">
+<head>
+  <meta charset="utf-8">
+  <meta name="viewport" content="width=device-width, initial-scale=1">
+  <title>bmad-expense-tracker — Expense Review Mobile Mockup</title>
+  <style>
+    /*
+      Governed by DESIGN.md: Colors, Typography, Components.
+      Governed by EXPERIENCE.md: Information Architecture, Component Patterns, Interaction Primitives, Key Flow 2.
+    */
+    :root {
+      --surface-base: #FAFAF8;
+      --surface-raised: #FFFFFF;
+      --ink-primary: #1F2933;
+      --ink-secondary: #5B6673;
+      --border-subtle: #E2E8ED;
+      --accent: #0F766E;
+      --accent-strong: #0B5F59;
+      --radius-md: 8px;
+      --radius-lg: 12px;
+      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
+    }
+    * { box-sizing: border-box; }
+    body { margin: 0; min-height: 100vh; background: #ECEFEB; display: grid; place-items: center; padding: 24px; color: var(--ink-primary); }
+    .phone { width: 390px; min-height: 844px; background: var(--surface-base); border: 1px solid #D5DBE1; border-radius: 32px; overflow: hidden; box-shadow: 0 18px 50px rgba(31, 41, 51, 0.16); position: relative; }
+    .screen { padding: 22px 16px 88px; }
+    h1 { margin: 0 0 4px; font-size: 24px; line-height: 1.25; letter-spacing: 0; }
+    .subtitle { color: var(--ink-secondary); font-size: 14px; margin-bottom: 18px; }
+    .list { background: var(--surface-raised); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 4px 14px; }
+    .expense-row { display: grid; grid-template-columns: 1fr auto; gap: 12px; padding: 14px 0; border-top: 1px solid var(--border-subtle); }
+    .expense-row:first-child { border-top: 0; }
+    .category { font-weight: 650; margin-bottom: 3px; }
+    .meta { color: var(--ink-secondary); font-size: 14px; line-height: 1.4; }
+    .amount { font-weight: 750; white-space: nowrap; }
+    .bottom-nav { position: absolute; left: 0; right: 0; bottom: 0; display: grid; grid-template-columns: repeat(3, 1fr); background: rgba(255, 255, 255, 0.96); border-top: 1px solid var(--border-subtle); padding: 8px 10px 14px; }
+    .nav-item { text-align: center; color: var(--ink-secondary); font-size: 13px; padding: 8px 4px; border-radius: var(--radius-md); }
+    .nav-item.active { color: var(--accent-strong); font-weight: 700; background: #E7F3F1; }
+  </style>
+</head>
+<body>
+  <main class="phone" aria-label="Expense Review mobile mockup">
+    <div class="screen">
+      <h1>Review</h1>
+      <div class="subtitle">All recorded expenses, most recent first.</div>
+      <section class="list" aria-label="All Expenses">
+        <div class="expense-row"><div><div class="category">Food</div><div class="meta">Lunch · 15 Sep 2026</div></div><div class="amount">₹480</div></div>
+        <div class="expense-row"><div><div class="category">Transport</div><div class="meta">Cab home · 15 Sep 2026</div></div><div class="amount">₹260</div></div>
+        <div class="expense-row"><div><div class="category">Shopping</div><div class="meta">Notebook · 14 Sep 2026</div></div><div class="amount">₹350</div></div>
+        <div class="expense-row"><div><div class="category">Bills</div><div class="meta">Mobile plan · 13 Sep 2026</div></div><div class="amount">₹799</div></div>
+        <div class="expense-row"><div><div class="category">Health</div><div class="meta">Pharmacy · 12 Sep 2026</div></div><div class="amount">₹420</div></div>
+        <div class="expense-row"><div><div class="category">Education</div><div class="meta">Course book · 10 Sep 2026</div></div><div class="amount">₹1,200</div></div>
+        <div class="expense-row"><div><div class="category">Entertainment</div><div class="meta">Movie · 08 Sep 2026</div></div><div class="amount">₹650</div></div>
+      </section>
+    </div>
+    <nav class="bottom-nav" aria-label="Primary navigation">
+      <div class="nav-item">Home</div>
+      <div class="nav-item active">Review</div>
+      <div class="nav-item">Categories</div>
+    </nav>
+  </main>
+</body>
+</html>
diff --git a/_bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/reconcile-prd.md b/_bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/reconcile-prd.md
new file mode 100644
index 0000000..6d2c4a5
--- /dev/null
+++ b/_bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/reconcile-prd.md
@@ -0,0 +1,162 @@
+---
+title: PRD Reconciliation for UX Spines
+input: source-extract-prd.md
+compared:
+  - DESIGN.md
+  - EXPERIENCE.md
+created: 2026-09-15
+updated: 2026-09-15
+status: complete
+---
+
+# PRD Reconciliation for UX Spines
+
+## Inputs
+
+- PRD source extract: `source-extract-prd.md`
+- Design spine: `DESIGN.md`
+- Experience spine: `EXPERIENCE.md`
+
+## Overall Assessment
+
+The UX spines are broadly aligned with the PRD source extract. They preserve the lightweight single-user scope, keep Expense entry primary, avoid full personal-finance platform patterns, and translate the PRD's Record -> Review -> Understand loop into a compact Home / Review / Categories IA.
+
+The major UX choices are supportable from the PRD: Home emphasizes Add Expense, Current Month awareness, and Recent Expenses; Category management exists only to support Expense entry and summaries; visual direction avoids dense analytics and complex finance-app affordances. Two PRD open questions are resolved by the UX spines: Home Recent Expenses shows 5 items, and the MVP includes a simple all-Expense Review surface.
+
+The main reconciliation gaps are small but important implementation-facing details: expense ordering should use Expense date descending with a stable same-date tie-breaker, not only "most recently recorded"; Current Month summary empty-state wording should not weaken the requirement that the main experience shows the Current Month total and Category breakdown; cancel behavior for Edit should be stated explicitly; and success/failure feedback should include failure feedback for operations, not only form validation and success toasts.
+
+## Confirmed Alignments
+
+### Product focus and scope
+
+The PRD defines a focused, lightweight, single-user expense tracker rather than a full personal-finance platform (`source-extract-prd.md` lines 14-22, 46-53, 313-336). DESIGN matches this with a simple, dependable utility style, restrained hierarchy, and an explicit warning against heavy fintech or analytics-dashboard aesthetics (`DESIGN.md` lines 87-101, 139-143). EXPERIENCE matches this with a mobile-first responsive web app, limited destinations, no advanced list interactions, and no analytics-style exploration (`EXPERIENCE.md` lines 14-34, 64-65, 86-93).
+
+Status: aligned.
+
+### Record flow
+
+The PRD requires the common Expense entry path to be fast, with amount first, Category selection, date defaulted to today, optional description, and Save available from the main experience (`source-extract-prd.md` lines 65-77, 133-152, 268-275). EXPERIENCE makes Add Expense inline at the top of Home, places amount first, uses Category chips, defaults date to today, keeps description optional, and resets after save for repeated entry (`EXPERIENCE.md` lines 22, 28, 32, 60, 106-115). DESIGN supports this by making the amount input prominent and keeping Add Expense visually primary (`DESIGN.md` lines 111, 127-131, 141).
+
+Status: aligned.
+
+### Current Month understanding
+
+The PRD requires Current Month total spending, Current Month Category breakdown, and Current Month Recent Expenses on the main experience, with summaries updating after Expense changes (`source-extract-prd.md` lines 98-112, 116-131). EXPERIENCE provides Current Month total, ranked Category breakdown, Recent Expenses, and summary/list updates after add/edit/delete (`EXPERIENCE.md` lines 22, 62-64, 76, 115, 126, 128-134). DESIGN supports this with readable hierarchy and simple horizontal bars rather than heavier charting (`DESIGN.md` lines 91, 105, 111, 142).
+
+Status: aligned with one empty-state wording caveat below.
+
+### Expense review, detail, edit, and delete
+
+The PRD requires identifiable Recent Expenses, access to detail from list/summary context, detail fields, edit/delete actions, delete confirmation, and no undo/recovery (`source-extract-prd.md` lines 79-96, 154-197). EXPERIENCE provides Expense rows that show amount, Category, date, and optional description; rows open detail; detail exposes Edit/Delete; edit uses the Expense form pattern; delete confirmation is required and no undo/recovery is included (`EXPERIENCE.md` lines 64-69, 83, 88-92, 117-126). DESIGN reinforces clean rows without inline edit/delete actions (`DESIGN.md` lines 132, 143).
+
+Status: mostly aligned; explicit edit-cancel behavior should be added.
+
+### Category selection and management
+
+The PRD requires Default Categories available immediately, Custom Category add/rename/delete rules, in-use deletion blocking, Default Category protection, and a non-heavy category-management surface (`source-extract-prd.md` lines 199-232, 254-258, 282-286). EXPERIENCE defines Default and Custom Category chips in Add/Edit, a Categories surface with protected Default Categories, Custom Category Add/Edit/Delete, confirmation for eligible deletion, and blocked deletion copy for in-use categories (`EXPERIENCE.md` lines 61, 69-70, 82-84, 136-144). DESIGN uses compact Category chips with clear selected state (`DESIGN.md` lines 80-84, 131).
+
+Status: aligned.
+
+### Currency and visual treatment
+
+The PRD requires INR as the single application-level currency and excludes per-Expense currency selection, conversion, and exchange rates (`source-extract-prd.md` lines 141-144, 307-311). EXPERIENCE specifies INR display for amount entry and Current Month total (`EXPERIENCE.md` lines 60, 62). DESIGN specifies INR symbol treatment in the amount input (`DESIGN.md` line 130).
+
+Status: aligned.
+
+### Accessibility and validation
+
+The PRD requires meaningful labels, keyboard access, understandable validation feedback, mobile-usable controls, and basic assistive-technology support (`source-extract-prd.md` lines 240-246, 288-296). EXPERIENCE captures labeled controls, associated validation feedback, keyboard access, reading-order focus, comfortable touch targets, and non-color-only states (`EXPERIENCE.md` lines 80-81, 95-102). DESIGN reinforces contrast, readable sizing, and clear validation text (`DESIGN.md` lines 103-107, 127-130).
+
+Status: aligned.
+
+## Resolved PRD Open Questions
+
+### Recent Expenses count
+
+The PRD leaves the number of Recent Expenses open (`source-extract-prd.md` lines 165-167, 349-352). EXPERIENCE resolves this as 5 Recent Expenses on Home (`EXPERIENCE.md` lines 22, 64, 133).
+
+Assessment: acceptable. Five is a reasonable mobile-first default because it keeps Recent Expenses visible without pushing the Add Expense and Current Month summary too far down the Home screen.
+
+### All-Expense browsing
+
+The PRD leaves open whether the MVP needs all-Expense browsing beyond Recent Expenses, with a default stance of Recent Expenses plus Current Month Recent Expenses unless UX determines browsing is required (`source-extract-prd.md` lines 234-236, 349-352). EXPERIENCE adds an Expense Review surface with a simple scrollable all-Expenses list (`EXPERIENCE.md` lines 23, 64-65, 117-126).
+
+Assessment: acceptable with scope guard. The Review surface supports PRD UJ-2 by making later review and correction easier, but it must remain simple: no search, filters, sorting, pagination, analytics, grouping, or dense table behavior in MVP, as EXPERIENCE already states (`EXPERIENCE.md` line 65).
+
+## Gaps and Reconciliation Notes
+
+### Ordering semantics are slightly inconsistent
+
+The PRD says Recent Expenses are ordered by Expense date descending and need a stable same-date tie-breaker (`source-extract-prd.md` lines 87-88, 161-162). EXPERIENCE says Home Recent Expenses are ordered by "most recently recorded first" and Review is "most recently recorded/dated first" (`EXPERIENCE.md` lines 64-65).
+
+Risk: This can produce behavior that violates the PRD when a user records an older Expense today. The older Expense could appear above a newer Expense if ordered by creation time instead of Expense date.
+
+Reconciliation: Treat the PRD as authoritative. UX should specify: sort by Expense date descending; for Expenses with the same Expense date, use a stable tie-breaker such as created-at descending or internal id descending. If the desired tie-breaker is "most recently recorded," state it only as the same-date tie-breaker.
+
+### Current Month empty-state wording may obscure required totals
+
+The PRD requires the main experience to show Current Month total spending and Category breakdown, and summaries must correctly handle Current Month calculations (`source-extract-prd.md` lines 104-112, 120-125, 262-264). EXPERIENCE says the Current Month summary uses an empty state rather than misleading zeros (`EXPERIENCE.md` line 76).
+
+Risk: If interpreted literally, the UI may omit a visible Current Month total when there are no Current Month Expenses, weakening the PRD requirement that the main experience shows the total.
+
+Reconciliation: Keep the empty-state intent but make it compatible with the PRD. The Home summary should still show a Current Month total of INR 0 when there are no Current Month Expenses, with supportive empty copy for the Category breakdown and Recent Expenses. Avoid fake Category bars or sample data.
+
+### Edit cancel behavior is not explicit
+
+The PRD requires canceling an edit to leave the Expense unchanged (`source-extract-prd.md` lines 92-93, 184-187). EXPERIENCE describes the Edit form and Save behavior but does not explicitly state Cancel behavior (`EXPERIENCE.md` lines 68, 117-126).
+
+Risk: Implementers may omit a Cancel action or route cancellation inconsistently.
+
+Reconciliation: Add an explicit behavioral rule: Edit Expense includes Cancel/Back behavior that discards unsaved changes and returns to Expense Detail without mutating the Expense.
+
+### Operation failure feedback is underspecified
+
+The PRD requires save, edit, and delete actions to provide visible success or failure feedback (`source-extract-prd.md` lines 248-252). EXPERIENCE specifies success toasts and inline validation errors (`EXPERIENCE.md` lines 79-81), but it does not clearly cover operation-level failures such as failed save/delete after valid input.
+
+Risk: Implementers may handle validation errors but not failed persistence or failed mutation states.
+
+Reconciliation: Add a concise failure-feedback pattern for Expense and Category operations. Failure feedback should keep the user in context, identify that the action did not complete, and preserve entered data where applicable.
+
+### Category renaming association preservation is implicit
+
+The PRD requires renaming a Custom Category to preserve association with existing Expenses (`source-extract-prd.md` lines 212-219, 282-286). EXPERIENCE says Custom Categories support Add/Edit/Delete and saving updates the section (`EXPERIENCE.md` lines 70, 136-144), but it does not explicitly state that renaming preserves existing Expense associations.
+
+Risk: Implementation could treat rename as delete/recreate and accidentally break historical Expense associations.
+
+Reconciliation: Add an explicit Category Management rule: renaming a Custom Category updates its name in all existing Expense references without orphaning or reassigning Expenses.
+
+## Source Fact Coverage Matrix
+
+| PRD requirement area | UX spine coverage | Status |
+|---|---|---|
+| Lightweight single-user utility | DESIGN utility style; EXPERIENCE limited IA | Covered |
+| Amount, Category, Date, optional Description | Add/Edit Expense form pattern | Covered |
+| Amount first and fast common entry | Home inline form; amount first; Save prominent | Covered |
+| Date defaults to today and editable | Add/Edit form pattern and Flow 1 | Covered |
+| INR only | Amount input and Current Month total | Covered |
+| Recent Expenses identity info | Rows show amount, Category, date, optional description | Covered |
+| Recent Expenses date-desc ordering | EXPERIENCE wording conflicts with PRD ordering | Needs adjustment |
+| Expense detail with edit/delete | Detail surface and row navigation | Covered |
+| Edit supports all fields | Edit form pattern | Covered |
+| Edit cancel leaves unchanged | Not explicit | Needs adjustment |
+| Delete confirmation and no recovery | Confirmation pattern; no undo/recovery | Covered |
+| Current Month total and Category breakdown | Home total and ranked nonzero Category bars | Covered |
+| Summary updates after mutations | Flow and component rules | Covered |
+| Default Categories available/protected | Category chips and protected Default Categories | Covered |
+| Custom Category add/rename/delete rules | Category Management mostly covers | Minor clarification needed |
+| In-use Custom Category deletion blocked | State pattern and copy | Covered |
+| Accessibility basics | Accessibility Floor and visual readability | Covered |
+| Operation success/failure feedback | Success covered; failure partial | Needs adjustment |
+| Scope exclusions | IA and interaction primitives avoid advanced finance features | Covered |
+
+## Recommended Spine Updates
+
+1. In `EXPERIENCE.md`, revise Recent Expenses and Expense Review ordering to "Expense date descending, with a stable same-date tie-breaker such as recorded time descending."
+2. In `EXPERIENCE.md`, clarify that the empty Current Month summary still shows INR 0 total while Category breakdown uses empty copy when no Current Month Expenses exist.
+3. In `EXPERIENCE.md`, add explicit Cancel behavior for Edit Expense.
+4. In `EXPERIENCE.md`, add operation-level failure feedback for failed save/update/delete actions.
+5. In `EXPERIENCE.md`, state that Custom Category rename preserves existing Expense associations.
+
+## Reconciliation Decision
+
+The UX spines are acceptable as draft spines against the PRD, with the above adjustments recommended before finalization or implementation handoff. No major PRD requirements are missing, and the UX-added Review surface is justified as a simple support surface for review/correction rather than scope expansion.
diff --git a/_bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/source-extract-prd.md b/_bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/source-extract-prd.md
new file mode 100644
index 0000000..a52406e
--- /dev/null
+++ b/_bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/source-extract-prd.md
@@ -0,0 +1,352 @@
+---
+title: UX Source Extract from PRD
+source: ../../prds/prd-bmad-expense-tracker-2026-09-15/prd.md
+source_status: final
+created: 2026-09-15
+updated: 2026-09-15
+product: bmad-expense-tracker
+---
+
+# UX Source Extract from PRD
+
+## Product Thesis
+
+`bmad-expense-tracker` helps an individual know where their money went without turning Expense tracking into work. The product is a focused, lightweight single-user expense tracker, not a full personal-finance platform.
+
+The core loop is Record -> Review -> Understand:
+
+- Record everyday spending quickly.
+- Review Recent Expenses later.
+- Understand Current Month spending through totals, Category breakdown, and Recent Expenses.
+
+The MVP should feel lighter than a spreadsheet and less demanding than a finance app that expects bank connections, budgets, accounts, goals, and dense dashboards. It earns trust through focus, useful defaults, common actions kept close, and minimal data entry.
+
+The MVP asks only for information needed to make spending visible:
+
+- Amount.
+- Category.
+- Date.
+- Optional description.
+
+## Target User
+
+The target user is an individual working professional with regular day-to-day Expenses who wants better spending awareness without using a complex personal-finance system.
+
+The user:
+
+- Wants quick, low-friction capture of everyday Expenses.
+- Wants a simple way to understand where money is going.
+- Is not trying to manage every part of their financial life in this product.
+- Has basic-to-moderate software comfort.
+- Should not need spreadsheet habits, accounting knowledge, or prior personal-finance app experience.
+- Needs the product to be approachable, mobile-friendly, and understandable from the screen itself rather than through instructions.
+
+UX decisions should favor features that help this user record spending faster, review Expenses more clearly, or understand Current Month spending with less effort.
+
+## Non-Users for MVP
+
+The MVP is not aimed at:
+
+- People who require bank or credit-card synchronization as the primary value.
+- People looking for a full personal-finance platform with income, investments, budgets, bills, goals, forecasting, and advice.
+- Households, teams, or collaborators who need shared expenses, roles, permissions, or multi-user workflows.
+- Users who need accounting-grade reporting, tax workflows, reimbursement flows, or business expense management.
+
+## Key Jobs To Be Done
+
+- When I make an everyday purchase, I want to record it quickly before I forget the details.
+- When I open the app later, I want to see Recent Expenses so I can confirm what I have captured.
+- When I think about this month's spending, I want to see the current total and category breakdown without building a spreadsheet.
+- When my spending habits change, I want categories that are simple enough to use immediately but flexible enough to reflect my life.
+- When I use the product over time, I want expense tracking to feel lightweight enough that I can keep doing it.
+
+## Key User Journeys
+
+### UJ-1: Record a Purchase Immediately After It Happens
+
+The user opens the app, enters the amount, selects a Category, accepts the default date or changes it if necessary, optionally adds a description, and saves the Expense.
+
+UX facts:
+
+- The common case should be completable in under 30 seconds.
+- Date defaults to today.
+- Description is optional.
+- The common path requires only amount entry, Category selection, and save.
+- The amount field is the first required entry field in the common Expense entry flow.
+- A prominent way to start adding an Expense is required from the main experience.
+- The user should not need to navigate through multiple unrelated screens to save a normal Expense.
+
+### UJ-2: Review Recent Expenses Later in the Day or Week
+
+The user opens the app and reviews recently recorded Expenses to confirm what they spent and when. If they notice an error, they can identify the Expense and edit or delete it.
+
+UX facts:
+
+- Recent Expenses must show enough information to identify each Expense: amount, Category, and date.
+- Description is shown when available or accessible from an Expense detail view.
+- Recent Expenses are ordered by Expense date descending.
+- Expenses on the same date need a stable tie-breaker so ordering is predictable.
+- The user can open an Expense from a list or summary context.
+- Expense detail shows amount, Category, date, and description when provided.
+- Expense detail gives access to edit and delete actions.
+- Editing supports amount, Category, date, and description.
+- Canceling an edit leaves the Expense unchanged.
+- Delete requires confirmation.
+- Canceling deletion leaves the Expense unchanged.
+- The MVP does not provide undo, trash, archive, recovery, or deletion recovery.
+
+### UJ-3: Understand Current Month Spending by Total and Category
+
+The user views the main screen and sees Current Month total spending, a Category-level breakdown, and Recent Expenses. The user should understand where money has gone without navigating through a complex analytics system.
+
+UX facts:
+
+- Main experience should show Current Month total spending.
+- Main experience should show Current Month spending grouped by Category.
+- Main experience should show Current Month Recent Expenses.
+- Current Month is the calendar month containing today.
+- Current Month totals include Expenses dated within the Current Month.
+- Current Month totals exclude Expenses dated outside the Current Month.
+- Category totals include only Expenses dated within the Current Month.
+- The summary should help answer where money went this month without advanced analytics.
+- Summary data must update after relevant Expense add, edit, and delete operations.
+
+## Feature Surfaces Implied
+
+### Main Experience / Current Month Overview
+
+Implied content and actions:
+
+- Current Month total spending.
+- Current Month spending by Category.
+- Current Month Recent Expenses.
+- Prominent add Expense entry point.
+- Enough Recent Expense information to identify amount, Category, and date.
+- Visible updates after Expense create, edit, and delete operations.
+
+Primary questions the screen must answer:
+
+- "How much did I spend this month?"
+- "Where did most of my money go this month?"
+- "What did I recently record?"
+
+### Add Expense Flow
+
+Required fields and behavior:
+
+- Amount.
+- Category.
+- Date defaulted to today and editable.
+- Optional description.
+- Save blocked until amount, Category, and date are valid.
+- INR (₹) displayed as the single application-level currency.
+- No per-Expense currency selector.
+- No currency conversion, exchange rates, or multi-currency tracking.
+
+Required UX qualities:
+
+- Fast common path.
+- Low friction.
+- Amount first among required fields.
+- Description must not block save.
+- Validation feedback understandable to a user with basic-to-moderate software comfort.
+
+### Recent Expenses List
+
+Required content and behavior:
+
+- List of recently recorded Expenses.
+- Each listed Expense shows amount, Category, and date.
+- Description is shown when available or accessible from detail.
+- Ordered by Expense date descending.
+- Stable tie-breaker for Expenses with the same date.
+- Expense can be opened from list or summary context.
+
+Open UX decision:
+
+- Number of Recent Expenses to show.
+
+### Expense Detail
+
+Required content and behavior:
+
+- Amount.
+- Category.
+- Date.
+- Description when provided.
+- Edit action.
+- Delete action.
+
+### Edit Expense Flow
+
+Required behavior:
+
+- User can update amount, Category, date, and description.
+- Same required-field validation as create applies.
+- Saving updates Recent Expenses and any relevant Spending Summary.
+- Canceling leaves Expense unchanged.
+
+### Delete Expense Confirmation
+
+Required behavior:
+
+- User can initiate deletion from detail or maintenance context.
+- System asks for confirmation before deleting.
+- Confirming removes Expense from Recent Expenses and relevant Spending Summary.
+- Canceling leaves Expense unchanged.
+- No undo or recovery is required.
+
+### Category Selection
+
+Required behavior:
+
+- Default Categories are available immediately.
+- Default Categories can be used when creating or editing an Expense.
+- Starter examples: Food, Transport, Shopping, Bills, Entertainment, Health, Education, Other.
+- UX and design may refine the starter Default Category set for clear usability reasons without expanding into complex category systems.
+
+### Custom Category Management
+
+Required behavior:
+
+- User can create a Custom Category with a valid name.
+- Created Custom Category becomes available for creating and editing Expenses.
+- User can rename a Custom Category.
+- Renaming preserves association with existing Expenses.
+- A Custom Category with no associated Expenses can be deleted.
+- A Custom Category associated with one or more Expenses cannot be deleted.
+- When deletion is blocked, the system explains that the Category is in use and those Expenses must be reassigned before deleting the Category.
+- The product does not automatically reassign Expenses, create orphaned Expense records, or provide Category deletion recovery.
+
+Scope constraint:
+
+- Category management exists to support Expense entry and clear Spending Summaries. It is not an independent management-heavy surface.
+- No nested categories, complex rules, or automation in the MVP.
+
+### Default Category Protection
+
+Required behavior:
+
+- Default Categories cannot be deleted in the MVP.
+- Default Categories cannot be modified in a way that breaks existing Expenses or removes immediately available starter Categories.
+- Default Categories remain available for Expense creation and editing.
+
+### Optional All-Expense Browsing
+
+The PRD leaves open whether the MVP needs a dedicated way to browse all Expenses beyond Recent Expenses. The default MVP stance is Recent Expenses plus Current Month Recent Expenses unless UX determines all-Expense browsing is required for basic review.
+
+## State and Feedback Requirements
+
+Forms:
+
+- Required amount, Category, and date validation.
+- Understandable validation feedback.
+- Meaningful labels.
+- Keyboard access for applicable form fields and buttons.
+- Common form controls usable at common mobile widths.
+
+Operations:
+
+- Save, edit, and delete actions provide visible success or failure feedback.
+- Spending Summary must not become stale after Expense or Category operations.
+- Expense and Category operations must maintain consistent associations.
+
+Deletion:
+
+- Expense deletion requires confirmation.
+- Custom Category deletion is blocked when the Category is associated with existing Expenses.
+- Blocked Category deletion explains why deletion is unavailable and what the user must do first.
+
+Empty and boundary states implied by requirements:
+
+- New user can record Expenses using Default Categories before creating Custom Categories.
+- Summary views must handle Current Month calculations based on Expenses dated inside or outside the Current Month.
+- Description may be absent and should not create a confusing blank state.
+
+## NFR / UX Constraints
+
+Usability:
+
+- Approachable.
+- Mobile-friendly.
+- Low-friction.
+- Understandable without requiring user instructions.
+- Common Expense entry flow remains simple and quick.
+- Common Expense entry should be under 30 seconds with default date and no description.
+
+Performance:
+
+- Common screens and Expense save operations should feel responsive for the expected small personal dataset.
+- No production-scale load or performance targets are required.
+
+Data integrity:
+
+- Expense and Category operations maintain consistent associations.
+- Spending Summaries accurately reflect Expense changes.
+- Categories associated with existing Expenses must not be deleted.
+
+Accessibility:
+
+- Basic accessibility expectations apply.
+- Semantic structure.
+- Keyboard accessibility where applicable.
+- Meaningful labels.
+- Appropriate and understandable validation feedback.
+- Sufficient usability for common assistive technologies.
+- No formal certification target.
+
+Privacy and security:
+
+- Single-user learning application.
+- Real authentication is not required.
+- Avoid unnecessarily exposing Expense data.
+- Validate inputs.
+- Follow reasonable basic web security practices.
+- Bank credentials, financial-account credentials, and sensitive financial integrations are outside MVP.
+
+Currency:
+
+- INR (₹) is the single implicit application-level currency.
+- No per-Expense currency handling.
+- No multi-currency, exchange rate, or currency conversion UX.
+
+Scope boundaries:
+
+- No real accounts, roles, permissions, sharing, collaboration, or household workflows.
+- No income tracking.
+- No bank or credit-card integration.
+- No automatic transaction imports.
+- No investments.
+- No bill management.
+- No complex budgeting.
+- No savings or financial goals.
+- No forecasting.
+- No receipt scanning or OCR.
+- No automatic categorization.
+- No recurring Expense automation.
+- No advanced notifications.
+- No advanced analytics, previous-month comparisons, percentage changes, trend analysis, or month-over-month reporting.
+- No AI-powered financial advice.
+- No payments, transfers, or money movement.
+- No business expense, accounting, reimbursement, tax, or export workflows.
+
+Counter-metric:
+
+- Do not optimize for feature count.
+- Added features should not make Expense entry slower or make the MVP harder to understand.
+
+## Terms to Preserve
+
+- Expense.
+- Category.
+- Default Category.
+- Custom Category.
+- Current Month.
+- Recent Expenses.
+- Spending Summary.
+- Record -> Review -> Understand.
+
+## Unresolved Open Questions
+
+1. Recent Expenses count: determine the appropriate number of Recent Expenses to show based on main-screen UX and mobile usability.
+2. Expense browsing: determine whether the MVP needs a dedicated way to browse all Expenses beyond the Recent Expenses view. The default MVP stance is Recent Expenses plus Current Month Recent Expenses unless UX determines all-Expense browsing is required for basic review.
diff --git a/_bmad-output/specs/spec-bmad-expense-tracker/.memlog.md b/_bmad-output/specs/spec-bmad-expense-tracker/.memlog.md
new file mode 100644
index 0000000..97df233
--- /dev/null
+++ b/_bmad-output/specs/spec-bmad-expense-tracker/.memlog.md
@@ -0,0 +1,30 @@
+---
+topic: bmad-expense-tracker implementation-ready MVP specification
+updated: 2026-09-16T12:33
+---
+
+- (direction) Use finalized Product Brief, PRD, DESIGN.md, EXPERIENCE.md, and ARCHITECTURE-SPINE.md as source of truth; refine for implementation-ready epics/stories without expanding MVP scope.
+- (decision) Spec slug is bmad-expense-tracker because all source artifacts target the same MVP product.
+- (decision) PRD open questions are resolved by finalized UX: Home shows 5 Recent Expenses, and Expense Review provides a simple all-expenses list.
+- (decision) Adopt DESIGN.md, EXPERIENCE.md, and ARCHITECTURE-SPINE.md as companions because downstream needs their visual, behavioral, and implementation rules.
+- (capability) CAP-1 Expense Recording: User can quickly create an expense with amount, category, date defaulted to today, and optional description; success is valid save in under 30 seconds using amount, category, and save with INR display.
+- (capability) CAP-2 Expense Review and Maintenance: User can review recent and all recorded expenses, inspect one expense, edit it, or delete it after confirmation; success is lists/details/summaries reflect add/edit/delete accurately.
+- (capability) CAP-3 Category Management: User can use protected default categories and manage simple custom categories; success is defaults are always available, custom renames preserve associations, and in-use custom deletes are blocked.
+- (capability) CAP-4 Current-Month Spending Summary: User can understand current-month spending through total amount, category breakdown, and recent expenses; success is current-month totals include only current-month expenses and update after changes.
+- (constraint) MVP is a single-user internal learning web app with no real authentication, accounts, roles, permissions, sharing, collaboration, user table, user ownership, deployment requirement, or production-grade operational target.
+- (constraint) Expense model is limited to amount, category, date, and optional description; payment method, merchant, location, receipt, account, tags, currency selection, and similar fields are outside MVP.
+- (constraint) Amounts use one implicit application-level INR currency, display ₹, require positive values up to 2 decimal places, and must not introduce per-expense currency, conversion, or exchange rates.
+- (constraint) Date defaults to today, remains editable, uses Asia/Kolkata current-month semantics, and lists order by expense date descending with created time as same-date tie-breaker.
+- (constraint) Home prioritizes inline Add Expense, current-month summary, and exactly 5 Recent Expenses; Review lists all expenses in one simple scroll without search, filtering, grouping, pagination, or advanced analytics.
+- (constraint) Default categories include everyday options such as Food, Transport, Shopping, Bills, Entertainment, Health, Education, and Other; defaults are protected from destructive changes.
+- (constraint) Custom category deletion is allowed only when unused; in-use deletion is blocked with explanatory feedback and no automatic expense reassignment.
+- (constraint) UX must follow adopted DESIGN.md and EXPERIENCE.md for mobile-first IA, component behavior, feedback states, accessibility floor, microcopy, colors, typography, and layout.
+- (constraint) Architecture must follow adopted ARCHITECTURE-SPINE.md: React/Vite TypeScript frontend, ASP.NET Core Web API, PostgreSQL, explicit DTO REST contracts, layered backend, TanStack Query server state, and committed EF migrations.
+- (constraint) Monetary persistence must use .NET decimal and PostgreSQL numeric(12,2); summary data is calculated on demand from normalized expenses/categories, not denormalized summary state.
+- (constraint) Validation is enforced on both frontend and backend; API errors use ProblemDetails/ValidationProblemDetails and operations must preserve data integrity and fresh summaries.
+- (constraint) Verification must cover backend business rules, PostgreSQL-sensitive API/EF behavior, meaningful frontend form/interactions, and a few critical E2E journeys without chasing 100 percent coverage.
+- (decision) Non-goals include full personal finance, budgeting/goals, bank sync/imports, income, investments, bills, forecasting, OCR, automation, notifications, AI advice, payments, multi-user, business/accounting/tax/export, advanced analytics, multi-currency, and deployment.
+- (assumption) Entity id type follows architecture assumption of Guid unless implementation selects a simpler numeric id before the first migration.
+- (event) Coherence validation passed: four capabilities have intent and success, constraints bend implementation, non-goals are explicit, and success signal is testable.
+- (event) Preservation validation passed: load-bearing source claims are represented in SPEC.md or adopted companions; wrapper-only planning ceremony was intentionally omitted.
+- (event) Spec finalized for epics and stories from finalized artifacts without MVP scope expansion.
diff --git a/_bmad-output/specs/spec-bmad-expense-tracker/SPEC.md b/_bmad-output/specs/spec-bmad-expense-tracker/SPEC.md
new file mode 100644
index 0000000..99d3bee
--- /dev/null
+++ b/_bmad-output/specs/spec-bmad-expense-tracker/SPEC.md
@@ -0,0 +1,69 @@
+---
+id: SPEC-bmad-expense-tracker
+companions:
+  - ../../planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/DESIGN.md
+  - ../../planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/EXPERIENCE.md
+  - ../../planning-artifacts/architecture/architecture-bmad-expense-tracker-2026-09-15/ARCHITECTURE-SPINE.md
+sources:
+  - ../../planning-artifacts/briefs/brief-bmad-expense-tracker-2026-09-15/brief.md
+  - ../../planning-artifacts/prds/prd-bmad-expense-tracker-2026-09-15/prd.md
+---
+
+> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability only.
+
+# bmad-expense-tracker
+
+## Why
+
+bmad-expense-tracker exists to help an individual record everyday spending quickly and understand current-month spending without adopting spreadsheets or a full personal-finance platform. It is also an internal BMAD learning MVP, so the product must stay small enough to implement, test, review, and trace cleanly from planning artifacts into epics and stories.
+
+## Capabilities
+
+- **CAP-1**
+  - **intent:** User can quickly create an expense with amount, category, date defaulted to today, and optional description.
+  - **success:** A normal expense can be saved in under 30 seconds using amount, category, and save; the saved expense displays as INR (`₹`) and does not require description or currency selection.
+
+- **CAP-2**
+  - **intent:** User can review recent and all recorded expenses, inspect one expense, edit it, or delete it after confirmation.
+  - **success:** Expense lists, detail, and current-month summary reflect create, edit, and delete operations accurately; canceling edit or delete leaves the expense unchanged.
+
+- **CAP-3**
+  - **intent:** User can use protected default categories and manage simple custom categories for expense entry and summaries.
+  - **success:** Default categories are available immediately and cannot be destructively changed; custom category renames preserve existing expense associations, and deletion is blocked when a category is used by expenses.
+
+- **CAP-4**
+  - **intent:** User can understand current-month spending through total amount, category breakdown, and recent expenses.
+  - **success:** The main experience answers "How much did I spend this month?" and "Where did most of my money go this month?" using only expenses dated within the current month, updating after every relevant expense change.
+
+## Constraints
+
+- The MVP is a single-user internal learning web app with no real authentication, accounts, roles, permissions, sharing, collaboration, user table, user ownership, deployment requirement, or production-grade operational target.
+- Expense records include only amount, category, date, and optional description; payment method, merchant, location, receipt, account, tags, and similar fields are outside the MVP.
+- Amounts use one implicit application-level INR currency, display `₹`, require positive values up to 2 decimal places, and must not introduce per-expense currency, conversion, or exchange rates.
+- Date defaults to today, remains editable, uses Asia/Kolkata current-month semantics, and expense lists order by expense date descending with created time as the same-date tie-breaker.
+- Home prioritizes inline Add Expense, current-month summary, and exactly 5 Recent Expenses; Review lists all expenses in one simple scroll without search, filtering, grouping, pagination, or advanced analytics.
+- Default categories include everyday options such as Food, Transport, Shopping, Bills, Entertainment, Health, Education, and Other; defaults are protected from destructive changes.
+- Custom category deletion is allowed only when unused; in-use deletion is blocked with explanatory feedback and no automatic expense reassignment.
+- UX must follow adopted `DESIGN.md` and `EXPERIENCE.md` for mobile-first IA, component behavior, feedback states, accessibility floor, microcopy, colors, typography, and layout.
+- Architecture must follow adopted `ARCHITECTURE-SPINE.md`: React/Vite TypeScript frontend, ASP.NET Core Web API, PostgreSQL, explicit DTO REST contracts, layered backend, TanStack Query server state, and committed EF migrations.
+- Monetary persistence must use .NET `decimal` and PostgreSQL `numeric(12,2)`; current-month summary data is calculated on demand from normalized expenses and categories, not denormalized summary state.
+- Validation is enforced on both frontend and backend; API errors use `ProblemDetails` / `ValidationProblemDetails`, and operations must preserve data integrity and fresh summaries.
+- Verification must cover backend business rules, PostgreSQL-sensitive API/EF behavior, meaningful frontend form/interactions, and a few critical E2E journeys without targeting 100 percent coverage.
+
+## Non-goals
+
+- Full personal finance, budgeting, savings goals, forecasting, financial advice, or money movement.
+- Bank or credit-card integration, automatic imports, receipt scanning/OCR, recurring expense automation, or automatic categorization.
+- Income, investments, bills, business expense, accounting, reimbursement, tax, export, or compliance workflows.
+- Multi-user, household, shared expense, collaboration, roles, permissions, or real identity workflows.
+- Previous-month comparisons, percentage changes, trend analysis, dense dashboards, chart exploration, search/filter/sort-heavy review, or advanced analytics.
+- Multi-currency expenses, exchange rates, currency conversion, or per-expense currency selection.
+- Production deployment, CI/CD, environment topology, production observability, large-scale load testing, or formal security/compliance certification.
+
+## Success signal
+
+The MVP is successful when a user can record a normal expense quickly, later correct or delete it, and answer current-month spending total plus largest spending categories from the main experience. The project is successful as a BMAD learning MVP when the resulting stories can implement the React/.NET/PostgreSQL app while preserving the product, UX, architecture, and test boundaries in this spec.
+
+## Assumptions
+
+- Entity id type follows the architecture assumption of `Guid` unless implementation selects a simpler numeric id before the first EF Core migration.
diff --git a/backend/Data/AppDbContext.cs b/backend/Data/AppDbContext.cs
new file mode 100644
index 0000000..32ddc05
--- /dev/null
+++ b/backend/Data/AppDbContext.cs
@@ -0,0 +1,66 @@
+using Backend.Domain;
+using Microsoft.EntityFrameworkCore;
+
+namespace Backend.Data;
+
+public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
+{
+    public DbSet<Category> Categories => Set<Category>();
+    public DbSet<Expense> Expenses => Set<Expense>();
+
+    protected override void OnModelCreating(ModelBuilder modelBuilder)
+    {
+        modelBuilder.Entity<Category>(category =>
+        {
+            category.ToTable("categories");
+            category.HasKey(item => item.Id);
+
+            category.Property(item => item.Id).HasColumnName("id");
+            category.Property(item => item.Name)
+                .HasColumnName("name")
+                .HasMaxLength(80)
+                .IsRequired();
+            category.Property(item => item.IsDefault).HasColumnName("is_default");
+            category.Property(item => item.IsProtected).HasColumnName("is_protected");
+
+            category.HasIndex(item => item.Name).IsUnique();
+            category.HasData(DefaultCategories.All);
+        });
+
+        modelBuilder.Entity<Expense>(expense =>
+        {
+            expense.ToTable("expenses");
+            expense.HasKey(item => item.Id);
+
+            expense.Property(item => item.Id).HasColumnName("id");
+            expense.Property(item => item.Amount)
+                .HasColumnName("amount")
+                .HasColumnType("numeric(12,2)")
+                .IsRequired();
+            expense.Property(item => item.CategoryId).HasColumnName("category_id");
+            expense.Property(item => item.ExpenseDate)
+                .HasColumnName("expense_date")
+                .HasColumnType("date")
+                .IsRequired();
+            expense.Property(item => item.Description)
+                .HasColumnName("description")
+                .HasMaxLength(240);
+            expense.Property(item => item.CreatedAt)
+                .HasColumnName("created_at")
+                .HasColumnType("timestamp with time zone")
+                .IsRequired();
+            expense.Property(item => item.UpdatedAt)
+                .HasColumnName("updated_at")
+                .HasColumnType("timestamp with time zone")
+                .IsRequired();
+
+            expense.HasOne<Category>()
+                .WithMany()
+                .HasForeignKey(item => item.CategoryId)
+                .OnDelete(DeleteBehavior.Restrict)
+                .IsRequired();
+
+            expense.HasIndex(item => item.CategoryId);
+        });
+    }
+}
diff --git a/backend/Data/DefaultCategories.cs b/backend/Data/DefaultCategories.cs
new file mode 100644
index 0000000..a222664
--- /dev/null
+++ b/backend/Data/DefaultCategories.cs
@@ -0,0 +1,19 @@
+using Backend.Domain;
+
+namespace Backend.Data;
+
+public static class DefaultCategories
+{
+    public static readonly Category[] All =
+    [
+        new(new Guid("10000000-0000-0000-0000-000000000001"), "Food", true, true),
+        new(new Guid("10000000-0000-0000-0000-000000000002"), "Transport", true, true),
+        new(new Guid("10000000-0000-0000-0000-000000000003"), "Shopping", true, true),
+        new(new Guid("10000000-0000-0000-0000-000000000004"), "Bills", true, true),
+        new(new Guid("10000000-0000-0000-0000-000000000005"), "Entertainment", true, true),
+        new(new Guid("10000000-0000-0000-0000-000000000006"), "Health", true, true),
+        new(new Guid("10000000-0000-0000-0000-000000000007"), "Education", true, true),
+        new(new Guid("10000000-0000-0000-0000-000000000008"), "Other", true, true)
+    ];
+}
+
diff --git a/backend/Data/Migrations/20260916000000_InitialCategories.cs b/backend/Data/Migrations/20260916000000_InitialCategories.cs
new file mode 100644
index 0000000..aa28e24
--- /dev/null
+++ b/backend/Data/Migrations/20260916000000_InitialCategories.cs
@@ -0,0 +1,53 @@
+using System;
+using Microsoft.EntityFrameworkCore.Migrations;
+
+#nullable disable
+
+namespace Backend.Data.Migrations;
+
+public partial class InitialCategories : Migration
+{
+    protected override void Up(MigrationBuilder migrationBuilder)
+    {
+        migrationBuilder.CreateTable(
+            name: "categories",
+            columns: table => new
+            {
+                id = table.Column<Guid>(type: "uuid", nullable: false),
+                name = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
+                is_default = table.Column<bool>(type: "boolean", nullable: false),
+                is_protected = table.Column<bool>(type: "boolean", nullable: false)
+            },
+            constraints: table =>
+            {
+                table.PrimaryKey("pk_categories", x => x.id);
+            });
+
+        migrationBuilder.InsertData(
+            table: "categories",
+            columns: ["id", "is_default", "is_protected", "name"],
+            values: new object[,]
+            {
+                { new Guid("10000000-0000-0000-0000-000000000001"), true, true, "Food" },
+                { new Guid("10000000-0000-0000-0000-000000000002"), true, true, "Transport" },
+                { new Guid("10000000-0000-0000-0000-000000000003"), true, true, "Shopping" },
+                { new Guid("10000000-0000-0000-0000-000000000004"), true, true, "Bills" },
+                { new Guid("10000000-0000-0000-0000-000000000005"), true, true, "Entertainment" },
+                { new Guid("10000000-0000-0000-0000-000000000006"), true, true, "Health" },
+                { new Guid("10000000-0000-0000-0000-000000000007"), true, true, "Education" },
+                { new Guid("10000000-0000-0000-0000-000000000008"), true, true, "Other" }
+            });
+
+        migrationBuilder.CreateIndex(
+            name: "ix_categories_name",
+            table: "categories",
+            column: "name",
+            unique: true);
+    }
+
+    protected override void Down(MigrationBuilder migrationBuilder)
+    {
+        migrationBuilder.DropTable(name: "categories");
+    }
+}
+
diff --git a/backend/Data/Migrations/20260916010000_AddExpenses.cs b/backend/Data/Migrations/20260916010000_AddExpenses.cs
new file mode 100644
index 0000000..76d55b2
--- /dev/null
+++ b/backend/Data/Migrations/20260916010000_AddExpenses.cs
@@ -0,0 +1,45 @@
+using System;
+using Microsoft.EntityFrameworkCore.Migrations;
+
+#nullable disable
+
+namespace Backend.Data.Migrations;
+
+public partial class AddExpenses : Migration
+{
+    protected override void Up(MigrationBuilder migrationBuilder)
+    {
+        migrationBuilder.CreateTable(
+            name: "expenses",
+            columns: table => new
+            {
+                id = table.Column<Guid>(type: "uuid", nullable: false),
+                amount = table.Column<decimal>(type: "numeric(12,2)", nullable: false),
+                category_id = table.Column<Guid>(type: "uuid", nullable: false),
+                expense_date = table.Column<DateOnly>(type: "date", nullable: false),
+                description = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: true),
+                created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
+                updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
+            },
+            constraints: table =>
+            {
+                table.PrimaryKey("pk_expenses", x => x.id);
+                table.ForeignKey(
+                    name: "fk_expenses_categories_category_id",
+                    column: x => x.category_id,
+                    principalTable: "categories",
+                    principalColumn: "id",
+                    onDelete: ReferentialAction.Restrict);
+            });
+
+        migrationBuilder.CreateIndex(
+            name: "ix_expenses_category_id",
+            table: "expenses",
+            column: "category_id");
+    }
+
+    protected override void Down(MigrationBuilder migrationBuilder)
+    {
+        migrationBuilder.DropTable(name: "expenses");
+    }
+}
diff --git a/backend/Data/Migrations/AppDbContextModelSnapshot.cs b/backend/Data/Migrations/AppDbContextModelSnapshot.cs
new file mode 100644
index 0000000..dd4d926
--- /dev/null
+++ b/backend/Data/Migrations/AppDbContextModelSnapshot.cs
@@ -0,0 +1,117 @@
+using System;
+using Backend.Data;
+using Microsoft.EntityFrameworkCore;
+using Microsoft.EntityFrameworkCore.Infrastructure;
+using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
+using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;
+
+#nullable disable
+
+namespace Backend.Data.Migrations;
+
+[DbContext(typeof(AppDbContext))]
+partial class AppDbContextModelSnapshot : ModelSnapshot
+{
+    protected override void BuildModel(ModelBuilder modelBuilder)
+    {
+#pragma warning disable 612, 618
+        modelBuilder
+            .HasAnnotation("ProductVersion", "10.0.0")
+            .HasAnnotation("Relational:MaxIdentifierLength", 63);
+
+        NpgsqlModelBuilderExtensions.UseIdentityByDefaultColumns(modelBuilder);
+
+        modelBuilder.Entity("Backend.Domain.Category", b =>
+        {
+            b.Property<Guid>("Id")
+                .ValueGeneratedOnAdd()
+                .HasColumnType("uuid")
+                .HasColumnName("id");
+
+            b.Property<bool>("IsDefault")
+                .HasColumnType("boolean")
+                .HasColumnName("is_default");
+
+            b.Property<bool>("IsProtected")
+                .HasColumnType("boolean")
+                .HasColumnName("is_protected");
+
+            b.Property<string>("Name")
+                .IsRequired()
+                .HasMaxLength(80)
+                .HasColumnType("character varying(80)")
+                .HasColumnName("name");
+
+            b.HasKey("Id")
+                .HasName("pk_categories");
+
+            b.HasIndex("Name")
+                .IsUnique()
+                .HasDatabaseName("ix_categories_name");
+
+            b.ToTable("categories", (string)null);
+
+            b.HasData(
+                new { Id = new Guid("10000000-0000-0000-0000-000000000001"), IsDefault = true, IsProtected = true, Name = "Food" },
+                new { Id = new Guid("10000000-0000-0000-0000-000000000002"), IsDefault = true, IsProtected = true, Name = "Transport" },
+                new { Id = new Guid("10000000-0000-0000-0000-000000000003"), IsDefault = true, IsProtected = true, Name = "Shopping" },
+                new { Id = new Guid("10000000-0000-0000-0000-000000000004"), IsDefault = true, IsProtected = true, Name = "Bills" },
+                new { Id = new Guid("10000000-0000-0000-0000-000000000005"), IsDefault = true, IsProtected = true, Name = "Entertainment" },
+                new { Id = new Guid("10000000-0000-0000-0000-000000000006"), IsDefault = true, IsProtected = true, Name = "Health" },
+                new { Id = new Guid("10000000-0000-0000-0000-000000000007"), IsDefault = true, IsProtected = true, Name = "Education" },
+                new { Id = new Guid("10000000-0000-0000-0000-000000000008"), IsDefault = true, IsProtected = true, Name = "Other" });
+        });
+
+        modelBuilder.Entity("Backend.Domain.Expense", b =>
+        {
+            b.Property<Guid>("Id")
+                .ValueGeneratedOnAdd()
+                .HasColumnType("uuid")
+                .HasColumnName("id");
+
+            b.Property<decimal>("Amount")
+                .HasColumnType("numeric(12,2)")
+                .HasColumnName("amount");
+
+            b.Property<Guid>("CategoryId")
+                .HasColumnType("uuid")
+                .HasColumnName("category_id");
+
+            b.Property<DateTimeOffset>("CreatedAt")
+                .HasColumnType("timestamp with time zone")
+                .HasColumnName("created_at");
+
+            b.Property<string>("Description")
+                .HasMaxLength(240)
+                .HasColumnType("character varying(240)")
+                .HasColumnName("description");
+
+            b.Property<DateOnly>("ExpenseDate")
+                .HasColumnType("date")
+                .HasColumnName("expense_date");
+
+            b.Property<DateTimeOffset>("UpdatedAt")
+                .HasColumnType("timestamp with time zone")
+                .HasColumnName("updated_at");
+
+            b.HasKey("Id")
+                .HasName("pk_expenses");
+
+            b.HasIndex("CategoryId")
+                .HasDatabaseName("ix_expenses_category_id");
+
+            b.ToTable("expenses", (string)null);
+        });
+
+        modelBuilder.Entity("Backend.Domain.Expense", b =>
+        {
+            b.HasOne("Backend.Domain.Category", null)
+                .WithMany()
+                .HasForeignKey("CategoryId")
+                .OnDelete(DeleteBehavior.Restrict)
+                .IsRequired()
+                .HasConstraintName("fk_expenses_categories_category_id");
+        });
+#pragma warning restore 612, 618
+    }
+}
diff --git a/backend/Domain/Category.cs b/backend/Domain/Category.cs
new file mode 100644
index 0000000..3a52752
--- /dev/null
+++ b/backend/Domain/Category.cs
@@ -0,0 +1,22 @@
+namespace Backend.Domain;
+
+public sealed class Category
+{
+    public Guid Id { get; private set; }
+    public string Name { get; private set; } = string.Empty;
+    public bool IsDefault { get; private set; }
+    public bool IsProtected { get; private set; }
+
+    private Category()
+    {
+    }
+
+    public Category(Guid id, string name, bool isDefault, bool isProtected)
+    {
+        Id = id;
+        Name = string.IsNullOrWhiteSpace(name) ? throw new ArgumentException("Category name is required.", nameof(name)) : name.Trim();
+        IsDefault = isDefault;
+        IsProtected = isProtected;
+    }
+}
+
diff --git a/backend/Domain/Expense.cs b/backend/Domain/Expense.cs
new file mode 100644
index 0000000..c47ee43
--- /dev/null
+++ b/backend/Domain/Expense.cs
@@ -0,0 +1,81 @@
+namespace Backend.Domain;
+
+public sealed class Expense
+{
+    public Guid Id { get; private set; }
+    public decimal Amount { get; private set; }
+    public Guid CategoryId { get; private set; }
+    public DateOnly ExpenseDate { get; private set; }
+    public string? Description { get; private set; }
+    public DateTimeOffset CreatedAt { get; private set; }
+    public DateTimeOffset UpdatedAt { get; private set; }
+
+    private Expense()
+    {
+    }
+
+    public Expense(
+        Guid id,
+        decimal amount,
+        Guid categoryId,
+        DateOnly expenseDate,
+        string? description,
+        DateTimeOffset createdAt,
+        DateTimeOffset updatedAt)
+    {
+        Validate(id, amount, categoryId, expenseDate);
+
+        Id = id;
+        Amount = amount;
+        CategoryId = categoryId;
+        ExpenseDate = expenseDate;
+        Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
+        CreatedAt = createdAt.ToUniversalTime();
+        UpdatedAt = updatedAt.ToUniversalTime();
+    }
+
+    public static Expense Create(decimal amount, Guid categoryId, DateOnly expenseDate, string? description, DateTimeOffset now)
+    {
+        var utcNow = now.ToUniversalTime();
+        return new Expense(Guid.NewGuid(), amount, categoryId, expenseDate, description, utcNow, utcNow);
+    }
+
+    public void Update(decimal amount, Guid categoryId, DateOnly expenseDate, string? description, DateTimeOffset now)
+    {
+        Validate(Id, amount, categoryId, expenseDate);
+
+        Amount = amount;
+        CategoryId = categoryId;
+        ExpenseDate = expenseDate;
+        Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
+        UpdatedAt = now.ToUniversalTime();
+    }
+
+    private static void Validate(Guid id, decimal amount, Guid categoryId, DateOnly expenseDate)
+    {
+        if (id == Guid.Empty)
+        {
+            throw new ArgumentException("Expense id is required.", nameof(id));
+        }
+
+        if (amount <= 0)
+        {
+            throw new ArgumentOutOfRangeException(nameof(amount), "Expense amount must be positive.");
+        }
+
+        if (decimal.Round(amount, 2) != amount)
+        {
+            throw new ArgumentOutOfRangeException(nameof(amount), "Expense amount must use at most two decimal places.");
+        }
+
+        if (categoryId == Guid.Empty)
+        {
+            throw new ArgumentException("Category id is required.", nameof(categoryId));
+        }
+
+        if (expenseDate == default)
+        {
+            throw new ArgumentException("Expense date is required.", nameof(expenseDate));
+        }
+    }
+}
diff --git a/backend/Features/Categories/CategoryDto.cs b/backend/Features/Categories/CategoryDto.cs
new file mode 100644
index 0000000..89c8893
--- /dev/null
+++ b/backend/Features/Categories/CategoryDto.cs
@@ -0,0 +1,4 @@
+namespace Backend.Features.Categories;
+
+public sealed record CategoryDto(Guid Id, string Name, bool IsDefault, bool IsProtected);
+
diff --git a/backend/Features/Categories/CategoryEndpoints.cs b/backend/Features/Categories/CategoryEndpoints.cs
new file mode 100644
index 0000000..d4d257a
--- /dev/null
+++ b/backend/Features/Categories/CategoryEndpoints.cs
@@ -0,0 +1,15 @@
+namespace Backend.Features.Categories;
+
+public static class CategoryEndpoints
+{
+    public static IEndpointRouteBuilder MapCategoryEndpoints(this IEndpointRouteBuilder endpoints)
+    {
+        endpoints.MapGet("/api/categories", async (CategoryService categoryService, CancellationToken cancellationToken) =>
+        {
+            var categories = await categoryService.GetCategoriesAsync(cancellationToken);
+            return Results.Ok(categories);
+        });
+
+        return endpoints;
+    }
+}
diff --git a/backend/Features/Categories/CategoryService.cs b/backend/Features/Categories/CategoryService.cs
new file mode 100644
index 0000000..a52b49a
--- /dev/null
+++ b/backend/Features/Categories/CategoryService.cs
@@ -0,0 +1,22 @@
+using Backend.Data;
+using Microsoft.EntityFrameworkCore;
+
+namespace Backend.Features.Categories;
+
+public sealed class CategoryService(AppDbContext dbContext)
+{
+    public async Task<IReadOnlyList<CategoryDto>> GetCategoriesAsync(CancellationToken cancellationToken)
+    {
+        return await dbContext.Categories
+            .AsNoTracking()
+            .OrderBy(category => category.Name == "Other")
+            .ThenBy(category => category.Name)
+            .Select(category => new CategoryDto(
+                category.Id,
+                category.Name,
+                category.IsDefault,
+                category.IsProtected))
+            .ToListAsync(cancellationToken);
+    }
+}
+
diff --git a/backend/Features/Expenses/CreateExpenseRequest.cs b/backend/Features/Expenses/CreateExpenseRequest.cs
new file mode 100644
index 0000000..04a31d1
--- /dev/null
+++ b/backend/Features/Expenses/CreateExpenseRequest.cs
@@ -0,0 +1,7 @@
+namespace Backend.Features.Expenses;
+
+public sealed record CreateExpenseRequest(
+    decimal Amount,
+    Guid CategoryId,
+    DateOnly ExpenseDate,
+    string? Description);
diff --git a/backend/Features/Expenses/ExpenseDto.cs b/backend/Features/Expenses/ExpenseDto.cs
new file mode 100644
index 0000000..2deb39c
--- /dev/null
+++ b/backend/Features/Expenses/ExpenseDto.cs
@@ -0,0 +1,29 @@
+namespace Backend.Features.Expenses;
+
+public sealed record ExpenseDto(
+    Guid Id,
+    decimal Amount,
+    Guid CategoryId,
+    DateOnly ExpenseDate,
+    string? Description,
+    DateTimeOffset CreatedAt,
+    DateTimeOffset UpdatedAt);
+
+public sealed record ExpenseListItemDto(
+    Guid Id,
+    decimal Amount,
+    Guid CategoryId,
+    string CategoryName,
+    DateOnly ExpenseDate,
+    string? Description,
+    DateTimeOffset CreatedAt);
+
+public sealed record ExpenseDetailDto(
+    Guid Id,
+    decimal Amount,
+    Guid CategoryId,
+    string CategoryName,
+    DateOnly ExpenseDate,
+    string? Description,
+    DateTimeOffset CreatedAt,
+    DateTimeOffset UpdatedAt);
diff --git a/backend/Features/Expenses/ExpenseEndpoints.cs b/backend/Features/Expenses/ExpenseEndpoints.cs
new file mode 100644
index 0000000..98ceb5d
--- /dev/null
+++ b/backend/Features/Expenses/ExpenseEndpoints.cs
@@ -0,0 +1,74 @@
+namespace Backend.Features.Expenses;
+
+public static class ExpenseEndpoints
+{
+    public static IEndpointRouteBuilder MapExpenseEndpoints(this IEndpointRouteBuilder endpoints)
+    {
+        endpoints.MapGet("/api/expenses", async (
+            ExpenseService expenseService,
+            CancellationToken cancellationToken) =>
+        {
+            var expenses = await expenseService.GetExpensesAsync(cancellationToken);
+
+            return Results.Ok(expenses);
+        });
+
+        endpoints.MapPost("/api/expenses", async (
+            CreateExpenseRequest request,
+            ExpenseService expenseService,
+            CancellationToken cancellationToken) =>
+        {
+            var result = await expenseService.CreateExpenseAsync(request, cancellationToken);
+
+            if (!result.IsValid)
+            {
+                return Results.ValidationProblem(result.Errors);
+            }
+
+            return Results.Created($"/api/expenses/{result.Expense!.Id}", result.Expense);
+        });
+
+        endpoints.MapGet("/api/expenses/{id:guid}", async (
+            Guid id,
+            ExpenseService expenseService,
+            CancellationToken cancellationToken) =>
+        {
+            var expense = await expenseService.GetExpenseAsync(id, cancellationToken);
+
+            return expense is null ? Results.NotFound() : Results.Ok(expense);
+        });
+
+        endpoints.MapPut("/api/expenses/{id:guid}", async (
+            Guid id,
+            UpdateExpenseRequest request,
+            ExpenseService expenseService,
+            CancellationToken cancellationToken) =>
+        {
+            var result = await expenseService.UpdateExpenseAsync(id, request, cancellationToken);
+
+            if (!result.WasFound)
+            {
+                return Results.NotFound();
+            }
+
+            if (!result.IsValid)
+            {
+                return Results.ValidationProblem(result.Errors);
+            }
+
+            return Results.Ok(result.Expense);
+        });
+
+        endpoints.MapDelete("/api/expenses/{id:guid}", async (
+            Guid id,
+            ExpenseService expenseService,
+            CancellationToken cancellationToken) =>
+        {
+            var wasDeleted = await expenseService.DeleteExpenseAsync(id, cancellationToken);
+
+            return wasDeleted ? Results.NoContent() : Results.NotFound();
+        });
+
+        return endpoints;
+    }
+}
diff --git a/backend/Features/Expenses/ExpenseService.cs b/backend/Features/Expenses/ExpenseService.cs
new file mode 100644
index 0000000..05a9b7b
--- /dev/null
+++ b/backend/Features/Expenses/ExpenseService.cs
@@ -0,0 +1,228 @@
+using Backend.Data;
+using Backend.Domain;
+using Microsoft.EntityFrameworkCore;
+
+namespace Backend.Features.Expenses;
+
+public sealed class ExpenseService(AppDbContext dbContext)
+{
+    private const decimal MaxAmount = 9999999999.99m;
+    private const int MaxDescriptionLength = 240;
+
+    public async Task<IReadOnlyList<ExpenseListItemDto>> GetExpensesAsync(CancellationToken cancellationToken)
+    {
+        return await (
+            from expense in dbContext.Expenses.AsNoTracking()
+            join category in dbContext.Categories.AsNoTracking()
+                on expense.CategoryId equals category.Id
+            orderby expense.ExpenseDate descending, expense.CreatedAt descending, expense.Id descending
+            select new ExpenseListItemDto(
+                expense.Id,
+                expense.Amount,
+                expense.CategoryId,
+                category.Name,
+                expense.ExpenseDate,
+                expense.Description,
+                expense.CreatedAt))
+            .ToListAsync(cancellationToken);
+    }
+
+    public async Task<ExpenseDetailDto?> GetExpenseAsync(Guid id, CancellationToken cancellationToken)
+    {
+        return await (
+            from expense in dbContext.Expenses.AsNoTracking()
+            join category in dbContext.Categories.AsNoTracking()
+                on expense.CategoryId equals category.Id
+            where expense.Id == id
+            select new ExpenseDetailDto(
+                expense.Id,
+                expense.Amount,
+                expense.CategoryId,
+                category.Name,
+                expense.ExpenseDate,
+                expense.Description,
+                expense.CreatedAt,
+                expense.UpdatedAt))
+            .SingleOrDefaultAsync(cancellationToken);
+    }
+
+    public async Task<CreateExpenseResult> CreateExpenseAsync(CreateExpenseRequest request, CancellationToken cancellationToken)
+    {
+        var errors = ValidateRequest(request);
+        if (errors.Count > 0)
+        {
+            return CreateExpenseResult.Invalid(errors);
+        }
+
+        var categoryExists = await dbContext.Categories
+            .AsNoTracking()
+            .AnyAsync(category => category.Id == request.CategoryId, cancellationToken);
+
+        if (!categoryExists)
+        {
+            return CreateExpenseResult.Invalid(new Dictionary<string, string[]>
+            {
+                [nameof(request.CategoryId)] = ["Choose an existing category."]
+            });
+        }
+
+        var expense = Expense.Create(
+            request.Amount,
+            request.CategoryId,
+            request.ExpenseDate,
+            request.Description,
+            DateTimeOffset.UtcNow);
+
+        dbContext.Expenses.Add(expense);
+        await dbContext.SaveChangesAsync(cancellationToken);
+
+        return CreateExpenseResult.Created(ToDto(expense));
+    }
+
+    public async Task<UpdateExpenseResult> UpdateExpenseAsync(
+        Guid id,
+        UpdateExpenseRequest request,
+        CancellationToken cancellationToken)
+    {
+        var errors = ValidateRequest(request.Amount, request.CategoryId, request.ExpenseDate, request.Description);
+        if (errors.Count > 0)
+        {
+            return UpdateExpenseResult.Invalid(errors);
+        }
+
+        var expense = await dbContext.Expenses.SingleOrDefaultAsync(expense => expense.Id == id, cancellationToken);
+        if (expense is null)
+        {
+            return UpdateExpenseResult.NotFound();
+        }
+
+        var categoryExists = await dbContext.Categories
+            .AsNoTracking()
+            .AnyAsync(category => category.Id == request.CategoryId, cancellationToken);
+
+        if (!categoryExists)
+        {
+            return UpdateExpenseResult.Invalid(new Dictionary<string, string[]>
+            {
+                [nameof(request.CategoryId)] = ["Choose an existing category."]
+            });
+        }
+
+        expense.Update(
+            request.Amount,
+            request.CategoryId,
+            request.ExpenseDate,
+            request.Description,
+            DateTimeOffset.UtcNow);
+
+        await dbContext.SaveChangesAsync(cancellationToken);
+
+        var detail = await GetExpenseAsync(expense.Id, cancellationToken);
+        return detail is null ? UpdateExpenseResult.NotFound() : UpdateExpenseResult.Updated(detail);
+    }
+
+    public async Task<bool> DeleteExpenseAsync(Guid id, CancellationToken cancellationToken)
+    {
+        var expense = await dbContext.Expenses.SingleOrDefaultAsync(expense => expense.Id == id, cancellationToken);
+        if (expense is null)
+        {
+            return false;
+        }
+
+        dbContext.Expenses.Remove(expense);
+        await dbContext.SaveChangesAsync(cancellationToken);
+
+        return true;
+    }
+
+    private static Dictionary<string, string[]> ValidateRequest(CreateExpenseRequest request)
+    {
+        return ValidateRequest(request.Amount, request.CategoryId, request.ExpenseDate, request.Description);
+    }
+
+    private static Dictionary<string, string[]> ValidateRequest(
+        decimal amount,
+        Guid categoryId,
+        DateOnly expenseDate,
+        string? description)
+    {
+        var errors = new Dictionary<string, string[]>();
+
+        if (amount <= 0)
+        {
+            errors[nameof(CreateExpenseRequest.Amount)] = ["Enter a positive amount."];
+        }
+        else if (amount > MaxAmount)
+        {
+            errors[nameof(CreateExpenseRequest.Amount)] = ["Enter a smaller amount."];
+        }
+        else if (decimal.Round(amount, 2) != amount)
+        {
+            errors[nameof(CreateExpenseRequest.Amount)] = ["Enter an amount with no more than two decimal places."];
+        }
+
+        if (categoryId == Guid.Empty)
+        {
+            errors[nameof(CreateExpenseRequest.CategoryId)] = ["Choose a category."];
+        }
+
+        if (expenseDate == default)
+        {
+            errors[nameof(CreateExpenseRequest.ExpenseDate)] = ["Choose a date."];
+        }
+
+        if (description?.Trim().Length > MaxDescriptionLength)
+        {
+            errors[nameof(CreateExpenseRequest.Description)] = ["Keep description under 240 characters."];
+        }
+
+        return errors;
+    }
+
+    private static ExpenseDto ToDto(Expense expense)
+    {
+        return new ExpenseDto(
+            expense.Id,
+            expense.Amount,
+            expense.CategoryId,
+            expense.ExpenseDate,
+            expense.Description,
+            expense.CreatedAt,
+            expense.UpdatedAt);
+    }
+}
+
+public sealed record CreateExpenseResult(ExpenseDto? Expense, Dictionary<string, string[]> Errors)
+{
+    public bool IsValid => Errors.Count == 0;
+
+    public static CreateExpenseResult Created(ExpenseDto expense)
+    {
+        return new CreateExpenseResult(expense, []);
+    }
+
+    public static CreateExpenseResult Invalid(Dictionary<string, string[]> errors)
+    {
+        return new CreateExpenseResult(null, errors);
+    }
+}
+
+public sealed record UpdateExpenseResult(ExpenseDetailDto? Expense, Dictionary<string, string[]> Errors, bool WasFound)
+{
+    public bool IsValid => Errors.Count == 0;
+
+    public static UpdateExpenseResult Updated(ExpenseDetailDto expense)
+    {
+        return new UpdateExpenseResult(expense, [], true);
+    }
+
+    public static UpdateExpenseResult Invalid(Dictionary<string, string[]> errors)
+    {
+        return new UpdateExpenseResult(null, errors, true);
+    }
+
+    public static UpdateExpenseResult NotFound()
+    {
+        return new UpdateExpenseResult(null, [], false);
+    }
+}
diff --git a/backend/Program.cs b/backend/Program.cs
new file mode 100644
index 0000000..81c0654
--- /dev/null
+++ b/backend/Program.cs
@@ -0,0 +1,36 @@
+using Backend.Data;
+using Backend.Features.Categories;
+using Backend.Features.Expenses;
+using Microsoft.EntityFrameworkCore;
+
+var builder = WebApplication.CreateBuilder(args);
+
+builder.Services.AddProblemDetails();
+builder.Services.AddDbContext<AppDbContext>(options =>
+    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
+builder.Services.AddScoped<CategoryService>();
+builder.Services.AddScoped<ExpenseService>();
+builder.Services.AddCors(options =>
+{
+    options.AddPolicy("FrontendDev", policy =>
+    {
+        policy.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
+            .AllowAnyHeader()
+            .AllowAnyMethod();
+    });
+});
+
+var app = builder.Build();
+
+if (app.Environment.IsDevelopment())
+{
+    app.UseCors("FrontendDev");
+}
+
+app.UseExceptionHandler();
+app.MapCategoryEndpoints();
+app.MapExpenseEndpoints();
+
+app.Run();
+
+public partial class Program;
diff --git a/backend/appsettings.json b/backend/appsettings.json
new file mode 100644
index 0000000..53f3ef5
--- /dev/null
+++ b/backend/appsettings.json
@@ -0,0 +1,13 @@
+{
+  "ConnectionStrings": {
+    "DefaultConnection": "Host=localhost;Port=5432;Database=bmad_expense_tracker;Username=postgres;Password=postgres"
+  },
+  "Logging": {
+    "LogLevel": {
+      "Default": "Information",
+      "Microsoft.AspNetCore": "Warning"
+    }
+  },
+  "AllowedHosts": "*"
+}
+
diff --git a/backend/backend.csproj b/backend/backend.csproj
new file mode 100644
index 0000000..f0d3808
--- /dev/null
+++ b/backend/backend.csproj
@@ -0,0 +1,16 @@
+<Project Sdk="Microsoft.NET.Sdk.Web">
+  <PropertyGroup>
+    <TargetFramework>net10.0</TargetFramework>
+    <Nullable>enable</Nullable>
+    <ImplicitUsings>enable</ImplicitUsings>
+  </PropertyGroup>
+
+  <ItemGroup>
+    <PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="10.0.0">
+      <PrivateAssets>all</PrivateAssets>
+      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
+    </PackageReference>
+    <PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="10.0.0" />
+  </ItemGroup>
+</Project>
+
diff --git a/bmad-expense-tracker.sln b/bmad-expense-tracker.sln
new file mode 100644
index 0000000..5c9926e
--- /dev/null
+++ b/bmad-expense-tracker.sln
@@ -0,0 +1,25 @@
+Microsoft Visual Studio Solution File, Format Version 12.00
+# Visual Studio Version 17
+VisualStudioVersion = 17.0.31903.59
+MinimumVisualStudioVersion = 10.0.40219.1
+Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "backend", "backend\backend.csproj", "{9E345B89-4686-4A73-9DF2-4B1E28EF7CC9}"
+EndProject
+Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "backend-integration", "tests\backend-integration\backend-integration.csproj", "{792F91E8-1751-45F3-8F2F-3F96186CB671}"
+EndProject
+Global
+	GlobalSection(SolutionConfigurationPlatforms) = preSolution
+		Debug|Any CPU = Debug|Any CPU
+		Release|Any CPU = Release|Any CPU
+	EndGlobalSection
+	GlobalSection(ProjectConfigurationPlatforms) = postSolution
+		{9E345B89-4686-4A73-9DF2-4B1E28EF7CC9}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
+		{9E345B89-4686-4A73-9DF2-4B1E28EF7CC9}.Debug|Any CPU.Build.0 = Debug|Any CPU
+		{9E345B89-4686-4A73-9DF2-4B1E28EF7CC9}.Release|Any CPU.ActiveCfg = Release|Any CPU
+		{9E345B89-4686-4A73-9DF2-4B1E28EF7CC9}.Release|Any CPU.Build.0 = Release|Any CPU
+		{792F91E8-1751-45F3-8F2F-3F96186CB671}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
+		{792F91E8-1751-45F3-8F2F-3F96186CB671}.Debug|Any CPU.Build.0 = Debug|Any CPU
+		{792F91E8-1751-45F3-8F2F-3F96186CB671}.Release|Any CPU.ActiveCfg = Release|Any CPU
+		{792F91E8-1751-45F3-8F2F-3F96186CB671}.Release|Any CPU.Build.0 = Release|Any CPU
+	EndGlobalSection
+EndGlobal
+
diff --git a/frontend/index.html b/frontend/index.html
new file mode 100644
index 0000000..d34a302
--- /dev/null
+++ b/frontend/index.html
@@ -0,0 +1,13 @@
+<!doctype html>
+<html lang="en">
+  <head>
+    <meta charset="UTF-8" />
+    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
+    <title>Expense Tracker</title>
+  </head>
+  <body>
+    <div id="root"></div>
+    <script type="module" src="/src/main.tsx"></script>
+  </body>
+</html>
+
diff --git a/frontend/package-lock.json b/frontend/package-lock.json
new file mode 100644
index 0000000..c06f8b5
--- /dev/null
+++ b/frontend/package-lock.json
@@ -0,0 +1,3311 @@
+{
+  "name": "bmad-expense-tracker-frontend",
+  "version": "0.1.0",
+  "lockfileVersion": 3,
+  "requires": true,
+  "packages": {
+    "": {
+      "name": "bmad-expense-tracker-frontend",
+      "version": "0.1.0",
+      "dependencies": {
+        "@tanstack/react-query": "^5.90.6",
+        "lucide-react": "^0.552.0",
+        "react": "^19.2.0",
+        "react-dom": "^19.2.0",
+        "react-router-dom": "^7.9.5"
+      },
+      "devDependencies": {
+        "@testing-library/jest-dom": "^6.9.1",
+        "@testing-library/react": "^16.3.0",
+        "@testing-library/user-event": "^14.6.1",
+        "@types/node": "^24.9.1",
+        "@types/react": "^19.2.2",
+        "@types/react-dom": "^19.2.2",
+        "@vitejs/plugin-react": "^5.0.4",
+        "jsdom": "^27.0.1",
+        "typescript": "^5.9.3",
+        "vite": "^7.1.12",
+        "vitest": "^3.2.4"
+      }
+    },
+    "node_modules/@acemir/cssom": {
+      "version": "0.9.31",
+      "resolved": "https://registry.npmjs.org/@acemir/cssom/-/cssom-0.9.31.tgz",
+      "integrity": "sha512-ZnR3GSaH+/vJ0YlHau21FjfLYjMpYVIzTD8M8vIEQvIGxeOXyXdzCI140rrCY862p/C/BbzWsjc1dgnM9mkoTA==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/@adobe/css-tools": {
+      "version": "4.5.0",
+      "resolved": "https://registry.npmjs.org/@adobe/css-tools/-/css-tools-4.5.0.tgz",
+      "integrity": "sha512-6OzddxPio9UiWTCemp4N8cYLV2ZN1ncRnV1cVGtve7dhPOtRkleRyx32GQCYSwDYgaHU3USMm84tNsvKzRCa1Q==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/@asamuzakjp/css-color": {
+      "version": "4.1.2",
+      "resolved": "https://registry.npmjs.org/@asamuzakjp/css-color/-/css-color-4.1.2.tgz",
+      "integrity": "sha512-NfBUvBaYgKIuq6E/RBLY1m0IohzNHAYyaJGuTK79Z23uNwmz2jl1mPsC5ZxCCxylinKhT1Amn5oNTlx1wN8cQg==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@csstools/css-calc": "^3.0.0",
+        "@csstools/css-color-parser": "^4.0.1",
+        "@csstools/css-parser-algorithms": "^4.0.0",
+        "@csstools/css-tokenizer": "^4.0.0",
+        "lru-cache": "^11.2.5"
+      }
+    },
+    "node_modules/@asamuzakjp/css-color/node_modules/lru-cache": {
+      "version": "11.5.2",
+      "resolved": "https://registry.npmjs.org/lru-cache/-/lru-cache-11.5.2.tgz",
+      "integrity": "sha512-4pfM1Ff0x50o0tQwb5ucw/RzNyD0/YJME6IVcStalZuMWxdt3sR3huStTtxz4PUmvZfRguvDejasvQ2kifR11g==",
+      "dev": true,
+      "license": "BlueOak-1.0.0",
+      "engines": {
+        "node": "20 || >=22"
+      }
+    },
+    "node_modules/@asamuzakjp/dom-selector": {
+      "version": "6.8.1",
+      "resolved": "https://registry.npmjs.org/@asamuzakjp/dom-selector/-/dom-selector-6.8.1.tgz",
+      "integrity": "sha512-MvRz1nCqW0fsy8Qz4dnLIvhOlMzqDVBabZx6lH+YywFDdjXhMY37SmpV1XFX3JzG5GWHn63j6HX6QPr3lZXHvQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@asamuzakjp/nwsapi": "^2.3.9",
+        "bidi-js": "^1.0.3",
+        "css-tree": "^3.1.0",
+        "is-potential-custom-element-name": "^1.0.1",
+        "lru-cache": "^11.2.6"
+      }
+    },
+    "node_modules/@asamuzakjp/dom-selector/node_modules/lru-cache": {
+      "version": "11.5.2",
+      "resolved": "https://registry.npmjs.org/lru-cache/-/lru-cache-11.5.2.tgz",
+      "integrity": "sha512-4pfM1Ff0x50o0tQwb5ucw/RzNyD0/YJME6IVcStalZuMWxdt3sR3huStTtxz4PUmvZfRguvDejasvQ2kifR11g==",
+      "dev": true,
+      "license": "BlueOak-1.0.0",
+      "engines": {
+        "node": "20 || >=22"
+      }
+    },
+    "node_modules/@asamuzakjp/nwsapi": {
+      "version": "2.3.9",
+      "resolved": "https://registry.npmjs.org/@asamuzakjp/nwsapi/-/nwsapi-2.3.9.tgz",
+      "integrity": "sha512-n8GuYSrI9bF7FFZ/SjhwevlHc8xaVlb/7HmHelnc/PZXBD2ZR49NnN9sMMuDdEGPeeRQ5d0hqlSlEpgCX3Wl0Q==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/@babel/code-frame": {
+      "version": "7.29.7",
+      "resolved": "https://registry.npmjs.org/@babel/code-frame/-/code-frame-7.29.7.tgz",
+      "integrity": "sha512-Aup7aUOfpbAUg2ROOJN6Iw5f9DMBlzu0mIkm/malLQFN/YQgO48wCj0Kxa3sEHJvPVFg7siR+qRInwXd2qhQKw==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@babel/helper-validator-identifier": "^7.29.7",
+        "js-tokens": "^4.0.0",
+        "picocolors": "^1.1.1"
+      },
+      "engines": {
+        "node": ">=6.9.0"
+      }
+    },
+    "node_modules/@babel/compat-data": {
+      "version": "7.29.7",
+      "resolved": "https://registry.npmjs.org/@babel/compat-data/-/compat-data-7.29.7.tgz",
+      "integrity": "sha512-locTkQyKvwIEgBzVrn8693ebc97F2U8ZHjbXwDXJ5Fn2TCpNwTlKcaKLkdHop5c/icOFE7qt7Q9JC5hnKNa6Gg==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=6.9.0"
+      }
+    },
+    "node_modules/@babel/core": {
+      "version": "7.29.7",
+      "resolved": "https://registry.npmjs.org/@babel/core/-/core-7.29.7.tgz",
+      "integrity": "sha512-RgHBCvtjbOK2gXSNBNIkNoEc9qoVEtau3hj8gEqKQuL3HZAibKarWFEI3Lfm6EYKkLalOh8eSrj9b+ch9H/VBA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@babel/code-frame": "^7.29.7",
+        "@babel/generator": "^7.29.7",
+        "@babel/helper-compilation-targets": "^7.29.7",
+        "@babel/helper-module-transforms": "^7.29.7",
+        "@babel/helpers": "^7.29.7",
+        "@babel/parser": "^7.29.7",
+        "@babel/template": "^7.29.7",
+        "@babel/traverse": "^7.29.7",
+        "@babel/types": "^7.29.7",
+        "@jridgewell/remapping": "^2.3.5",
+        "convert-source-map": "^2.0.0",
+        "debug": "^4.1.0",
+        "gensync": "^1.0.0-beta.2",
+        "json5": "^2.2.3",
+        "semver": "^6.3.1"
+      },
+      "engines": {
+        "node": ">=6.9.0"
+      },
+      "funding": {
+        "type": "opencollective",
+        "url": "https://opencollective.com/babel"
+      }
+    },
+    "node_modules/@babel/generator": {
+      "version": "7.29.8",
+      "resolved": "https://registry.npmjs.org/@babel/generator/-/generator-7.29.8.tgz",
+      "integrity": "sha512-gZbepsdh3WDtgZKWL+vTPh71LSBrm/Y4/QDZBVCcYfmeTEEuoOYwlSy+G1StfJg+/Zy550u/3TATbm7qDbbMtg==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@babel/parser": "^7.29.8",
+        "@babel/types": "^7.29.8",
+        "@jridgewell/gen-mapping": "^0.3.12",
+        "@jridgewell/trace-mapping": "^0.3.28",
+        "jsesc": "^3.0.2"
+      },
+      "engines": {
+        "node": ">=6.9.0"
+      }
+    },
+    "node_modules/@babel/helper-compilation-targets": {
+      "version": "7.29.7",
+      "resolved": "https://registry.npmjs.org/@babel/helper-compilation-targets/-/helper-compilation-targets-7.29.7.tgz",
+      "integrity": "sha512-wem6WaBj4NaVYVdNhLPPVacES6ZJ+KBBfSkTMD3YZxbP3rm3Di85tJU5ljaUNhaOynt+Aj0xruhYuzQBt8n71g==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@babel/compat-data": "^7.29.7",
+        "@babel/helper-validator-option": "^7.29.7",
+        "browserslist": "^4.24.0",
+        "lru-cache": "^5.1.1",
+        "semver": "^6.3.1"
+      },
+      "engines": {
+        "node": ">=6.9.0"
+      }
+    },
+    "node_modules/@babel/helper-globals": {
+      "version": "7.29.7",
+      "resolved": "https://registry.npmjs.org/@babel/helper-globals/-/helper-globals-7.29.7.tgz",
+      "integrity": "sha512-3nQVUAtvkKH9zahfWgw96Jc/uFOmjACE1kQz82E2lqWmHBgjzbNlsC22nuQTfahmWeQtTq5nQ/4Nnd2A1wj4zA==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=6.9.0"
+      }
+    },
+    "node_modules/@babel/helper-module-imports": {
+      "version": "7.29.7",
+      "resolved": "https://registry.npmjs.org/@babel/helper-module-imports/-/helper-module-imports-7.29.7.tgz",
+      "integrity": "sha512-ejHwrQQYcm9xnTivShn2IDOlIzInN34AXskvq9QicvCtEzq1Vzclu/tKF8Jq1Cg8JG2GL6/EmjgsCT7lXepE3g==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@babel/traverse": "^7.29.7",
+        "@babel/types": "^7.29.7"
+      },
+      "engines": {
+        "node": ">=6.9.0"
+      }
+    },
+    "node_modules/@babel/helper-module-transforms": {
+      "version": "7.29.7",
+      "resolved": "https://registry.npmjs.org/@babel/helper-module-transforms/-/helper-module-transforms-7.29.7.tgz",
+      "integrity": "sha512-UPUVSyXbOh627KiCIGQSgwWzGeBKLkaJ9PJEdrngIwMSzxLR4jS4+f1f1jb7VzBbg8nFLaYotvVPFCTqdrmTAg==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@babel/helper-module-imports": "^7.29.7",
+        "@babel/helper-validator-identifier": "^7.29.7",
+        "@babel/traverse": "^7.29.7"
+      },
+      "engines": {
+        "node": ">=6.9.0"
+      },
+      "peerDependencies": {
+        "@babel/core": "^7.0.0"
+      }
+    },
+    "node_modules/@babel/helper-plugin-utils": {
+      "version": "7.29.7",
+      "resolved": "https://registry.npmjs.org/@babel/helper-plugin-utils/-/helper-plugin-utils-7.29.7.tgz",
+      "integrity": "sha512-G7sHYigPY17oO5SYWnfD/0MTBwVR781S/JI643e/JhUYgVgWE/61SoW3NH9KWUKyKq5LVh3npif99Wkt6j86Jw==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=6.9.0"
+      }
+    },
+    "node_modules/@babel/helper-string-parser": {
+      "version": "7.29.7",
+      "resolved": "https://registry.npmjs.org/@babel/helper-string-parser/-/helper-string-parser-7.29.7.tgz",
+      "integrity": "sha512-Pb5ijPrZ89GDH8223L4UP8i6QApWxs04RbPQJTeWDV0/keR2E36MeKnyr6LYmUUvqRRI+Iv87SuF1W6ErINzYw==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=6.9.0"
+      }
+    },
+    "node_modules/@babel/helper-validator-identifier": {
+      "version": "7.29.7",
+      "resolved": "https://registry.npmjs.org/@babel/helper-validator-identifier/-/helper-validator-identifier-7.29.7.tgz",
+      "integrity": "sha512-qehxGkRj55h/ff8EMaJ+cYhyaKlHIxqYDn682wQD7RNp9UujOQsHog2uS0r2vzr4pW+sXf90NeeayjcNaX3fFg==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=6.9.0"
+      }
+    },
+    "node_modules/@babel/helper-validator-option": {
+      "version": "7.29.7",
+      "resolved": "https://registry.npmjs.org/@babel/helper-validator-option/-/helper-validator-option-7.29.7.tgz",
+      "integrity": "sha512-N9ZErrD+yW5geCDtBqnOoxmR8+tNKiGuxKlDpuJxfsqpa2dFcexaziGAE/qoHLiDDreVNMupxGmSoNlyvsA3gw==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=6.9.0"
+      }
+    },
+    "node_modules/@babel/helpers": {
+      "version": "7.29.7",
+      "resolved": "https://registry.npmjs.org/@babel/helpers/-/helpers-7.29.7.tgz",
+      "integrity": "sha512-1k2lAGRMfHTcwuNYcCNUmaUffmQv8KWMfh2iJUUeRlwlwH4FdNG7mfPI10NPfLHJFThE4Tyr4mv7kTNZOiPuBg==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@babel/template": "^7.29.7",
+        "@babel/types": "^7.29.7"
+      },
+      "engines": {
+        "node": ">=6.9.0"
+      }
+    },
+    "node_modules/@babel/parser": {
+      "version": "7.29.8",
+      "resolved": "https://registry.npmjs.org/@babel/parser/-/parser-7.29.8.tgz",
+      "integrity": "sha512-E8lTAYNB1KW+FH+VGJuZM1ioAx2E6oVlvQFRrf5P8ZZmsiJXYAD9vTFV7yyEURNzgh1dFqMZuO6tUwcARbqFCA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@babel/types": "^7.29.8"
+      },
+      "bin": {
+        "parser": "bin/babel-parser.js"
+      },
+      "engines": {
+        "node": ">=6.0.0"
+      }
+    },
+    "node_modules/@babel/plugin-transform-react-jsx-self": {
+      "version": "7.29.7",
+      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-react-jsx-self/-/plugin-transform-react-jsx-self-7.29.7.tgz",
+      "integrity": "sha512-TL0hMc9xzy86VD31nUiwzd5otRAcyEPcsegCxolO0PvcXuH1v0kECe/UIznYFihpkvU5wg/jk4v0TTEFfm53fw==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@babel/helper-plugin-utils": "^7.29.7"
+      },
+      "engines": {
+        "node": ">=6.9.0"
+      },
+      "peerDependencies": {
+        "@babel/core": "^7.0.0-0"
+      }
+    },
+    "node_modules/@babel/plugin-transform-react-jsx-source": {
+      "version": "7.29.7",
+      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-react-jsx-source/-/plugin-transform-react-jsx-source-7.29.7.tgz",
+      "integrity": "sha512-06IyK09H3wi4cGbhDBwp5gUGo0IKtnYa8tyTiephirPCK6fbobVGiXMMI5zLQ4aKEYP3wZ3ArU44o+8KMrSG/Q==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@babel/helper-plugin-utils": "^7.29.7"
+      },
+      "engines": {
+        "node": ">=6.9.0"
+      },
+      "peerDependencies": {
+        "@babel/core": "^7.0.0-0"
+      }
+    },
+    "node_modules/@babel/runtime": {
+      "version": "7.29.7",
+      "resolved": "https://registry.npmjs.org/@babel/runtime/-/runtime-7.29.7.tgz",
+      "integrity": "sha512-Nq8OhGWiZIZGV6hLHoyAKLLcJihP/xFeBMGJoUrxTX2psI8dCifzLhZISFb+VWS3wFMRDmCGw5R+dOySCqPLhw==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=6.9.0"
+      }
+    },
+    "node_modules/@babel/template": {
+      "version": "7.29.7",
+      "resolved": "https://registry.npmjs.org/@babel/template/-/template-7.29.7.tgz",
+      "integrity": "sha512-puq+Gf35oI24FeN11LkoUQFqv9uwNeWpxXZi/Ji3rRIoKAzKnxRaZ+Gkj0vKS9ZCiTESfng1N9LyOyXvo+m+Gg==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@babel/code-frame": "^7.29.7",
+        "@babel/parser": "^7.29.7",
+        "@babel/types": "^7.29.7"
+      },
+      "engines": {
+        "node": ">=6.9.0"
+      }
+    },
+    "node_modules/@babel/traverse": {
+      "version": "7.29.8",
+      "resolved": "https://registry.npmjs.org/@babel/traverse/-/traverse-7.29.8.tgz",
+      "integrity": "sha512-I5z7H3bf/41ktsNVLtpN0wAa336HkqIHQ5BuPLEhTkt1jVSyZpeNKIzTgEWmlxjdg81R0IgUCcaE+Ok3NvrfZg==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@babel/code-frame": "^7.29.7",
+        "@babel/generator": "^7.29.8",
+        "@babel/helper-globals": "^7.29.7",
+        "@babel/parser": "^7.29.8",
+        "@babel/template": "^7.29.7",
+        "@babel/types": "^7.29.8",
+        "debug": "^4.3.1"
+      },
+      "engines": {
+        "node": ">=6.9.0"
+      }
+    },
+    "node_modules/@babel/types": {
+      "version": "7.29.8",
+      "resolved": "https://registry.npmjs.org/@babel/types/-/types-7.29.8.tgz",
+      "integrity": "sha512-Vj1jF3cPfxg7OAfoI7QnVKLoILlm2JF9pnVHrX8qx7AHMiYWT+NDAA7jChlNgRS4WTLc/fD1lXLmPixluj+3Gg==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@babel/helper-string-parser": "^7.29.7",
+        "@babel/helper-validator-identifier": "^7.29.7"
+      },
+      "engines": {
+        "node": ">=6.9.0"
+      }
+    },
+    "node_modules/@csstools/color-helpers": {
+      "version": "6.1.1",
+      "resolved": "https://registry.npmjs.org/@csstools/color-helpers/-/color-helpers-6.1.1.tgz",
+      "integrity": "sha512-gLNsunvwf3mCi5u5o46/Z/JcJMnhbHSaZ69rkgPzNM3J4s8hWwpPUQB6/tt0EDFyCiWzxANlx+2LJwpYj4zS1w==",
+      "dev": true,
+      "funding": [
+        {
+          "type": "github",
+          "url": "https://github.com/sponsors/csstools"
+        },
+        {
+          "type": "opencollective",
+          "url": "https://opencollective.com/csstools"
+        }
+      ],
+      "license": "MIT-0",
+      "engines": {
+        "node": ">=20.19.0"
+      }
+    },
+    "node_modules/@csstools/css-calc": {
+      "version": "3.4.0",
+      "resolved": "https://registry.npmjs.org/@csstools/css-calc/-/css-calc-3.4.0.tgz",
+      "integrity": "sha512-XQKj5B7QiZcHiegCOCAzcAOJdhGgWOHbbu62h5e5mkHnn8lWcfiJhllkqWmxu5zWR9jucPHuo1iTB56P033hcg==",
+      "dev": true,
+      "funding": [
+        {
+          "type": "github",
+          "url": "https://github.com/sponsors/csstools"
+        },
+        {
+          "type": "opencollective",
+          "url": "https://opencollective.com/csstools"
+        }
+      ],
+      "license": "MIT",
+      "engines": {
+        "node": ">=20.19.0"
+      },
+      "peerDependencies": {
+        "@csstools/css-parser-algorithms": "^4.0.0",
+        "@csstools/css-tokenizer": "^4.0.0"
+      }
+    },
+    "node_modules/@csstools/css-color-parser": {
+      "version": "4.2.3",
+      "resolved": "https://registry.npmjs.org/@csstools/css-color-parser/-/css-color-parser-4.2.3.tgz",
+      "integrity": "sha512-y4LpL+lmpuyKDiEFq2PnZUVFdAjsoB/qQJod79yLNokXyW7jewi+/WJ69EfItj8A2unWtxXnGjw6LYXgXu5ZjA==",
+      "dev": true,
+      "funding": [
+        {
+          "type": "github",
+          "url": "https://github.com/sponsors/csstools"
+        },
+        {
+          "type": "opencollective",
+          "url": "https://opencollective.com/csstools"
+        }
+      ],
+      "license": "MIT",
+      "dependencies": {
+        "@csstools/color-helpers": "^6.1.1",
+        "@csstools/css-calc": "^3.4.0"
+      },
+      "engines": {
+        "node": ">=20.19.0"
+      },
+      "peerDependencies": {
+        "@csstools/css-parser-algorithms": "^4.0.0",
+        "@csstools/css-tokenizer": "^4.0.0"
+      }
+    },
+    "node_modules/@csstools/css-parser-algorithms": {
+      "version": "4.0.0",
+      "resolved": "https://registry.npmjs.org/@csstools/css-parser-algorithms/-/css-parser-algorithms-4.0.0.tgz",
+      "integrity": "sha512-+B87qS7fIG3L5h3qwJ/IFbjoVoOe/bpOdh9hAjXbvx0o8ImEmUsGXN0inFOnk2ChCFgqkkGFQ+TpM5rbhkKe4w==",
+      "dev": true,
+      "funding": [
+        {
+          "type": "github",
+          "url": "https://github.com/sponsors/csstools"
+        },
+        {
+          "type": "opencollective",
+          "url": "https://opencollective.com/csstools"
+        }
+      ],
+      "license": "MIT",
+      "engines": {
+        "node": ">=20.19.0"
+      },
+      "peerDependencies": {
+        "@csstools/css-tokenizer": "^4.0.0"
+      }
+    },
+    "node_modules/@csstools/css-syntax-patches-for-csstree": {
+      "version": "1.1.14",
+      "resolved": "https://registry.npmjs.org/@csstools/css-syntax-patches-for-csstree/-/css-syntax-patches-for-csstree-1.1.14.tgz",
+      "integrity": "sha512-HpbVXyrofRXpHpgkNIjU/3EWR4WJvOkO3emNK/L6X/mTJU7bGUI3AkkpoTNXznQLp0KRjLHELTGeKI5dIkI9JQ==",
+      "dev": true,
+      "funding": [
+        {
+          "type": "github",
+          "url": "https://github.com/sponsors/csstools"
+        },
+        {
+          "type": "opencollective",
+          "url": "https://opencollective.com/csstools"
+        }
+      ],
+      "license": "MIT-0",
+      "peerDependencies": {
+        "css-tree": "^3.2.1"
+      },
+      "peerDependenciesMeta": {
+        "css-tree": {
+          "optional": true
+        }
+      }
+    },
+    "node_modules/@csstools/css-tokenizer": {
+      "version": "4.0.0",
+      "resolved": "https://registry.npmjs.org/@csstools/css-tokenizer/-/css-tokenizer-4.0.0.tgz",
+      "integrity": "sha512-QxULHAm7cNu72w97JUNCBFODFaXpbDg+dP8b/oWFAZ2MTRppA3U00Y2L1HqaS4J6yBqxwa/Y3nMBaxVKbB/NsA==",
+      "dev": true,
+      "funding": [
+        {
+          "type": "github",
+          "url": "https://github.com/sponsors/csstools"
+        },
+        {
+          "type": "opencollective",
+          "url": "https://opencollective.com/csstools"
+        }
+      ],
+      "license": "MIT",
+      "engines": {
+        "node": ">=20.19.0"
+      }
+    },
+    "node_modules/@esbuild/aix-ppc64": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/aix-ppc64/-/aix-ppc64-0.28.2.tgz",
+      "integrity": "sha512-XExcO+dvLKvVtNTibSTBej1NCAbaGhWn9Ww1ZPx80qsahhPFe/8jgWP0IchNe0F3HwkU7n8ejhH8bjonqht8mQ==",
+      "cpu": [
+        "ppc64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "aix"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/android-arm": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/android-arm/-/android-arm-0.28.2.tgz",
+      "integrity": "sha512-kXXoiPVVGQcnIYGOeaovwOURpniDBpSq4A03qkQ+BMQqtGG6HYap3xne9C1O1yo4TR3qxlCX5IqqmX6fFo2Lqg==",
+      "cpu": [
+        "arm"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "android"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/android-arm64": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/android-arm64/-/android-arm64-0.28.2.tgz",
+      "integrity": "sha512-5YfKeeI8qWfBZIX+u2xZC3Zlb3Os/gLS2sbEKM+I4ZOcsWmHS2WLysCcQZDAFRslDUU5Oiq44gf6PYN1vGwG5A==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "android"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/android-x64": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/android-x64/-/android-x64-0.28.2.tgz",
+      "integrity": "sha512-O387ite7SzUyCcy3JQX4P4bLtEA7bLLkx+esve5JHnyYfNTxcVpXZo9jhdB0lTKN44gztELTdU7nS8Nr16Fs1Q==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "android"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/darwin-arm64": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/darwin-arm64/-/darwin-arm64-0.28.2.tgz",
+      "integrity": "sha512-n4KqkOQrraxHJcgjM1RvwbigfQKIKJVpM7xp+KsxiyUSrRdIXnt73VhrPAx0fV44hgfmIVKjxMN9J1t5jySVkw==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "darwin"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/darwin-x64": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/darwin-x64/-/darwin-x64-0.28.2.tgz",
+      "integrity": "sha512-uq6suIWYP37qzGddBKPw5QEQPi6HiLGsO7UmkpfyaYNQ3D+rN6w6WfwH+nuqcGXWvawGwxOEroO4YGnFh95azw==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "darwin"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/freebsd-arm64": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/freebsd-arm64/-/freebsd-arm64-0.28.2.tgz",
+      "integrity": "sha512-n+I0BTSRIoy+d6RPKnEVwql5UwBJolytvY4mAOIEJorKlqgPII8ix6slVVrfZ5Tnj7glIZvloylbB/EJPMWEXw==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "freebsd"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/freebsd-x64": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/freebsd-x64/-/freebsd-x64-0.28.2.tgz",
+      "integrity": "sha512-78XJTJkvPs0kz2w61301PJjXl4g7q3JqiYMZ/M/yVI73EHBrCRTgkhu9oqG7vPqq+a/yadEW8aD+agKlk5xrmg==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "freebsd"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/linux-arm": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/linux-arm/-/linux-arm-0.28.2.tgz",
+      "integrity": "sha512-XlDnu2q5yoqems+xay6wSAcg9DDD7K9RLKZEBOMZm3ckNpJBvOX20tSfby8KfrrhINDyv9V2YVZKY/SpoGJI8w==",
+      "cpu": [
+        "arm"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/linux-arm64": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/linux-arm64/-/linux-arm64-0.28.2.tgz",
+      "integrity": "sha512-pW4AC0P3it8c7do9MVM4p51FzHzdM/TZrerurgRcHJ2WTa1VQ1CIq18xncfpBJw4ojkiZZrKW2yIBWBP92j6Ug==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/linux-ia32": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/linux-ia32/-/linux-ia32-0.28.2.tgz",
+      "integrity": "sha512-CYbnj78HsIeA+DhgUKgFCfvNsTHFhMMrinUrMZpDXJXKN8T3XViTZ/+wtHeVxEWY8ewSzTFN+nRmSwO2tZaLUQ==",
+      "cpu": [
+        "ia32"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/linux-loong64": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/linux-loong64/-/linux-loong64-0.28.2.tgz",
+      "integrity": "sha512-buwkd8nsph4R+ajRvw0qM5Hja/TXQow3ptzWO2EbG/cqcIkHloRrdlBtQlshyYGTNFvfkfJ5tpPLVkY4DtsPfQ==",
+      "cpu": [
+        "loong64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/linux-mips64el": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/linux-mips64el/-/linux-mips64el-0.28.2.tgz",
+      "integrity": "sha512-ZVykbDyk7519VwiNb9Lcj9m8XM6v5V9uKPvrEMkkEedVewf+0itkhahp4HDpgERXhwLRpWFypsGbG/J8s0QjJA==",
+      "cpu": [
+        "mips64el"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/linux-ppc64": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/linux-ppc64/-/linux-ppc64-0.28.2.tgz",
+      "integrity": "sha512-CAXl+Dtd9UUuJd8pKKdwh6MLm3MUMiqMPmhZ3tTSXPqfyQ3vDl6R5hZdZ/kYojK4ofXtdfSv1tFq8XzWx3heNQ==",
+      "cpu": [
+        "ppc64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/linux-riscv64": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/linux-riscv64/-/linux-riscv64-0.28.2.tgz",
+      "integrity": "sha512-GeXCej4IQtU1B+QlDV8W/RRvbzI3O/Stss+/bCXv4lZls5WGRtu2a+3JkA3i4qIUlMXpcHebWpF8AkJhATowuA==",
+      "cpu": [
+        "riscv64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/linux-s390x": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/linux-s390x/-/linux-s390x-0.28.2.tgz",
+      "integrity": "sha512-3H1weTYZPxt/WOhByszQZybS9w5lKzUn1FDMsgEChbHWQwHYQQRfBxgCcZvPhjHfKyJjIievvMmEUawJrdY9Dg==",
+      "cpu": [
+        "s390x"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/linux-x64": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/linux-x64/-/linux-x64-0.28.2.tgz",
+      "integrity": "sha512-4xTZr1FUmSoQW4XIWmit3tzQrUTZM+N3P0XV8xROKYF50XfI7xeO90+1bZvNwxIufQ9hDQVRJH5YhgPVF8A/HQ==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/netbsd-arm64": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/netbsd-arm64/-/netbsd-arm64-0.28.2.tgz",
+      "integrity": "sha512-sSATRjPeDBg3pdgHoQfoYBob11Kk1FGa9lui5RIHZCoCkJa9QKlvl3/vKz2usCmYYjs7ymJR/2Nnsqe+Hjt5nw==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "netbsd"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/netbsd-x64": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/netbsd-x64/-/netbsd-x64-0.28.2.tgz",
+      "integrity": "sha512-lqnzCV+mM0gIADaKihiCg6ifgfU2L3h5E33rNQBN1Y4MaVGnzryzmvvf7UHxprpQdE8hpqLolJ9Rl+SkIRDpyw==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "netbsd"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/openbsd-arm64": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/openbsd-arm64/-/openbsd-arm64-0.28.2.tgz",
+      "integrity": "sha512-AL2qJILH7lNjrDmCQDvdxMfAUIv8KMNZOvrwAQ8i8//ntL9FflhOyMJ8OZSMBb8/AWXe3/5v5S20y3zCoZWKoQ==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "openbsd"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/openbsd-x64": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/openbsd-x64/-/openbsd-x64-0.28.2.tgz",
+      "integrity": "sha512-QtiuPytchRyC4rwUKhexJdQKvDuZ6hWloi3igqPQNUJCS1/v9EiO3UTOXR6A3FoMo4fnAKbWJdqaIwhOzh8qEw==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "openbsd"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/openharmony-arm64": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/openharmony-arm64/-/openharmony-arm64-0.28.2.tgz",
+      "integrity": "sha512-WkhYDmpTjLvGlScA1rwjRUmhl4k8oXR3cIbtqWmELgU/dFeHHlEllxDvdWcNJV9rbzCexB5vz8gtNewWLgCT7Q==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "openharmony"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/sunos-x64": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/sunos-x64/-/sunos-x64-0.28.2.tgz",
+      "integrity": "sha512-GPMSkTOtMnv2U2F8gxe4Io6qmVs+YKyp832Etqqxr0hFngmXQ3rzwytelm3GIn7T4VviRUlf3sOgBOiTdvaf7g==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "sunos"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/win32-arm64": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/win32-arm64/-/win32-arm64-0.28.2.tgz",
+      "integrity": "sha512-PIhhEkE9uPBleRBrQEJpUn7MBnibZzbGzYWPmY3x+YoVg/95zbjB4CxPPOQ8l5tYYM4mMaCthF8/1DIfBQQyWQ==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "win32"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/win32-ia32": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/win32-ia32/-/win32-ia32-0.28.2.tgz",
+      "integrity": "sha512-YmJbfTlvU7Sdn9BB+4PRES4oB6pxgS37MAONj+hBr/cpXS1aBPKXxNnDbu+QCWPj0o9dgyxeq79g6c5P8KeuYA==",
+      "cpu": [
+        "ia32"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "win32"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@esbuild/win32-x64": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/@esbuild/win32-x64/-/win32-x64-0.28.2.tgz",
+      "integrity": "sha512-5ebpxr3nWMzrL/rnUI755Jkuee0bHL/Gq0WTF9lvcpv73wAp5eu8MfBUgWK9bhWvZjj7yX8etf/8tI8Ney695g==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "win32"
+      ],
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@exodus/bytes": {
+      "version": "1.15.1",
+      "resolved": "https://registry.npmjs.org/@exodus/bytes/-/bytes-1.15.1.tgz",
+      "integrity": "sha512-S6mL0yNB/Abt9Ei4tq8gDhcczc4S3+vQ4ra7vxnAf+YHC02srtqxKKZghx2Dq6p0e66THKwR6r8N6P95wEty7Q==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": "^20.19.0 || ^22.12.0 || >=24.0.0"
+      },
+      "peerDependencies": {
+        "@noble/hashes": "^1.8.0 || ^2.0.0"
+      },
+      "peerDependenciesMeta": {
+        "@noble/hashes": {
+          "optional": true
+        }
+      }
+    },
+    "node_modules/@jridgewell/gen-mapping": {
+      "version": "0.3.13",
+      "resolved": "https://registry.npmjs.org/@jridgewell/gen-mapping/-/gen-mapping-0.3.13.tgz",
+      "integrity": "sha512-2kkt/7niJ6MgEPxF0bYdQ6etZaA+fQvDcLKckhy1yIQOzaoKjBBjSj63/aLVjYE3qhRt5dvM+uUyfCg6UKCBbA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@jridgewell/sourcemap-codec": "^1.5.0",
+        "@jridgewell/trace-mapping": "^0.3.24"
+      }
+    },
+    "node_modules/@jridgewell/remapping": {
+      "version": "2.3.5",
+      "resolved": "https://registry.npmjs.org/@jridgewell/remapping/-/remapping-2.3.5.tgz",
+      "integrity": "sha512-LI9u/+laYG4Ds1TDKSJW2YPrIlcVYOwi2fUC6xB43lueCjgxV4lffOCZCtYFiH6TNOX+tQKXx97T4IKHbhyHEQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@jridgewell/gen-mapping": "^0.3.5",
+        "@jridgewell/trace-mapping": "^0.3.24"
+      }
+    },
+    "node_modules/@jridgewell/resolve-uri": {
+      "version": "3.1.2",
+      "resolved": "https://registry.npmjs.org/@jridgewell/resolve-uri/-/resolve-uri-3.1.2.tgz",
+      "integrity": "sha512-bRISgCIjP20/tbWSPWMEi54QVPRZExkuD9lJL+UIxUKtwVJA8wW1Trb1jMs1RFXo1CBTNZ/5hpC9QvmKWdopKw==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=6.0.0"
+      }
+    },
+    "node_modules/@jridgewell/sourcemap-codec": {
+      "version": "1.6.0",
+      "resolved": "https://registry.npmjs.org/@jridgewell/sourcemap-codec/-/sourcemap-codec-1.6.0.tgz",
+      "integrity": "sha512-T7jf+5zgsZHwNJ4lvQ7/aezbyk0nNX+zJVWpmHA7VYsEx7a7qr5Rg5IbtJFqkgze5Y2sruq1RUY8Q837Od7iFw==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/@jridgewell/trace-mapping": {
+      "version": "0.3.31",
+      "resolved": "https://registry.npmjs.org/@jridgewell/trace-mapping/-/trace-mapping-0.3.31.tgz",
+      "integrity": "sha512-zzNR+SdQSDJzc8joaeP8QQoCQr8NuYx2dIIytl1QeBEZHJ9uW6hebsrYgbz8hJwUQao3TWCMtmfV8Nu1twOLAw==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@jridgewell/resolve-uri": "^3.1.0",
+        "@jridgewell/sourcemap-codec": "^1.4.14"
+      }
+    },
+    "node_modules/@napi-rs/lzma-linux-x64-gnu": {
+      "version": "1.5.1",
+      "resolved": "https://registry.npmjs.org/@napi-rs/lzma-linux-x64-gnu/-/lzma-linux-x64-gnu-1.5.1.tgz",
+      "integrity": "sha512-oTXEIha4SsuXdTA4Iyskj0kpdx2yVXdhd75c2v3xGrHFfVMsbhTPZU/nMPL4sWKo4pBHm3aucLaqGlF696dTyQ==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "libc": [
+        "glibc"
+      ],
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ],
+      "engines": {
+        "node": "^22.20 || ^24.12 || >=25"
+      }
+    },
+    "node_modules/@rolldown/pluginutils": {
+      "version": "1.0.0-rc.3",
+      "resolved": "https://registry.npmjs.org/@rolldown/pluginutils/-/pluginutils-1.0.0-rc.3.tgz",
+      "integrity": "sha512-eybk3TjzzzV97Dlj5c+XrBFW57eTNhzod66y9HrBlzJ6NsCrWCp/2kaPS3K9wJmurBC0Tdw4yPjXKZqlznim3Q==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/@rollup/rollup-android-arm-eabi": {
+      "version": "4.63.3",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-android-arm-eabi/-/rollup-android-arm-eabi-4.63.3.tgz",
+      "integrity": "sha512-w3Jnvi1ocaVm/c7yVPpfB98XeSRBMyzp6njL5MVVbGyXjpmUkN+s6Hp4t0PqhGCCaI1ZHMKXt/w0lA1RCaLVcw==",
+      "cpu": [
+        "arm"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "android"
+      ]
+    },
+    "node_modules/@rollup/rollup-android-arm64": {
+      "version": "4.63.3",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-android-arm64/-/rollup-android-arm64-4.63.3.tgz",
+      "integrity": "sha512-uI/ESiaIbbRYAEhzy8PCUWDp1hB0bjAqM06mW9flOoNO4Q8DQpeoREhBR5Hegfl+wpXiguyJv6XSPzEN7OxyHQ==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "android"
+      ]
+    },
+    "node_modules/@rollup/rollup-darwin-arm64": {
+      "version": "4.63.3",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-darwin-arm64/-/rollup-darwin-arm64-4.63.3.tgz",
+      "integrity": "sha512-oxhrd1jmXLwWZ83eQYDXxuqRdkqkzrjR3JobKeuUyfdNZo11FuQIvqEOZhyIT7OBHxXoGslDDjN0cQcM6T0TqQ==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "darwin"
+      ]
+    },
+    "node_modules/@rollup/rollup-darwin-x64": {
+      "version": "4.63.3",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-darwin-x64/-/rollup-darwin-x64-4.63.3.tgz",
+      "integrity": "sha512-7/YiIMghVE8DrxKvNdorAaJVdriOFgOIpdStnPx8ppx5zfTwC3jBCSEAIzB7JD5404m65THl6H93UTTVUvypmg==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "darwin"
+      ]
+    },
+    "node_modules/@rollup/rollup-freebsd-arm64": {
+      "version": "4.63.3",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-freebsd-arm64/-/rollup-freebsd-arm64-4.63.3.tgz",
+      "integrity": "sha512-GXFZRRoMAytaI5z6N3Zhfw0WL18Q0M8r95D5hlC4GqE/lGk8pbSJNUBoOWDfbm6dTciqHj2nU87tI5f6XhQiOg==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "freebsd"
+      ]
+    },
+    "node_modules/@rollup/rollup-freebsd-x64": {
+      "version": "4.63.3",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-freebsd-x64/-/rollup-freebsd-x64-4.63.3.tgz",
+      "integrity": "sha512-77W+8X3ddYgPxUpB8nZFQs2Mq+wc4HVlcSRtApXLjYBcnPMkttrSnU8VwKQjeWYhMsITHFs5cWBQ8vz1Q+5RHQ==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "freebsd"
+      ]
+    },
+    "node_modules/@rollup/rollup-linux-arm-gnueabihf": {
+      "version": "4.63.3",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-arm-gnueabihf/-/rollup-linux-arm-gnueabihf-4.63.3.tgz",
+      "integrity": "sha512-FVkwK+iUC+mq+GipVK46rRVticfAPtvPUNlqlGXUDxdVk/UGjQiiiUVPUrEXdSpU2ufU0XxLGyTqDtBidDOVmg==",
+      "cpu": [
+        "arm"
+      ],
+      "dev": true,
+      "libc": [
+        "glibc"
+      ],
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ]
+    },
+    "node_modules/@rollup/rollup-linux-arm-musleabihf": {
+      "version": "4.63.3",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-arm-musleabihf/-/rollup-linux-arm-musleabihf-4.63.3.tgz",
+      "integrity": "sha512-+aGU1t3398yQOVj1Bz8o3e+KtswxAPvO+mtxtNdfXYMkXIHu7XhhkCD7/DEH9q8tF8uhDnMWvfpUKI8y1sZJsg==",
+      "cpu": [
+        "arm"
+      ],
+      "dev": true,
+      "libc": [
+        "musl"
+      ],
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ]
+    },
+    "node_modules/@rollup/rollup-linux-arm64-gnu": {
+      "version": "4.63.3",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-arm64-gnu/-/rollup-linux-arm64-gnu-4.63.3.tgz",
+      "integrity": "sha512-cR0kjpRXR2KJ2oQK8E2KTPtphs+b9hZ8IhTZubNryt/RsqgdOZBQ2Zq0q5UedtiIi0rs3jVhJh55RE1ZHUVGUA==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "libc": [
+        "glibc"
+      ],
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ]
+    },
+    "node_modules/@rollup/rollup-linux-arm64-musl": {
+      "version": "4.63.3",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-arm64-musl/-/rollup-linux-arm64-musl-4.63.3.tgz",
+      "integrity": "sha512-y1RYi4Q3/9ByVWSSt9kX2ustE0B7kFYbJ6zZdVZVyqopZs3yhCTwRfrjIX4vezUJInma/Gs6BOFDJg7yZmJ0IQ==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "libc": [
+        "musl"
+      ],
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ]
+    },
+    "node_modules/@rollup/rollup-linux-loong64-gnu": {
+      "version": "4.63.3",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-loong64-gnu/-/rollup-linux-loong64-gnu-4.63.3.tgz",
+      "integrity": "sha512-DNhEA5viIj3Z5bZLE4z4oV8N5ozWqDwyt7T6KG7VdLDJ0nW+rNOYlphBl4/3HQkK75qipPLsVOfStHHOwN9WSg==",
+      "cpu": [
+        "loong64"
+      ],
+      "dev": true,
+      "libc": [
+        "glibc"
+      ],
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ]
+    },
+    "node_modules/@rollup/rollup-linux-loong64-musl": {
+      "version": "4.63.3",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-loong64-musl/-/rollup-linux-loong64-musl-4.63.3.tgz",
+      "integrity": "sha512-17gQCqrIpXBX2Cmi9/TygnVOqGbzsba/iaqcYSL8FY7lNugg+7AiYNs5c5nKWD+NRQha36Sa0CqkJqH4XVHwnQ==",
+      "cpu": [
+        "loong64"
+      ],
+      "dev": true,
+      "libc": [
+        "musl"
+      ],
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ]
+    },
+    "node_modules/@rollup/rollup-linux-ppc64-gnu": {
+      "version": "4.63.3",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-ppc64-gnu/-/rollup-linux-ppc64-gnu-4.63.3.tgz",
+      "integrity": "sha512-6LwVnZRIyINpdku/yOcI8Tm9YqLmhHK5emmlOOnW9tO0SYEm1FmKPcsSAGp0NBlqR2P04xaND4jvN6sTHqhq8A==",
+      "cpu": [
+        "ppc64"
+      ],
+      "dev": true,
+      "libc": [
+        "glibc"
+      ],
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ]
+    },
+    "node_modules/@rollup/rollup-linux-ppc64-musl": {
+      "version": "4.63.3",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-ppc64-musl/-/rollup-linux-ppc64-musl-4.63.3.tgz",
+      "integrity": "sha512-xMUqkTXlEUtI/p5AAukMwBRr1enU3efsTeF+bskeFfk8t1C9rcC8sLREcZXmTfAXEbvRdJVSonVJez3TMlbR3w==",
+      "cpu": [
+        "ppc64"
+      ],
+      "dev": true,
+      "libc": [
+        "musl"
+      ],
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ]
+    },
+    "node_modules/@rollup/rollup-linux-riscv64-gnu": {
+      "version": "4.63.3",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-riscv64-gnu/-/rollup-linux-riscv64-gnu-4.63.3.tgz",
+      "integrity": "sha512-S3E94co9F9WRRqEaUoQZ38K1gCz6KiM+nL7/3ijq7fDGF3OznjS5TasgYITlvl27GQKtu4lOAOsr5MFwkijvOA==",
+      "cpu": [
+        "riscv64"
+      ],
+      "dev": true,
+      "libc": [
+        "glibc"
+      ],
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ]
+    },
+    "node_modules/@rollup/rollup-linux-riscv64-musl": {
+      "version": "4.63.3",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-riscv64-musl/-/rollup-linux-riscv64-musl-4.63.3.tgz",
+      "integrity": "sha512-1QtRDwG42x5BJI3s9mxu5rEjDnfbSnk20HQ9/ylTAYnSwYwxMVb+Vgu34wzzTQ7ogqBybebgQNUDAvZVQ38DbA==",
+      "cpu": [
+        "riscv64"
+      ],
+      "dev": true,
+      "libc": [
+        "musl"
+      ],
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ]
+    },
+    "node_modules/@rollup/rollup-linux-s390x-gnu": {
+      "version": "4.63.3",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-s390x-gnu/-/rollup-linux-s390x-gnu-4.63.3.tgz",
+      "integrity": "sha512-BQhejF6ZXOpxbngiNTP12GCGQeaDVL2QXGeBVViKIYzFHM5RKxTxwUMB1fr1BeNFphFMpnRqC5QSXFSa4z6UQw==",
+      "cpu": [
+        "s390x"
+      ],
+      "dev": true,
+      "libc": [
+        "glibc"
+      ],
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ]
+    },
+    "node_modules/@rollup/rollup-linux-x64-gnu": {
+      "version": "4.63.3",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-x64-gnu/-/rollup-linux-x64-gnu-4.63.3.tgz",
+      "integrity": "sha512-SXagRwnI2Wlwlitllu59UK/nGVbD1CKPcNqDplHwIC4BqJcpXFjD32d1R/RbuISa95HdQrZM3/7v4bKiowFaLA==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "libc": [
+        "glibc"
+      ],
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ]
+    },
+    "node_modules/@rollup/rollup-linux-x64-musl": {
+      "version": "4.63.3",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-x64-musl/-/rollup-linux-x64-musl-4.63.3.tgz",
+      "integrity": "sha512-2IPozoEALRCziGqE8O9KMK60PMu5TS1huv4fwoeCexj+WjmcwFtX9CTOVbfXCUqcELAubEwRFPYlzb/WvwY2HQ==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "libc": [
+        "musl"
+      ],
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ]
+    },
+    "node_modules/@rollup/rollup-openbsd-x64": {
+      "version": "4.63.3",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-openbsd-x64/-/rollup-openbsd-x64-4.63.3.tgz",
+      "integrity": "sha512-AoxqosUHT9IX54hFn2TiN6A7d6ZKTtE6pd2bqWtqkkNJ6HJGaU6FRouGX8L1O7R/ZwsnCnpQrHzb4pDEx+UHRQ==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "openbsd"
+      ]
+    },
+    "node_modules/@rollup/rollup-openharmony-arm64": {
+      "version": "4.63.3",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-openharmony-arm64/-/rollup-openharmony-arm64-4.63.3.tgz",
+      "integrity": "sha512-d+CaftKgmkFBzCwezMqqy1d0QNNYugqLCMcYVQWBy5SS2YfeMP8Q8ripkgx9O8IyBXXLHrJ+aaCV4U96usv6Yg==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "openharmony"
+      ]
+    },
+    "node_modules/@rollup/rollup-win32-arm64-msvc": {
+      "version": "4.63.3",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-win32-arm64-msvc/-/rollup-win32-arm64-msvc-4.63.3.tgz",
+      "integrity": "sha512-xXlDF6nR1eOuXbdDy5Hl5fmtY7teUDevF/k0O7IPoZe4Tpmdv+lgdE5JRsnhQtt37ql9P0VF2kAN9a0OCZdo+Q==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "win32"
+      ]
+    },
+    "node_modules/@rollup/rollup-win32-ia32-msvc": {
+      "version": "4.63.3",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-win32-ia32-msvc/-/rollup-win32-ia32-msvc-4.63.3.tgz",
+      "integrity": "sha512-YtXAgLN+JP7Ay6qG3eWhc7IHMQPzLc8r3uvhAvlJIoCz/4Q32+Bl9Fmnywidh8v1GOIMmymjovfqY9ETAtysvA==",
+      "cpu": [
+        "ia32"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "win32"
+      ]
+    },
+    "node_modules/@rollup/rollup-win32-x64-gnu": {
+      "version": "4.63.3",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-win32-x64-gnu/-/rollup-win32-x64-gnu-4.63.3.tgz",
+      "integrity": "sha512-WuWtSJRNo549vzcfZyEgfqb6zeSgn1F+UE5kQ+BCjzz0W4MGCjntUHkZVc1VRuAM7+ULaSyhiPxD1spyewFvkQ==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "win32"
+      ]
+    },
+    "node_modules/@rollup/rollup-win32-x64-msvc": {
+      "version": "4.63.3",
+      "resolved": "https://registry.npmjs.org/@rollup/rollup-win32-x64-msvc/-/rollup-win32-x64-msvc-4.63.3.tgz",
+      "integrity": "sha512-+lIKX7O0+IGe7WuhATaAMMeT7B76vfhXH/l9wLQL+nvyhbw2ohYCKIdWL56JfDu75CWt5oKRP4QFH/jkMtBquA==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "win32"
+      ]
+    },
+    "node_modules/@tanstack/query-core": {
+      "version": "5.103.0",
+      "resolved": "https://registry.npmjs.org/@tanstack/query-core/-/query-core-5.103.0.tgz",
+      "integrity": "sha512-PfafnHQHEu7mZDsSalxSW/EBxPgF77k3atIJeQbqbb1Z7DmK2mH6YLJyqrvbbDk5M6Ua/egs7LLEs04a8robxA==",
+      "license": "MIT",
+      "funding": {
+        "type": "github",
+        "url": "https://github.com/sponsors/tannerlinsley"
+      }
+    },
+    "node_modules/@tanstack/react-query": {
+      "version": "5.103.0",
+      "resolved": "https://registry.npmjs.org/@tanstack/react-query/-/react-query-5.103.0.tgz",
+      "integrity": "sha512-Kn/cvTrNwFYpS/q1MYghMsVTSinmAKV1U2AnM3/x07PiczvC+nMoySqNpQK1jgDzVCOIHk5LlF2FhTlJKQmPAQ==",
+      "license": "MIT",
+      "dependencies": {
+        "@tanstack/query-core": "5.103.0"
+      },
+      "funding": {
+        "type": "github",
+        "url": "https://github.com/sponsors/tannerlinsley"
+      },
+      "peerDependencies": {
+        "react": "^18 || ^19"
+      }
+    },
+    "node_modules/@testing-library/dom": {
+      "version": "10.4.2",
+      "resolved": "https://registry.npmjs.org/@testing-library/dom/-/dom-10.4.2.tgz",
+      "integrity": "sha512-yzr2S9HyAIdhz2/6qHgbs665Q7PKVcDF05vsOlHPxG1mo36gKVesdYVeDLnXgfjJ03CrKRk08knc6+E/9m8v2Q==",
+      "dev": true,
+      "license": "MIT",
+      "peer": true,
+      "dependencies": {
+        "@babel/code-frame": "^7.10.4",
+        "@babel/runtime": "^7.12.5",
+        "@types/aria-query": "^5.0.1",
+        "aria-query": "5.3.0",
+        "dom-accessibility-api": "^0.5.9",
+        "lz-string": "^1.5.0",
+        "picocolors": "1.1.1",
+        "pretty-format": "^27.0.2"
+      },
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/@testing-library/jest-dom": {
+      "version": "6.9.1",
+      "resolved": "https://registry.npmjs.org/@testing-library/jest-dom/-/jest-dom-6.9.1.tgz",
+      "integrity": "sha512-zIcONa+hVtVSSep9UT3jZ5rizo2BsxgyDYU7WFD5eICBE7no3881HGeb/QkGfsJs6JTkY1aQhT7rIPC7e+0nnA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@adobe/css-tools": "^4.4.0",
+        "aria-query": "^5.0.0",
+        "css.escape": "^1.5.1",
+        "dom-accessibility-api": "^0.6.3",
+        "picocolors": "^1.1.1",
+        "redent": "^3.0.0"
+      },
+      "engines": {
+        "node": ">=14",
+        "npm": ">=6",
+        "yarn": ">=1"
+      }
+    },
+    "node_modules/@testing-library/jest-dom/node_modules/dom-accessibility-api": {
+      "version": "0.6.3",
+      "resolved": "https://registry.npmjs.org/dom-accessibility-api/-/dom-accessibility-api-0.6.3.tgz",
+      "integrity": "sha512-7ZgogeTnjuHbo+ct10G9Ffp0mif17idi0IyWNVA/wcwcm7NPOD/WEHVP3n7n3MhXqxoIYm8d6MuZohYWIZ4T3w==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/@testing-library/react": {
+      "version": "16.3.3",
+      "resolved": "https://registry.npmjs.org/@testing-library/react/-/react-16.3.3.tgz",
+      "integrity": "sha512-Uo193NgQbPMz6lrrhtRQQFcMC6Re/ELLFbbuVL30WDlZxlpZf9/lMHTAVxPRLw1q1iu9OJmR1c2BLiENRstdBg==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@babel/runtime": "^7.12.5"
+      },
+      "engines": {
+        "node": ">=18"
+      },
+      "peerDependencies": {
+        "@testing-library/dom": "^10.0.0",
+        "@types/react": "^18.0.0 || ^19.0.0",
+        "@types/react-dom": "^18.0.0 || ^19.0.0",
+        "react": "^18.0.0 || ^19.0.0",
+        "react-dom": "^18.0.0 || ^19.0.0"
+      },
+      "peerDependenciesMeta": {
+        "@types/react": {
+          "optional": true
+        },
+        "@types/react-dom": {
+          "optional": true
+        }
+      }
+    },
+    "node_modules/@testing-library/user-event": {
+      "version": "14.6.7",
+      "resolved": "https://registry.npmjs.org/@testing-library/user-event/-/user-event-14.6.7.tgz",
+      "integrity": "sha512-MPCpX8bxe8zS+JmmTwLp8jd0dy1rAm60Te/SL8JrQM3qvQJcBOs1d7IefJMyZzqM3EWBrDn/LWDt1BCGu4ASfg==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=12",
+        "npm": ">=6"
+      },
+      "peerDependencies": {
+        "@testing-library/dom": ">=7.21.4"
+      }
+    },
+    "node_modules/@types/aria-query": {
+      "version": "5.0.4",
+      "resolved": "https://registry.npmjs.org/@types/aria-query/-/aria-query-5.0.4.tgz",
+      "integrity": "sha512-rfT93uj5s0PRL7EzccGMs3brplhcrghnDoV26NqKhCAS1hVo+WdNsPvE/yb6ilfr5hi2MEk6d5EWJTKdxg8jVw==",
+      "dev": true,
+      "license": "MIT",
+      "peer": true
+    },
+    "node_modules/@types/babel__core": {
+      "version": "7.20.5",
+      "resolved": "https://registry.npmjs.org/@types/babel__core/-/babel__core-7.20.5.tgz",
+      "integrity": "sha512-qoQprZvz5wQFJwMDqeseRXWv3rqMvhgpbXFfVyWhbx9X47POIA6i/+dXefEmZKoAgOaTdaIgNSMqMIU61yRyzA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@babel/parser": "^7.20.7",
+        "@babel/types": "^7.20.7",
+        "@types/babel__generator": "*",
+        "@types/babel__template": "*",
+        "@types/babel__traverse": "*"
+      }
+    },
+    "node_modules/@types/babel__generator": {
+      "version": "7.27.0",
+      "resolved": "https://registry.npmjs.org/@types/babel__generator/-/babel__generator-7.27.0.tgz",
+      "integrity": "sha512-ufFd2Xi92OAVPYsy+P4n7/U7e68fex0+Ee8gSG9KX7eo084CWiQ4sdxktvdl0bOPupXtVJPY19zk6EwWqUQ8lg==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@babel/types": "^7.0.0"
+      }
+    },
+    "node_modules/@types/babel__template": {
+      "version": "7.4.4",
+      "resolved": "https://registry.npmjs.org/@types/babel__template/-/babel__template-7.4.4.tgz",
+      "integrity": "sha512-h/NUaSyG5EyxBIp8YRxo4RMe2/qQgvyowRwVMzhYhBCONbW8PUsg4lkFMrhgZhUe5z3L3MiLDuvyJ/CaPa2A8A==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@babel/parser": "^7.1.0",
+        "@babel/types": "^7.0.0"
+      }
+    },
+    "node_modules/@types/babel__traverse": {
+      "version": "7.28.0",
+      "resolved": "https://registry.npmjs.org/@types/babel__traverse/-/babel__traverse-7.28.0.tgz",
+      "integrity": "sha512-8PvcXf70gTDZBgt9ptxJ8elBeBjcLOAcOtoO/mPJjtji1+CdGbHgm77om1GrsPxsiE+uXIpNSK64UYaIwQXd4Q==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@babel/types": "^7.28.2"
+      }
+    },
+    "node_modules/@types/chai": {
+      "version": "5.2.3",
+      "resolved": "https://registry.npmjs.org/@types/chai/-/chai-5.2.3.tgz",
+      "integrity": "sha512-Mw558oeA9fFbv65/y4mHtXDs9bPnFMZAL/jxdPFUpOHHIXX91mcgEHbS5Lahr+pwZFR8A7GQleRWeI6cGFC2UA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@types/deep-eql": "*",
+        "assertion-error": "^2.0.1"
+      }
+    },
+    "node_modules/@types/deep-eql": {
+      "version": "4.0.2",
+      "resolved": "https://registry.npmjs.org/@types/deep-eql/-/deep-eql-4.0.2.tgz",
+      "integrity": "sha512-c9h9dVVMigMPc4bwTvC5dxqtqJZwQPePsWjPlpSOnojbor6pGqdk541lfA7AqFQr5pB1BRdq0juY9db81BwyFw==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/@types/estree": {
+      "version": "1.0.9",
+      "resolved": "https://registry.npmjs.org/@types/estree/-/estree-1.0.9.tgz",
+      "integrity": "sha512-GhdPgy1el4/ImP05X05Uw4cw2/M93BCUmnEvWZNStlCzEKME4Fkk+YpoA5OiHNQmoS7Cafb8Xa3Pya8m1Qrzeg==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/@types/node": {
+      "version": "24.13.5",
+      "resolved": "https://registry.npmjs.org/@types/node/-/node-24.13.5.tgz",
+      "integrity": "sha512-TXyindR+lBr22aJIdMQzCFHPHR6cR4js838mRDCSz5hOKWZvZwsXSSiXDmjRj4iJmgl+sR9O+1mkoVBSMadNug==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "undici-types": "~7.18.0"
+      }
+    },
+    "node_modules/@types/react": {
+      "version": "19.3.0",
+      "resolved": "https://registry.npmjs.org/@types/react/-/react-19.3.0.tgz",
+      "integrity": "sha512-N0rFCuH9YoxG9/m61l9MfpJKfmLOVU0em7ipIz6TRgSSkvReLB9vL85GB+yr8Bs5leqpvg96JSwF4ZS1s4viQg==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "csstype": "^3.2.2"
+      }
+    },
+    "node_modules/@types/react-dom": {
+      "version": "19.3.0",
+      "resolved": "https://registry.npmjs.org/@types/react-dom/-/react-dom-19.3.0.tgz",
+      "integrity": "sha512-ZI7bU42mZXXKHn/qNLEw2IrbiINU7X5+vfgdixBHkCNpYWXjKgfQ/P+uyGb5CjOLB9UcnTeg3rylQtV2hym44Q==",
+      "dev": true,
+      "license": "MIT",
+      "peerDependencies": {
+        "@types/react": "^19.3.0"
+      }
+    },
+    "node_modules/@vitejs/plugin-react": {
+      "version": "5.2.0",
+      "resolved": "https://registry.npmjs.org/@vitejs/plugin-react/-/plugin-react-5.2.0.tgz",
+      "integrity": "sha512-YmKkfhOAi3wsB1PhJq5Scj3GXMn3WvtQ/JC0xoopuHoXSdmtdStOpFrYaT1kie2YgFBcIe64ROzMYRjCrYOdYw==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@babel/core": "^7.29.0",
+        "@babel/plugin-transform-react-jsx-self": "^7.27.1",
+        "@babel/plugin-transform-react-jsx-source": "^7.27.1",
+        "@rolldown/pluginutils": "1.0.0-rc.3",
+        "@types/babel__core": "^7.20.5",
+        "react-refresh": "^0.18.0"
+      },
+      "engines": {
+        "node": "^20.19.0 || >=22.12.0"
+      },
+      "peerDependencies": {
+        "vite": "^4.2.0 || ^5.0.0 || ^6.0.0 || ^7.0.0 || ^8.0.0"
+      }
+    },
+    "node_modules/@vitest/expect": {
+      "version": "3.2.7",
+      "resolved": "https://registry.npmjs.org/@vitest/expect/-/expect-3.2.7.tgz",
+      "integrity": "sha512-E8eBXaKibuvH2pSZErOjdVb5vF4PbKYcrnluBTYxEk1l/VhhwZg1kZQsdtjq+CsF5CFydf2Rdkz7jDHKSisi3w==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@types/chai": "^5.2.2",
+        "@vitest/spy": "3.2.7",
+        "@vitest/utils": "3.2.7",
+        "chai": "^5.2.0",
+        "tinyrainbow": "^2.0.0"
+      },
+      "funding": {
+        "url": "https://opencollective.com/vitest"
+      }
+    },
+    "node_modules/@vitest/mocker": {
+      "version": "3.2.7",
+      "resolved": "https://registry.npmjs.org/@vitest/mocker/-/mocker-3.2.7.tgz",
+      "integrity": "sha512-Trr0hYO9CM3Wj6ksWHRhK9IZpIY6wTMO5u/MqXurMxT57sWBaOPEtP3Oq60ihZuh5JsiagKfz95OcxdEP6dBrA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@vitest/spy": "3.2.7",
+        "estree-walker": "^3.0.3",
+        "magic-string": "^0.30.17"
+      },
+      "funding": {
+        "url": "https://opencollective.com/vitest"
+      },
+      "peerDependencies": {
+        "msw": "^2.4.9",
+        "vite": "^5.0.0 || ^6.0.0 || ^7.0.0-0"
+      },
+      "peerDependenciesMeta": {
+        "msw": {
+          "optional": true
+        },
+        "vite": {
+          "optional": true
+        }
+      }
+    },
+    "node_modules/@vitest/pretty-format": {
+      "version": "3.2.7",
+      "resolved": "https://registry.npmjs.org/@vitest/pretty-format/-/pretty-format-3.2.7.tgz",
+      "integrity": "sha512-KUHlwqVu0sRlhCdyPdQ/wBoTfRahjUky1MubOmYw9fWfIZy1gNoHpuaaQBPAaMaVYdQYHJLurzj8ECCj5OwTqA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "tinyrainbow": "^2.0.0"
+      },
+      "funding": {
+        "url": "https://opencollective.com/vitest"
+      }
+    },
+    "node_modules/@vitest/runner": {
+      "version": "3.2.7",
+      "resolved": "https://registry.npmjs.org/@vitest/runner/-/runner-3.2.7.tgz",
+      "integrity": "sha512-sB9y4ovltoQP+WaUPwmSxO9WIg9Ig694Di5PalVPsYHklAdE027mehpWF2SQSVq+k6sFgaivbTjTJwZLSHbedA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@vitest/utils": "3.2.7",
+        "pathe": "^2.0.3",
+        "strip-literal": "^3.0.0"
+      },
+      "funding": {
+        "url": "https://opencollective.com/vitest"
+      }
+    },
+    "node_modules/@vitest/snapshot": {
+      "version": "3.2.7",
+      "resolved": "https://registry.npmjs.org/@vitest/snapshot/-/snapshot-3.2.7.tgz",
+      "integrity": "sha512-7C+MwShwtBSI5Buwoyg3s/iY1eHL9PKAf+O1wVh/TdnjXUtkoL/9YQtre90i4MtNXM6edP1wJ2zOBpfCyhIS7g==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@vitest/pretty-format": "3.2.7",
+        "magic-string": "^0.30.17",
+        "pathe": "^2.0.3"
+      },
+      "funding": {
+        "url": "https://opencollective.com/vitest"
+      }
+    },
+    "node_modules/@vitest/spy": {
+      "version": "3.2.7",
+      "resolved": "https://registry.npmjs.org/@vitest/spy/-/spy-3.2.7.tgz",
+      "integrity": "sha512-Q2eQGI6d2L/hBtZ0qNuKcAGid68XK6cv1xsoaIma6PaJhHPoqcEJhYpXZ/5myCMqkNgtP6UKuBhbc0nHKnrkuQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "tinyspy": "^4.0.3"
+      },
+      "funding": {
+        "url": "https://opencollective.com/vitest"
+      }
+    },
+    "node_modules/@vitest/utils": {
+      "version": "3.2.7",
+      "resolved": "https://registry.npmjs.org/@vitest/utils/-/utils-3.2.7.tgz",
+      "integrity": "sha512-x6BDOd7dyo3PFLY3I9/HJ25X/6OurhGXk2/B9gOZNPF7XDVjeBK4k01lQE5uvDpbuheErh91qYuE1E2OEjK3Rw==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@vitest/pretty-format": "3.2.7",
+        "loupe": "^3.1.4",
+        "tinyrainbow": "^2.0.0"
+      },
+      "funding": {
+        "url": "https://opencollective.com/vitest"
+      }
+    },
+    "node_modules/agent-base": {
+      "version": "7.1.4",
+      "resolved": "https://registry.npmjs.org/agent-base/-/agent-base-7.1.4.tgz",
+      "integrity": "sha512-MnA+YT8fwfJPgBx3m60MNqakm30XOkyIoH1y6huTQvC0PwZG7ki8NacLBcrPbNoo8vEZy7Jpuk7+jMO+CUovTQ==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">= 14"
+      }
+    },
+    "node_modules/ansi-regex": {
+      "version": "5.0.1",
+      "resolved": "https://registry.npmjs.org/ansi-regex/-/ansi-regex-5.0.1.tgz",
+      "integrity": "sha512-quJQXlTSUGL2LH9SUXo8VwsY4soanhgo6LNSm84E1LBcE8s3O0wpdiRzyR9z/ZZJMlMWv37qOOb9pdJlMUEKFQ==",
+      "dev": true,
+      "license": "MIT",
+      "peer": true,
+      "engines": {
+        "node": ">=8"
+      }
+    },
+    "node_modules/ansi-styles": {
+      "version": "5.2.0",
+      "resolved": "https://registry.npmjs.org/ansi-styles/-/ansi-styles-5.2.0.tgz",
+      "integrity": "sha512-Cxwpt2SfTzTtXcfOlzGEee8O+c+MmUgGrNiBcXnuWxuFJHe6a5Hz7qwhwe5OgaSYI0IJvkLqWX1ASG+cJOkEiA==",
+      "dev": true,
+      "license": "MIT",
+      "peer": true,
+      "engines": {
+        "node": ">=10"
+      },
+      "funding": {
+        "url": "https://github.com/chalk/ansi-styles?sponsor=1"
+      }
+    },
+    "node_modules/aria-query": {
+      "version": "5.3.0",
+      "resolved": "https://registry.npmjs.org/aria-query/-/aria-query-5.3.0.tgz",
+      "integrity": "sha512-b0P0sZPKtyu8HkeRAfCq0IfURZK+SuwMjY1UXGBU27wpAiTwQAIlq56IbIO+ytk/JjS1fMR14ee5WBBfKi5J6A==",
+      "dev": true,
+      "license": "Apache-2.0",
+      "dependencies": {
+        "dequal": "^2.0.3"
+      }
+    },
+    "node_modules/assertion-error": {
+      "version": "2.0.1",
+      "resolved": "https://registry.npmjs.org/assertion-error/-/assertion-error-2.0.1.tgz",
+      "integrity": "sha512-Izi8RQcffqCeNVgFigKli1ssklIbpHnCYc6AknXGYoB6grJqyeby7jv12JUQgmTAnIDnbck1uxksT4dzN3PWBA==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=12"
+      }
+    },
+    "node_modules/baseline-browser-mapping": {
+      "version": "2.11.24",
+      "resolved": "https://registry.npmjs.org/baseline-browser-mapping/-/baseline-browser-mapping-2.11.24.tgz",
+      "integrity": "sha512-hYrgxie335U08WqICoGqKRzV1HFXv6zdxwJE4ekCb80CM9a0SVVsN4QPwT67RraRo+9h8IATk6uxHJw7QSkdOg==",
+      "dev": true,
+      "license": "Apache-2.0",
+      "bin": {
+        "baseline-browser-mapping": "dist/cli.cjs"
+      },
+      "engines": {
+        "node": ">=6.0.0"
+      }
+    },
+    "node_modules/bidi-js": {
+      "version": "1.1.0",
+      "resolved": "https://registry.npmjs.org/bidi-js/-/bidi-js-1.1.0.tgz",
+      "integrity": "sha512-fX1Onk0tdVPC7obPWB5EbJ1z7NVhLq4m2xZLq2YXBkxzMXIGRpNMU88n0EPgWseKl12J7zXs7qrDxPK4sRs2fg==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "require-from-string": "^2.0.2"
+      }
+    },
+    "node_modules/browserslist": {
+      "version": "4.29.0",
+      "resolved": "https://registry.npmjs.org/browserslist/-/browserslist-4.29.0.tgz",
+      "integrity": "sha512-3GSvyjvDI4Dur1Meg2BekJquu5uF+9R9a1+5M1Mde192eZoXbeXjzgOsgqPS2V8D5wrrip0gR5Hf/GhWQ9ZzaA==",
+      "dev": true,
+      "funding": [
+        {
+          "type": "opencollective",
+          "url": "https://opencollective.com/browserslist"
+        },
+        {
+          "type": "tidelift",
+          "url": "https://tidelift.com/funding/github/npm/browserslist"
+        },
+        {
+          "type": "github",
+          "url": "https://github.com/sponsors/ai"
+        }
+      ],
+      "license": "MIT",
+      "dependencies": {
+        "baseline-browser-mapping": "^2.11.23",
+        "caniuse-lite": "^1.0.30001810",
+        "electron-to-chromium": "^1.5.427",
+        "node-releases": "^2.0.55",
+        "update-browserslist-db": "^1.3.3"
+      },
+      "bin": {
+        "browserslist": "cli.js"
+      },
+      "engines": {
+        "node": "^6 || ^7 || ^8 || ^9 || ^10 || ^11 || ^12 || >=13.7"
+      }
+    },
+    "node_modules/cac": {
+      "version": "6.7.14",
+      "resolved": "https://registry.npmjs.org/cac/-/cac-6.7.14.tgz",
+      "integrity": "sha512-b6Ilus+c3RrdDk+JhLKUAQfzzgLEPy6wcXqS7f/xe1EETvsDP6GORG7SFuOs6cID5YkqchW/LXZbX5bc8j7ZcQ==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=8"
+      }
+    },
+    "node_modules/caniuse-lite": {
+      "version": "1.0.30001810",
+      "resolved": "https://registry.npmjs.org/caniuse-lite/-/caniuse-lite-1.0.30001810.tgz",
+      "integrity": "sha512-TITQPUkaz+aVk5GL6NhOdwk1aEaNTSDPsGFWrTuhKGtjTF70jL/Oht2W4c6rXUe5fu7Ie19VIahAXHIIiWWNeg==",
+      "dev": true,
+      "funding": [
+        {
+          "type": "opencollective",
+          "url": "https://opencollective.com/browserslist"
+        },
+        {
+          "type": "tidelift",
+          "url": "https://tidelift.com/funding/github/npm/caniuse-lite"
+        },
+        {
+          "type": "github",
+          "url": "https://github.com/sponsors/ai"
+        }
+      ],
+      "license": "CC-BY-4.0"
+    },
+    "node_modules/chai": {
+      "version": "5.3.3",
+      "resolved": "https://registry.npmjs.org/chai/-/chai-5.3.3.tgz",
+      "integrity": "sha512-4zNhdJD/iOjSH0A05ea+Ke6MU5mmpQcbQsSOkgdaUMJ9zTlDTD/GYlwohmIE2u0gaxHYiVHEn1Fw9mZ/ktJWgw==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "assertion-error": "^2.0.1",
+        "check-error": "^2.1.1",
+        "deep-eql": "^5.0.1",
+        "loupe": "^3.1.0",
+        "pathval": "^2.0.0"
+      },
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/check-error": {
+      "version": "2.1.3",
+      "resolved": "https://registry.npmjs.org/check-error/-/check-error-2.1.3.tgz",
+      "integrity": "sha512-PAJdDJusoxnwm1VwW07VWwUN1sl7smmC3OKggvndJFadxxDRyFJBX/ggnu/KE4kQAB7a3Dp8f/YXC1FlUprWmA==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">= 16"
+      }
+    },
+    "node_modules/convert-source-map": {
+      "version": "2.0.0",
+      "resolved": "https://registry.npmjs.org/convert-source-map/-/convert-source-map-2.0.0.tgz",
+      "integrity": "sha512-Kvp459HrV2FEJ1CAsi1Ku+MY3kasH19TFykTz2xWmMeq6bk2NU3XXvfJ+Q61m0xktWwt+1HSYf3JZsTms3aRJg==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/cookie": {
+      "version": "1.1.1",
+      "resolved": "https://registry.npmjs.org/cookie/-/cookie-1.1.1.tgz",
+      "integrity": "sha512-ei8Aos7ja0weRpFzJnEA9UHJ/7XQmqglbRwnf2ATjcB9Wq874VKH9kfjjirM6UhU2/E5fFYadylyhFldcqSidQ==",
+      "license": "MIT",
+      "engines": {
+        "node": ">=18"
+      },
+      "funding": {
+        "type": "opencollective",
+        "url": "https://opencollective.com/express"
+      }
+    },
+    "node_modules/css-tree": {
+      "version": "3.2.1",
+      "resolved": "https://registry.npmjs.org/css-tree/-/css-tree-3.2.1.tgz",
+      "integrity": "sha512-X7sjQzceUhu1u7Y/ylrRZFU2FS6LRiFVp6rKLPg23y3x3c3DOKAwuXGDp+PAGjh6CSnCjYeAul8pcT8bAl+lSA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "mdn-data": "2.27.1",
+        "source-map-js": "^1.2.1"
+      },
+      "engines": {
+        "node": "^10 || ^12.20.0 || ^14.13.0 || >=15.0.0"
+      }
+    },
+    "node_modules/css.escape": {
+      "version": "1.5.1",
+      "resolved": "https://registry.npmjs.org/css.escape/-/css.escape-1.5.1.tgz",
+      "integrity": "sha512-YUifsXXuknHlUsmlgyY0PKzgPOr7/FjCePfHNt0jxm83wHZi44VDMQ7/fGNkjY3/jV1MC+1CmZbaHzugyeRtpg==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/cssstyle": {
+      "version": "5.3.7",
+      "resolved": "https://registry.npmjs.org/cssstyle/-/cssstyle-5.3.7.tgz",
+      "integrity": "sha512-7D2EPVltRrsTkhpQmksIu+LxeWAIEk6wRDMJ1qljlv+CKHJM+cJLlfhWIzNA44eAsHXSNe3+vO6DW1yCYx8SuQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@asamuzakjp/css-color": "^4.1.1",
+        "@csstools/css-syntax-patches-for-csstree": "^1.0.21",
+        "css-tree": "^3.1.0",
+        "lru-cache": "^11.2.4"
+      },
+      "engines": {
+        "node": ">=20"
+      }
+    },
+    "node_modules/cssstyle/node_modules/lru-cache": {
+      "version": "11.5.2",
+      "resolved": "https://registry.npmjs.org/lru-cache/-/lru-cache-11.5.2.tgz",
+      "integrity": "sha512-4pfM1Ff0x50o0tQwb5ucw/RzNyD0/YJME6IVcStalZuMWxdt3sR3huStTtxz4PUmvZfRguvDejasvQ2kifR11g==",
+      "dev": true,
+      "license": "BlueOak-1.0.0",
+      "engines": {
+        "node": "20 || >=22"
+      }
+    },
+    "node_modules/csstype": {
+      "version": "3.2.3",
+      "resolved": "https://registry.npmjs.org/csstype/-/csstype-3.2.3.tgz",
+      "integrity": "sha512-z1HGKcYy2xA8AGQfwrn0PAy+PB7X/GSj3UVJW9qKyn43xWa+gl5nXmU4qqLMRzWVLFC8KusUX8T/0kCiOYpAIQ==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/data-urls": {
+      "version": "6.0.1",
+      "resolved": "https://registry.npmjs.org/data-urls/-/data-urls-6.0.1.tgz",
+      "integrity": "sha512-euIQENZg6x8mj3fO6o9+fOW8MimUI4PpD/fZBhJfeioZVy9TUpM4UY7KjQNVZFlqwJ0UdzRDzkycB997HEq1BQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "whatwg-mimetype": "^5.0.0",
+        "whatwg-url": "^15.1.0"
+      },
+      "engines": {
+        "node": ">=20"
+      }
+    },
+    "node_modules/data-urls/node_modules/whatwg-mimetype": {
+      "version": "5.0.0",
+      "resolved": "https://registry.npmjs.org/whatwg-mimetype/-/whatwg-mimetype-5.0.0.tgz",
+      "integrity": "sha512-sXcNcHOC51uPGF0P/D4NVtrkjSU2fNsm9iog4ZvZJsL3rjoDAzXZhkm2MWt1y+PUdggKAYVoMAIYcs78wJ51Cw==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=20"
+      }
+    },
+    "node_modules/debug": {
+      "version": "4.4.3",
+      "resolved": "https://registry.npmjs.org/debug/-/debug-4.4.3.tgz",
+      "integrity": "sha512-RGwwWnwQvkVfavKVt22FGLw+xYSdzARwm0ru6DhTVA3umU5hZc28V3kO4stgYryrTlLpuvgI9GiijltAjNbcqA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "ms": "^2.1.3"
+      },
+      "engines": {
+        "node": ">=6.0"
+      },
+      "peerDependenciesMeta": {
+        "supports-color": {
+          "optional": true
+        }
+      }
+    },
+    "node_modules/decimal.js": {
+      "version": "10.6.0",
+      "resolved": "https://registry.npmjs.org/decimal.js/-/decimal.js-10.6.0.tgz",
+      "integrity": "sha512-YpgQiITW3JXGntzdUmyUR1V812Hn8T1YVXhCu+wO3OpS4eU9l4YdD3qjyiKdV6mvV29zapkMeD390UVEf2lkUg==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/deep-eql": {
+      "version": "5.0.2",
+      "resolved": "https://registry.npmjs.org/deep-eql/-/deep-eql-5.0.2.tgz",
+      "integrity": "sha512-h5k/5U50IJJFpzfL6nO9jaaumfjO/f2NjK/oYB2Djzm4p9L+3T9qWpZqZ2hAbLPuuYq9wrU08WQyBTL5GbPk5Q==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=6"
+      }
+    },
+    "node_modules/dequal": {
+      "version": "2.0.3",
+      "resolved": "https://registry.npmjs.org/dequal/-/dequal-2.0.3.tgz",
+      "integrity": "sha512-0je+qPKHEMohvfRTCEo3CrPG6cAzAYgmzKyxRiYSSDkS6eGJdyVJm7WaYA5ECaAD9wLB2T4EEeymA5aFVcYXCA==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=6"
+      }
+    },
+    "node_modules/dom-accessibility-api": {
+      "version": "0.5.16",
+      "resolved": "https://registry.npmjs.org/dom-accessibility-api/-/dom-accessibility-api-0.5.16.tgz",
+      "integrity": "sha512-X7BJ2yElsnOJ30pZF4uIIDfBEVgF4XEBxL9Bxhy6dnrm5hkzqmsWHGTiHqRiITNhMyFLyAiWndIJP7Z1NTteDg==",
+      "dev": true,
+      "license": "MIT",
+      "peer": true
+    },
+    "node_modules/electron-to-chromium": {
+      "version": "1.5.430",
+      "resolved": "https://registry.npmjs.org/electron-to-chromium/-/electron-to-chromium-1.5.430.tgz",
+      "integrity": "sha512-e1QEj72Y4zd8RlNZVmoTg+iCOSVwpk05IOiiQwdrkwCSVlZfPthevErhE+nckGd2YbsXfp1SkisznhGVIXP2NQ==",
+      "dev": true,
+      "license": "ISC"
+    },
+    "node_modules/entities": {
+      "version": "8.1.0",
+      "resolved": "https://registry.npmjs.org/entities/-/entities-8.1.0.tgz",
+      "integrity": "sha512-kxL7msIffSuh9aaFAMD7rxAIuTRMAHMeBtgHW2yUdWw732ZNh4MehkF2gdjvtdmikkaIP9bFDDJOPlsvm7avrA==",
+      "dev": true,
+      "license": "BSD-2-Clause",
+      "engines": {
+        "node": ">=20.19.0"
+      },
+      "funding": {
+        "url": "https://github.com/fb55/entities?sponsor=1"
+      }
+    },
+    "node_modules/es-module-lexer": {
+      "version": "1.7.0",
+      "resolved": "https://registry.npmjs.org/es-module-lexer/-/es-module-lexer-1.7.0.tgz",
+      "integrity": "sha512-jEQoCwk8hyb2AZziIOLhDqpm5+2ww5uIE6lkO/6jcOCusfk6LhMHpXXfBLXTZ7Ydyt0j4VoUQv6uGNYbdW+kBA==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/esbuild": {
+      "version": "0.28.2",
+      "resolved": "https://registry.npmjs.org/esbuild/-/esbuild-0.28.2.tgz",
+      "integrity": "sha512-HKVLS8dvII+xoKW9kmqxbRKrnWEXfJJr/FZhhJmiqIB0e053QNYFqOBouTMO/k5sID4MvCiUCvv8b9M4h32wIA==",
+      "dev": true,
+      "hasInstallScript": true,
+      "license": "MIT",
+      "bin": {
+        "esbuild": "bin/esbuild"
+      },
+      "engines": {
+        "node": ">=18"
+      },
+      "optionalDependencies": {
+        "@esbuild/aix-ppc64": "0.28.2",
+        "@esbuild/android-arm": "0.28.2",
+        "@esbuild/android-arm64": "0.28.2",
+        "@esbuild/android-x64": "0.28.2",
+        "@esbuild/darwin-arm64": "0.28.2",
+        "@esbuild/darwin-x64": "0.28.2",
+        "@esbuild/freebsd-arm64": "0.28.2",
+        "@esbuild/freebsd-x64": "0.28.2",
+        "@esbuild/linux-arm": "0.28.2",
+        "@esbuild/linux-arm64": "0.28.2",
+        "@esbuild/linux-ia32": "0.28.2",
+        "@esbuild/linux-loong64": "0.28.2",
+        "@esbuild/linux-mips64el": "0.28.2",
+        "@esbuild/linux-ppc64": "0.28.2",
+        "@esbuild/linux-riscv64": "0.28.2",
+        "@esbuild/linux-s390x": "0.28.2",
+        "@esbuild/linux-x64": "0.28.2",
+        "@esbuild/netbsd-arm64": "0.28.2",
+        "@esbuild/netbsd-x64": "0.28.2",
+        "@esbuild/openbsd-arm64": "0.28.2",
+        "@esbuild/openbsd-x64": "0.28.2",
+        "@esbuild/openharmony-arm64": "0.28.2",
+        "@esbuild/sunos-x64": "0.28.2",
+        "@esbuild/win32-arm64": "0.28.2",
+        "@esbuild/win32-ia32": "0.28.2",
+        "@esbuild/win32-x64": "0.28.2"
+      }
+    },
+    "node_modules/escalade": {
+      "version": "3.2.0",
+      "resolved": "https://registry.npmjs.org/escalade/-/escalade-3.2.0.tgz",
+      "integrity": "sha512-WUj2qlxaQtO4g6Pq5c29GTcWGDyd8itL8zTlipgECz3JesAiiOKotd8JU6otB3PACgG6xkJUyVhboMS+bje/jA==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=6"
+      }
+    },
+    "node_modules/estree-walker": {
+      "version": "3.0.3",
+      "resolved": "https://registry.npmjs.org/estree-walker/-/estree-walker-3.0.3.tgz",
+      "integrity": "sha512-7RUKfXgSMMkzt6ZuXmqapOurLGPPfgj6l9uRZ7lRGolvk0y2yocc35LdcxKC5PQZdn2DMqioAQ2NoWcrTKmm6g==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@types/estree": "^1.0.0"
+      }
+    },
+    "node_modules/expect-type": {
+      "version": "1.4.0",
+      "resolved": "https://registry.npmjs.org/expect-type/-/expect-type-1.4.0.tgz",
+      "integrity": "sha512-KfYbmpRm0VbLjEvVa9yGwCi9GI34xvi7A/HXYWQO65CSD2u3MczUJSuwXKFIxlGsgBQizV9q5J9NHj4VG0n+pA==",
+      "dev": true,
+      "license": "Apache-2.0",
+      "engines": {
+        "node": ">=12.0.0"
+      }
+    },
+    "node_modules/fdir": {
+      "version": "6.5.0",
+      "resolved": "https://registry.npmjs.org/fdir/-/fdir-6.5.0.tgz",
+      "integrity": "sha512-tIbYtZbucOs0BRGqPJkshJUYdL+SDH7dVM8gjy+ERp3WAUjLEFJE+02kanyHtwjWOnwrKYBiwAmM0p4kLJAnXg==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=12.0.0"
+      },
+      "peerDependencies": {
+        "picomatch": "^3 || ^4"
+      },
+      "peerDependenciesMeta": {
+        "picomatch": {
+          "optional": true
+        }
+      }
+    },
+    "node_modules/fsevents": {
+      "version": "2.3.3",
+      "resolved": "https://registry.npmjs.org/fsevents/-/fsevents-2.3.3.tgz",
+      "integrity": "sha512-5xoDfX+fL7faATnagmWPpbFtwh/R77WmMMqqHGS65C3vvB0YHrgF+B1YmZ3441tMj5n63k0212XNoJwzlhffQw==",
+      "dev": true,
+      "hasInstallScript": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "darwin"
+      ],
+      "engines": {
+        "node": "^8.16.0 || ^10.6.0 || >=11.0.0"
+      }
+    },
+    "node_modules/gensync": {
+      "version": "1.0.0-beta.2",
+      "resolved": "https://registry.npmjs.org/gensync/-/gensync-1.0.0-beta.2.tgz",
+      "integrity": "sha512-3hN7NaskYvMDLQY55gnW3NQ+mesEAepTqlg+VEbj7zzqEMBVNhzcGYYeqFo/TlYz6eQiFcp1HcsCZO+nGgS8zg==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=6.9.0"
+      }
+    },
+    "node_modules/html-encoding-sniffer": {
+      "version": "6.0.0",
+      "resolved": "https://registry.npmjs.org/html-encoding-sniffer/-/html-encoding-sniffer-6.0.0.tgz",
+      "integrity": "sha512-CV9TW3Y3f8/wT0BRFc1/KAVQ3TUHiXmaAb6VW9vtiMFf7SLoMd1PdAc4W3KFOFETBJUb90KatHqlsZMWV+R9Gg==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@exodus/bytes": "^1.6.0"
+      },
+      "engines": {
+        "node": "^20.19.0 || ^22.12.0 || >=24.0.0"
+      }
+    },
+    "node_modules/http-proxy-agent": {
+      "version": "7.0.2",
+      "resolved": "https://registry.npmjs.org/http-proxy-agent/-/http-proxy-agent-7.0.2.tgz",
+      "integrity": "sha512-T1gkAiYYDWYx3V5Bmyu7HcfcvL7mUrTWiM6yOfa3PIphViJ/gFPbvidQ+veqSOHci/PxBcDabeUNCzpOODJZig==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "agent-base": "^7.1.0",
+        "debug": "^4.3.4"
+      },
+      "engines": {
+        "node": ">= 14"
+      }
+    },
+    "node_modules/https-proxy-agent": {
+      "version": "7.0.6",
+      "resolved": "https://registry.npmjs.org/https-proxy-agent/-/https-proxy-agent-7.0.6.tgz",
+      "integrity": "sha512-vK9P5/iUfdl95AI+JVyUuIcVtd4ofvtrOr3HNtM2yxC9bnMbEdp3x01OhQNnjb8IJYi38VlTE3mBXwcfvywuSw==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "agent-base": "^7.1.2",
+        "debug": "4"
+      },
+      "engines": {
+        "node": ">= 14"
+      }
+    },
+    "node_modules/indent-string": {
+      "version": "4.0.0",
+      "resolved": "https://registry.npmjs.org/indent-string/-/indent-string-4.0.0.tgz",
+      "integrity": "sha512-EdDDZu4A2OyIK7Lr/2zG+w5jmbuk1DVBnEwREQvBzspBJkCEbRa8GxU1lghYcaGJCnRWibjDXlq779X1/y5xwg==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=8"
+      }
+    },
+    "node_modules/is-potential-custom-element-name": {
+      "version": "1.0.1",
+      "resolved": "https://registry.npmjs.org/is-potential-custom-element-name/-/is-potential-custom-element-name-1.0.1.tgz",
+      "integrity": "sha512-bCYeRA2rVibKZd+s2625gGnGF/t7DSqDs4dP7CrLA1m7jKWz6pps0LpYLJN8Q64HtmPKJ1hrN3nzPNKFEKOUiQ==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/js-tokens": {
+      "version": "4.0.0",
+      "resolved": "https://registry.npmjs.org/js-tokens/-/js-tokens-4.0.0.tgz",
+      "integrity": "sha512-RdJUflcE3cUzKiMqQgsCu06FPu9UdIJO0beYbPhHN4k6apgJtifcoCtT9bcxOpYBtpD2kCM6Sbzg4CausW/PKQ==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/jsdom": {
+      "version": "27.4.0",
+      "resolved": "https://registry.npmjs.org/jsdom/-/jsdom-27.4.0.tgz",
+      "integrity": "sha512-mjzqwWRD9Y1J1KUi7W97Gja1bwOOM5Ug0EZ6UDK3xS7j7mndrkwozHtSblfomlzyB4NepioNt+B2sOSzczVgtQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@acemir/cssom": "^0.9.28",
+        "@asamuzakjp/dom-selector": "^6.7.6",
+        "@exodus/bytes": "^1.6.0",
+        "cssstyle": "^5.3.4",
+        "data-urls": "^6.0.0",
+        "decimal.js": "^10.6.0",
+        "html-encoding-sniffer": "^6.0.0",
+        "http-proxy-agent": "^7.0.2",
+        "https-proxy-agent": "^7.0.6",
+        "is-potential-custom-element-name": "^1.0.1",
+        "parse5": "^8.0.0",
+        "saxes": "^6.0.0",
+        "symbol-tree": "^3.2.4",
+        "tough-cookie": "^6.0.0",
+        "w3c-xmlserializer": "^5.0.0",
+        "webidl-conversions": "^8.0.0",
+        "whatwg-mimetype": "^4.0.0",
+        "whatwg-url": "^15.1.0",
+        "ws": "^8.18.3",
+        "xml-name-validator": "^5.0.0"
+      },
+      "engines": {
+        "node": "^20.19.0 || ^22.12.0 || >=24.0.0"
+      },
+      "peerDependencies": {
+        "canvas": "^3.0.0"
+      },
+      "peerDependenciesMeta": {
+        "canvas": {
+          "optional": true
+        }
+      }
+    },
+    "node_modules/jsesc": {
+      "version": "3.1.0",
+      "resolved": "https://registry.npmjs.org/jsesc/-/jsesc-3.1.0.tgz",
+      "integrity": "sha512-/sM3dO2FOzXjKQhJuo0Q173wf2KOo8t4I8vHy6lF9poUp7bKT0/NHE8fPX23PwfhnykfqnC2xRxOnVw5XuGIaA==",
+      "dev": true,
+      "license": "MIT",
+      "bin": {
+        "jsesc": "bin/jsesc"
+      },
+      "engines": {
+        "node": ">=6"
+      }
+    },
+    "node_modules/json5": {
+      "version": "2.2.3",
+      "resolved": "https://registry.npmjs.org/json5/-/json5-2.2.3.tgz",
+      "integrity": "sha512-XmOWe7eyHYH14cLdVPoyg+GOH3rYX++KpzrylJwSW98t3Nk+U8XOl8FWKOgwtzdb8lXGf6zYwDUzeHMWfxasyg==",
+      "dev": true,
+      "license": "MIT",
+      "bin": {
+        "json5": "lib/cli.js"
+      },
+      "engines": {
+        "node": ">=6"
+      }
+    },
+    "node_modules/loupe": {
+      "version": "3.2.1",
+      "resolved": "https://registry.npmjs.org/loupe/-/loupe-3.2.1.tgz",
+      "integrity": "sha512-CdzqowRJCeLU72bHvWqwRBBlLcMEtIvGrlvef74kMnV2AolS9Y8xUv1I0U/MNAWMhBlKIoyuEgoJ0t/bbwHbLQ==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/lru-cache": {
+      "version": "5.1.1",
+      "resolved": "https://registry.npmjs.org/lru-cache/-/lru-cache-5.1.1.tgz",
+      "integrity": "sha512-KpNARQA3Iwv+jTA0utUVVbrh+Jlrr1Fv0e56GGzAFOXN7dk/FviaDW8LHmK52DlcH4WP2n6gI8vN1aesBFgo9w==",
+      "dev": true,
+      "license": "ISC",
+      "dependencies": {
+        "yallist": "^3.0.2"
+      }
+    },
+    "node_modules/lucide-react": {
+      "version": "0.552.0",
+      "resolved": "https://registry.npmjs.org/lucide-react/-/lucide-react-0.552.0.tgz",
+      "integrity": "sha512-g9WCjmfwqbexSnZE+2cl21PCfXOcqnGeWeMTNAOGEfpPbm/ZF4YIq77Z8qWrxbu660EKuLB4nSLggoKnCb+isw==",
+      "license": "ISC",
+      "peerDependencies": {
+        "react": "^16.5.1 || ^17.0.0 || ^18.0.0 || ^19.0.0"
+      }
+    },
+    "node_modules/lz-string": {
+      "version": "1.5.0",
+      "resolved": "https://registry.npmjs.org/lz-string/-/lz-string-1.5.0.tgz",
+      "integrity": "sha512-h5bgJWpxJNswbU7qCrV0tIKQCaS3blPDrqKWx+QxzuzL1zGUzij9XCWLrSLsJPu5t+eWA/ycetzYAO5IOMcWAQ==",
+      "dev": true,
+      "license": "MIT",
+      "peer": true,
+      "bin": {
+        "lz-string": "bin/bin.js"
+      }
+    },
+    "node_modules/magic-string": {
+      "version": "0.30.21",
+      "resolved": "https://registry.npmjs.org/magic-string/-/magic-string-0.30.21.tgz",
+      "integrity": "sha512-vd2F4YUyEXKGcLHoq+TEyCjxueSeHnFxyyjNp80yg0XV4vUhnDer/lvvlqM/arB5bXQN5K2/3oinyCRyx8T2CQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@jridgewell/sourcemap-codec": "^1.5.5"
+      }
+    },
+    "node_modules/mdn-data": {
+      "version": "2.27.1",
+      "resolved": "https://registry.npmjs.org/mdn-data/-/mdn-data-2.27.1.tgz",
+      "integrity": "sha512-9Yubnt3e8A0OKwxYSXyhLymGW4sCufcLG6VdiDdUGVkPhpqLxlvP5vl1983gQjJl3tqbrM731mjaZaP68AgosQ==",
+      "dev": true,
+      "license": "CC0-1.0"
+    },
+    "node_modules/min-indent": {
+      "version": "1.0.1",
+      "resolved": "https://registry.npmjs.org/min-indent/-/min-indent-1.0.1.tgz",
+      "integrity": "sha512-I9jwMn07Sy/IwOj3zVkVik2JTvgpaykDZEigL6Rx6N9LbMywwUSMtxET+7lVoDLLd3O3IXwJwvuuns8UB/HeAg==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=4"
+      }
+    },
+    "node_modules/ms": {
+      "version": "2.1.3",
+      "resolved": "https://registry.npmjs.org/ms/-/ms-2.1.3.tgz",
+      "integrity": "sha512-6FlzubTLZG3J2a/NVCAleEhjzq5oxgHyaCU9yYXvcLsvoVaHJq/s5xXI6/XXP6tz7R9xAOtHnSO/tXtF3WRTlA==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/nanoid": {
+      "version": "3.3.19",
+      "resolved": "https://registry.npmjs.org/nanoid/-/nanoid-3.3.19.tgz",
+      "integrity": "sha512-Y2tUNy4ouw6tq5oDSKeQYGOyhkUBhNOcGV/02KC+6kd9eDGqdZd++mjMiIDilrBYvjEnCYvVtsuHCuP+okSfug==",
+      "dev": true,
+      "funding": [
+        {
+          "type": "github",
+          "url": "https://github.com/sponsors/ai"
+        }
+      ],
+      "license": "MIT",
+      "bin": {
+        "nanoid": "bin/nanoid.cjs"
+      },
+      "engines": {
+        "node": "^10 || ^12 || ^13.7 || ^14 || >=15.0.1"
+      }
+    },
+    "node_modules/node-releases": {
+      "version": "2.0.55",
+      "resolved": "https://registry.npmjs.org/node-releases/-/node-releases-2.0.55.tgz",
+      "integrity": "sha512-mIrE/Cw9y+9Au6dS5vDKDhQza9YvG6w+ZrS6X+ZzA7yFW/soAeaups4Qzn1bL6g5FVy8WtP79+0j82oPIbqRjQ==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/parse5": {
+      "version": "8.0.1",
+      "resolved": "https://registry.npmjs.org/parse5/-/parse5-8.0.1.tgz",
+      "integrity": "sha512-z1e/HMG90obSGeidlli3hj7cbocou0/wa5HacvI3ASx34PecNjNQeaHNo5WIZpWofN9kgkqV1q5YvXe3F0FoPw==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "entities": "^8.0.0"
+      },
+      "funding": {
+        "url": "https://github.com/inikulin/parse5?sponsor=1"
+      }
+    },
+    "node_modules/pathe": {
+      "version": "2.0.3",
+      "resolved": "https://registry.npmjs.org/pathe/-/pathe-2.0.3.tgz",
+      "integrity": "sha512-WUjGcAqP1gQacoQe+OBJsFA7Ld4DyXuUIjZ5cc75cLHvJ7dtNsTugphxIADwspS+AraAUePCKrSVtPLFj/F88w==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/pathval": {
+      "version": "2.0.1",
+      "resolved": "https://registry.npmjs.org/pathval/-/pathval-2.0.1.tgz",
+      "integrity": "sha512-//nshmD55c46FuFw26xV/xFAaB5HF9Xdap7HJBBnrKdAd6/GxDBaNA1870O79+9ueg61cZLSVc+OaFlfmObYVQ==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">= 14.16"
+      }
+    },
+    "node_modules/picocolors": {
+      "version": "1.1.1",
+      "resolved": "https://registry.npmjs.org/picocolors/-/picocolors-1.1.1.tgz",
+      "integrity": "sha512-xceH2snhtb5M9liqDsmEw56le376mTZkEX/jEb/RxNFyegNul7eNslCXP9FDj/Lcu0X8KEyMceP2ntpaHrDEVA==",
+      "dev": true,
+      "license": "ISC"
+    },
+    "node_modules/picomatch": {
+      "version": "4.0.7",
+      "resolved": "https://registry.npmjs.org/picomatch/-/picomatch-4.0.7.tgz",
+      "integrity": "sha512-qcJu88Q2IWqJsDD529JKMdwGm/dvInW4HvQnRwiH9JtihJvzGOscDtHE3x1pBKeUOTysQ8kVmLnJ2kJu7yhcGA==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=12"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/jonschlinkert"
+      }
+    },
+    "node_modules/postcss": {
+      "version": "8.5.28",
+      "resolved": "https://registry.npmjs.org/postcss/-/postcss-8.5.28.tgz",
+      "integrity": "sha512-RRuzqDtt5Y9h3quz5hWhK+TPnsmVs6WwSU6LkJMeY4HstUEDuYTG8UJSdawMRzmzAtV+KEoG8N3Qg2qLy5vM/A==",
+      "dev": true,
+      "funding": [
+        {
+          "type": "opencollective",
+          "url": "https://opencollective.com/postcss/"
+        },
+        {
+          "type": "tidelift",
+          "url": "https://tidelift.com/funding/github/npm/postcss"
+        },
+        {
+          "type": "github",
+          "url": "https://github.com/sponsors/ai"
+        }
+      ],
+      "license": "MIT",
+      "dependencies": {
+        "nanoid": "^3.3.18",
+        "picocolors": "^1.1.1",
+        "source-map-js": "^1.2.1"
+      },
+      "engines": {
+        "node": "^10 || ^12 || >=14"
+      }
+    },
+    "node_modules/pretty-format": {
+      "version": "27.5.1",
+      "resolved": "https://registry.npmjs.org/pretty-format/-/pretty-format-27.5.1.tgz",
+      "integrity": "sha512-Qb1gy5OrP5+zDf2Bvnzdl3jsTf1qXVMazbvCoKhtKqVs4/YK4ozX4gKQJJVyNe+cajNPn0KoC0MC3FUmaHWEmQ==",
+      "dev": true,
+      "license": "MIT",
+      "peer": true,
+      "dependencies": {
+        "ansi-regex": "^5.0.1",
+        "ansi-styles": "^5.0.0",
+        "react-is": "^17.0.1"
+      },
+      "engines": {
+        "node": "^10.13.0 || ^12.13.0 || ^14.15.0 || >=15.0.0"
+      }
+    },
+    "node_modules/punycode": {
+      "version": "2.3.1",
+      "resolved": "https://registry.npmjs.org/punycode/-/punycode-2.3.1.tgz",
+      "integrity": "sha512-vYt7UD1U9Wg6138shLtLOvdAu+8DsC/ilFtEVHcH+wydcSpNE20AfSOduf6MkRFahL5FY7X1oU7nKVZFtfq8Fg==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=6"
+      }
+    },
+    "node_modules/react": {
+      "version": "19.3.0",
+      "resolved": "https://registry.npmjs.org/react/-/react-19.3.0.tgz",
+      "integrity": "sha512-E8LUcbtBWt20bbl2YoHfx4ZDBdxVTfOKtCZn9cDSJ4l6/nuoApcpIBcj47t2wZoVX8g2ZHuMHbiShgCR1T5Sog==",
+      "license": "MIT",
+      "engines": {
+        "node": ">=0.10.0"
+      }
+    },
+    "node_modules/react-dom": {
+      "version": "19.3.0",
+      "resolved": "https://registry.npmjs.org/react-dom/-/react-dom-19.3.0.tgz",
+      "integrity": "sha512-JDk8dgif51OjFoDE70+OT9ICyYr+69HlmihNwp1+Nsfbna3t5sIiCa9ZJktDmQ4/1b/rn26hIAR2uYXDMr5r0Q==",
+      "license": "MIT",
+      "dependencies": {
+        "scheduler": "^0.28.0"
+      },
+      "peerDependencies": {
+        "react": "^19.3.0"
+      }
+    },
+    "node_modules/react-is": {
+      "version": "17.0.2",
+      "resolved": "https://registry.npmjs.org/react-is/-/react-is-17.0.2.tgz",
+      "integrity": "sha512-w2GsyukL62IJnlaff/nRegPQR94C/XXamvMWmSHRJ4y7Ts/4ocGRmTHvOs8PSE6pB3dWOrD/nueuU5sduBsQ4w==",
+      "dev": true,
+      "license": "MIT",
+      "peer": true
+    },
+    "node_modules/react-refresh": {
+      "version": "0.18.0",
+      "resolved": "https://registry.npmjs.org/react-refresh/-/react-refresh-0.18.0.tgz",
+      "integrity": "sha512-QgT5//D3jfjJb6Gsjxv0Slpj23ip+HtOpnNgnb2S5zU3CB26G/IDPGoy4RJB42wzFE46DRsstbW6tKHoKbhAxw==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=0.10.0"
+      }
+    },
+    "node_modules/react-router": {
+      "version": "7.18.4",
+      "resolved": "https://registry.npmjs.org/react-router/-/react-router-7.18.4.tgz",
+      "integrity": "sha512-PUPQcMhMGRAslLcvtlPz/kmzBEWPhLdgLFrL7pLNepBL6dX0lWj4WD2cUYVgYCuT3jxvghYFg81cDTj44DhetQ==",
+      "license": "MIT",
+      "dependencies": {
+        "cookie": "^1.0.1",
+        "set-cookie-parser": "^2.6.0"
+      },
+      "engines": {
+        "node": ">=20.0.0"
+      },
+      "peerDependencies": {
+        "react": ">=18",
+        "react-dom": ">=18"
+      },
+      "peerDependenciesMeta": {
+        "react-dom": {
+          "optional": true
+        }
+      }
+    },
+    "node_modules/react-router-dom": {
+      "version": "7.18.4",
+      "resolved": "https://registry.npmjs.org/react-router-dom/-/react-router-dom-7.18.4.tgz",
+      "integrity": "sha512-yrfmJHIpDG7taCpqKjT1G5B6q3O2K+RN8/fgNf0lTjCwiPbQ0ei6vXX9ZjQR+7ld8Tr7Z5xmyMnZ8YJrphWQUw==",
+      "license": "MIT",
+      "dependencies": {
+        "react-router": "7.18.4"
+      },
+      "engines": {
+        "node": ">=20.0.0"
+      },
+      "peerDependencies": {
+        "react": ">=18",
+        "react-dom": ">=18"
+      }
+    },
+    "node_modules/redent": {
+      "version": "3.0.0",
+      "resolved": "https://registry.npmjs.org/redent/-/redent-3.0.0.tgz",
+      "integrity": "sha512-6tDA8g98We0zd0GvVeMT9arEOnTw9qM03L9cJXaCjrip1OO764RDBLBfrB4cwzNGDj5OA5ioymC9GkizgWJDUg==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "indent-string": "^4.0.0",
+        "strip-indent": "^3.0.0"
+      },
+      "engines": {
+        "node": ">=8"
+      }
+    },
+    "node_modules/require-from-string": {
+      "version": "2.0.2",
+      "resolved": "https://registry.npmjs.org/require-from-string/-/require-from-string-2.0.2.tgz",
+      "integrity": "sha512-Xf0nWe6RseziFMu+Ap9biiUbmplq6S9/p+7w7YXP/JBHhrUDDUhwa+vANyubuqfZWTveU//DYVGsDG7RKL/vEw==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=0.10.0"
+      }
+    },
+    "node_modules/rollup": {
+      "version": "4.63.3",
+      "resolved": "https://registry.npmjs.org/rollup/-/rollup-4.63.3.tgz",
+      "integrity": "sha512-1i2XreiAoMMXuPGD6Msj2xWrMMkHojNRKivInxGQcg7/1KuPuYlfUutLyh4drnOxUTHX9cHI4wFoat8D/NKaBw==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@types/estree": "1.0.9"
+      },
+      "bin": {
+        "rollup": "dist/bin/rollup"
+      },
+      "engines": {
+        "node": ">=18.0.0",
+        "npm": ">=8.0.0"
+      },
+      "optionalDependencies": {
+        "@napi-rs/lzma-linux-x64-gnu": "1.5.1",
+        "@rollup/rollup-android-arm-eabi": "4.63.3",
+        "@rollup/rollup-android-arm64": "4.63.3",
+        "@rollup/rollup-darwin-arm64": "4.63.3",
+        "@rollup/rollup-darwin-x64": "4.63.3",
+        "@rollup/rollup-freebsd-arm64": "4.63.3",
+        "@rollup/rollup-freebsd-x64": "4.63.3",
+        "@rollup/rollup-linux-arm-gnueabihf": "4.63.3",
+        "@rollup/rollup-linux-arm-musleabihf": "4.63.3",
+        "@rollup/rollup-linux-arm64-gnu": "4.63.3",
+        "@rollup/rollup-linux-arm64-musl": "4.63.3",
+        "@rollup/rollup-linux-loong64-gnu": "4.63.3",
+        "@rollup/rollup-linux-loong64-musl": "4.63.3",
+        "@rollup/rollup-linux-ppc64-gnu": "4.63.3",
+        "@rollup/rollup-linux-ppc64-musl": "4.63.3",
+        "@rollup/rollup-linux-riscv64-gnu": "4.63.3",
+        "@rollup/rollup-linux-riscv64-musl": "4.63.3",
+        "@rollup/rollup-linux-s390x-gnu": "4.63.3",
+        "@rollup/rollup-linux-x64-gnu": "4.63.3",
+        "@rollup/rollup-linux-x64-musl": "4.63.3",
+        "@rollup/rollup-openbsd-x64": "4.63.3",
+        "@rollup/rollup-openharmony-arm64": "4.63.3",
+        "@rollup/rollup-win32-arm64-msvc": "4.63.3",
+        "@rollup/rollup-win32-ia32-msvc": "4.63.3",
+        "@rollup/rollup-win32-x64-gnu": "4.63.3",
+        "@rollup/rollup-win32-x64-msvc": "4.63.3",
+        "fsevents": "~2.3.2"
+      }
+    },
+    "node_modules/saxes": {
+      "version": "6.0.0",
+      "resolved": "https://registry.npmjs.org/saxes/-/saxes-6.0.0.tgz",
+      "integrity": "sha512-xAg7SOnEhrm5zI3puOOKyy1OMcMlIJZYNJY7xLBwSze0UjhPLnWfj2GF2EpT0jmzaJKIWKHLsaSSajf35bcYnA==",
+      "dev": true,
+      "license": "ISC",
+      "dependencies": {
+        "xmlchars": "^2.2.0"
+      },
+      "engines": {
+        "node": ">=v12.22.7"
+      }
+    },
+    "node_modules/scheduler": {
+      "version": "0.28.0",
+      "resolved": "https://registry.npmjs.org/scheduler/-/scheduler-0.28.0.tgz",
+      "integrity": "sha512-juorfCmIkIw8tT+p5BXSm6PJjQF/ycEYmKyzURCIt/RaZIhL+PulbQ9Yu2z1HdOJDdqDTlxA1+xKBmHXJsczAw==",
+      "license": "MIT"
+    },
+    "node_modules/semver": {
+      "version": "6.3.1",
+      "resolved": "https://registry.npmjs.org/semver/-/semver-6.3.1.tgz",
+      "integrity": "sha512-BR7VvDCVHO+q2xBEWskxS6DJE1qRnb7DxzUrogb71CWoSficBxYsiAGd+Kl0mmq/MprG9yArRkyrQxTO6XjMzA==",
+      "dev": true,
+      "license": "ISC",
+      "bin": {
+        "semver": "bin/semver.js"
+      }
+    },
+    "node_modules/set-cookie-parser": {
+      "version": "2.7.2",
+      "resolved": "https://registry.npmjs.org/set-cookie-parser/-/set-cookie-parser-2.7.2.tgz",
+      "integrity": "sha512-oeM1lpU/UvhTxw+g3cIfxXHyJRc/uidd3yK1P242gzHds0udQBYzs3y8j4gCCW+ZJ7ad0yctld8RYO+bdurlvw==",
+      "license": "MIT"
+    },
+    "node_modules/siginfo": {
+      "version": "2.0.0",
+      "resolved": "https://registry.npmjs.org/siginfo/-/siginfo-2.0.0.tgz",
+      "integrity": "sha512-ybx0WO1/8bSBLEWXZvEd7gMW3Sn3JFlW3TvX1nREbDLRNQNaeNN8WK0meBwPdAaOI7TtRRRJn/Es1zhrrCHu7g==",
+      "dev": true,
+      "license": "ISC"
+    },
+    "node_modules/source-map-js": {
+      "version": "1.2.1",
+      "resolved": "https://registry.npmjs.org/source-map-js/-/source-map-js-1.2.1.tgz",
+      "integrity": "sha512-UXWMKhLOwVKb728IUtQPXxfYU+usdybtUrK/8uGE8CQMvrhOpwvzDBwj0QhSL7MQc7vIsISBG8VQ8+IDQxpfQA==",
+      "dev": true,
+      "license": "BSD-3-Clause",
+      "engines": {
+        "node": ">=0.10.0"
+      }
+    },
+    "node_modules/stackback": {
+      "version": "0.0.2",
+      "resolved": "https://registry.npmjs.org/stackback/-/stackback-0.0.2.tgz",
+      "integrity": "sha512-1XMJE5fQo1jGH6Y/7ebnwPOBEkIEnT4QF32d5R1+VXdXveM0IBMJt8zfaxX1P3QhVwrYe+576+jkANtSS2mBbw==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/std-env": {
+      "version": "3.10.0",
+      "resolved": "https://registry.npmjs.org/std-env/-/std-env-3.10.0.tgz",
+      "integrity": "sha512-5GS12FdOZNliM5mAOxFRg7Ir0pWz8MdpYm6AY6VPkGpbA7ZzmbzNcBJQ0GPvvyWgcY7QAhCgf9Uy89I03faLkg==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/strip-indent": {
+      "version": "3.0.0",
+      "resolved": "https://registry.npmjs.org/strip-indent/-/strip-indent-3.0.0.tgz",
+      "integrity": "sha512-laJTa3Jb+VQpaC6DseHhF7dXVqHTfJPCRDaEbid/drOhgitgYku/letMUqOXFoWV0zIIUbjpdH2t+tYj4bQMRQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "min-indent": "^1.0.0"
+      },
+      "engines": {
+        "node": ">=8"
+      }
+    },
+    "node_modules/strip-literal": {
+      "version": "3.1.0",
+      "resolved": "https://registry.npmjs.org/strip-literal/-/strip-literal-3.1.0.tgz",
+      "integrity": "sha512-8r3mkIM/2+PpjHoOtiAW8Rg3jJLHaV7xPwG+YRGrv6FP0wwk/toTpATxWYOW0BKdWwl82VT2tFYi5DlROa0Mxg==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "js-tokens": "^9.0.1"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/antfu"
+      }
+    },
+    "node_modules/strip-literal/node_modules/js-tokens": {
+      "version": "9.0.1",
+      "resolved": "https://registry.npmjs.org/js-tokens/-/js-tokens-9.0.1.tgz",
+      "integrity": "sha512-mxa9E9ITFOt0ban3j6L5MpjwegGz6lBQmM1IJkWeBZGcMxto50+eWdjC/52xDbS2vy0k7vIMK0Fe2wfL9OQSpQ==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/symbol-tree": {
+      "version": "3.2.4",
+      "resolved": "https://registry.npmjs.org/symbol-tree/-/symbol-tree-3.2.4.tgz",
+      "integrity": "sha512-9QNk5KwDF+Bvz+PyObkmSYjI5ksVUYtjW7AU22r2NKcfLJcXp96hkDWU3+XndOsUb+AQ9QhfzfCT2O+CNWT5Tw==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/tinybench": {
+      "version": "2.9.0",
+      "resolved": "https://registry.npmjs.org/tinybench/-/tinybench-2.9.0.tgz",
+      "integrity": "sha512-0+DUvqWMValLmha6lr4kD8iAMK1HzV0/aKnCtWb9v9641TnP/MFb7Pc2bxoxQjTXAErryXVgUOfv2YqNllqGeg==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/tinyexec": {
+      "version": "0.3.2",
+      "resolved": "https://registry.npmjs.org/tinyexec/-/tinyexec-0.3.2.tgz",
+      "integrity": "sha512-KQQR9yN7R5+OSwaK0XQoj22pwHoTlgYqmUscPYoknOoWCWfj/5/ABTMRi69FrKU5ffPVh5QcFikpWJI/P1ocHA==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/tinyglobby": {
+      "version": "0.2.17",
+      "resolved": "https://registry.npmjs.org/tinyglobby/-/tinyglobby-0.2.17.tgz",
+      "integrity": "sha512-wXR/dYpcqKmfWpEdZjiKJOwCNFndD0DMnrW/cYjVGttEkBfVgcLFHoNrlj47mjOVic9yyNu65alsgF4NQyTa2g==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "fdir": "^6.5.0",
+        "picomatch": "^4.0.4"
+      },
+      "engines": {
+        "node": ">=12.0.0"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/SuperchupuDev"
+      }
+    },
+    "node_modules/tinypool": {
+      "version": "1.1.1",
+      "resolved": "https://registry.npmjs.org/tinypool/-/tinypool-1.1.1.tgz",
+      "integrity": "sha512-Zba82s87IFq9A9XmjiX5uZA/ARWDrB03OHlq+Vw1fSdt0I+4/Kutwy8BP4Y/y/aORMo61FQ0vIb5j44vSo5Pkg==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": "^18.0.0 || >=20.0.0"
+      }
+    },
+    "node_modules/tinyrainbow": {
+      "version": "2.0.0",
+      "resolved": "https://registry.npmjs.org/tinyrainbow/-/tinyrainbow-2.0.0.tgz",
+      "integrity": "sha512-op4nsTR47R6p0vMUUoYl/a+ljLFVtlfaXkLQmqfLR1qHma1h/ysYk4hEXZ880bf2CYgTskvTa/e196Vd5dDQXw==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=14.0.0"
+      }
+    },
+    "node_modules/tinyspy": {
+      "version": "4.0.6",
+      "resolved": "https://registry.npmjs.org/tinyspy/-/tinyspy-4.0.6.tgz",
+      "integrity": "sha512-u8KszXvGfU68hVcZpRHKG28T0krMuv2G5nDhiHaMLen/gIuFEgIJhaJuO69qjnXg5paSrbPMFfx3brNuN8eVSg==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=14.0.0"
+      }
+    },
+    "node_modules/tldts": {
+      "version": "7.4.13",
+      "resolved": "https://registry.npmjs.org/tldts/-/tldts-7.4.13.tgz",
+      "integrity": "sha512-iHtaIWWIbMDkCeJdTBzZFGgbluE5J+oHlb2g7+oAz1S1gpuVpabRZdQyd471Vl8UUkcz2vXSL8xZH2kyCe8tfA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "tldts-core": "^7.4.13"
+      },
+      "bin": {
+        "tldts": "bin/cli.js"
+      }
+    },
+    "node_modules/tldts-core": {
+      "version": "7.4.13",
+      "resolved": "https://registry.npmjs.org/tldts-core/-/tldts-core-7.4.13.tgz",
+      "integrity": "sha512-mbYsrih5FRtGxs3Usvl/PqwJsNpp+jsmrdFviiK02teHDG0/HebBG/pqCylje3kzgXYzuLoHJF/0mz9W53t8Xg==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/tough-cookie": {
+      "version": "6.0.2",
+      "resolved": "https://registry.npmjs.org/tough-cookie/-/tough-cookie-6.0.2.tgz",
+      "integrity": "sha512-exgYmnmL/sJpR3upZfXG5PoatXQii55xAiXGXzY+sROLZ/Y+SLcp9PgJNI9Vz37HpQ74WvDcLT8eqm+kV3FzrA==",
+      "dev": true,
+      "license": "BSD-3-Clause",
+      "dependencies": {
+        "tldts": "^7.0.5"
+      },
+      "engines": {
+        "node": ">=16"
+      }
+    },
+    "node_modules/tr46": {
+      "version": "6.0.0",
+      "resolved": "https://registry.npmjs.org/tr46/-/tr46-6.0.0.tgz",
+      "integrity": "sha512-bLVMLPtstlZ4iMQHpFHTR7GAGj2jxi8Dg0s2h2MafAE4uSWF98FC/3MomU51iQAMf8/qDUbKWf5GxuvvVcXEhw==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "punycode": "^2.3.1"
+      },
+      "engines": {
+        "node": ">=20"
+      }
+    },
+    "node_modules/typescript": {
+      "version": "5.9.3",
+      "resolved": "https://registry.npmjs.org/typescript/-/typescript-5.9.3.tgz",
+      "integrity": "sha512-jl1vZzPDinLr9eUt3J/t7V6FgNEw9QjvBPdysz9KfQDD41fQrC2Y4vKQdiaUpFT4bXlb1RHhLpp8wtm6M5TgSw==",
+      "dev": true,
+      "license": "Apache-2.0",
+      "bin": {
+        "tsc": "bin/tsc",
+        "tsserver": "bin/tsserver"
+      },
+      "engines": {
+        "node": ">=14.17"
+      }
+    },
+    "node_modules/undici-types": {
+      "version": "7.18.2",
+      "resolved": "https://registry.npmjs.org/undici-types/-/undici-types-7.18.2.tgz",
+      "integrity": "sha512-AsuCzffGHJybSaRrmr5eHr81mwJU3kjw6M+uprWvCXiNeN9SOGwQ3Jn8jb8m3Z6izVgknn1R0FTCEAP2QrLY/w==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/update-browserslist-db": {
+      "version": "1.3.3",
+      "resolved": "https://registry.npmjs.org/update-browserslist-db/-/update-browserslist-db-1.3.3.tgz",
+      "integrity": "sha512-pJ2sYawQS0R/WI928Gj5GlPhTGzbMelq0+4INtSYNDV9ErKJcX6xjGWkoG/VnB3dpUm00zALaqkrUD77pO5TDQ==",
+      "dev": true,
+      "funding": [
+        {
+          "type": "opencollective",
+          "url": "https://opencollective.com/browserslist"
+        },
+        {
+          "type": "tidelift",
+          "url": "https://tidelift.com/funding/github/npm/browserslist"
+        },
+        {
+          "type": "github",
+          "url": "https://github.com/sponsors/ai"
+        }
+      ],
+      "license": "MIT",
+      "dependencies": {
+        "escalade": "^3.2.0",
+        "picocolors": "^1.1.1"
+      },
+      "bin": {
+        "update-browserslist-db": "cli.js"
+      },
+      "peerDependencies": {
+        "browserslist": ">= 4.21.0"
+      }
+    },
+    "node_modules/vite": {
+      "version": "7.3.6",
+      "resolved": "https://registry.npmjs.org/vite/-/vite-7.3.6.tgz",
+      "integrity": "sha512-4XP60spRGjSZFf1qYH+dJIkK2znL3zQfl9KkOV9MkkRR/3Dls0dxaBsQPTloEc5BLXWPL9vsOxopxyKoMmDueg==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "esbuild": "^0.27.0 || ^0.28.0",
+        "fdir": "^6.5.0",
+        "picomatch": "^4.0.3",
+        "postcss": "^8.5.6",
+        "rollup": "^4.43.0",
+        "tinyglobby": "^0.2.15"
+      },
+      "bin": {
+        "vite": "bin/vite.js"
+      },
+      "engines": {
+        "node": "^20.19.0 || >=22.12.0"
+      },
+      "funding": {
+        "url": "https://github.com/vitejs/vite?sponsor=1"
+      },
+      "optionalDependencies": {
+        "fsevents": "~2.3.3"
+      },
+      "peerDependencies": {
+        "@types/node": "^20.19.0 || >=22.12.0",
+        "jiti": ">=1.21.0",
+        "less": "^4.0.0",
+        "lightningcss": "^1.21.0",
+        "sass": "^1.70.0",
+        "sass-embedded": "^1.70.0",
+        "stylus": ">=0.54.8",
+        "sugarss": "^5.0.0",
+        "terser": "^5.16.0",
+        "tsx": "^4.8.1",
+        "yaml": "^2.4.2"
+      },
+      "peerDependenciesMeta": {
+        "@types/node": {
+          "optional": true
+        },
+        "jiti": {
+          "optional": true
+        },
+        "less": {
+          "optional": true
+        },
+        "lightningcss": {
+          "optional": true
+        },
+        "sass": {
+          "optional": true
+        },
+        "sass-embedded": {
+          "optional": true
+        },
+        "stylus": {
+          "optional": true
+        },
+        "sugarss": {
+          "optional": true
+        },
+        "terser": {
+          "optional": true
+        },
+        "tsx": {
+          "optional": true
+        },
+        "yaml": {
+          "optional": true
+        }
+      }
+    },
+    "node_modules/vite-node": {
+      "version": "3.2.4",
+      "resolved": "https://registry.npmjs.org/vite-node/-/vite-node-3.2.4.tgz",
+      "integrity": "sha512-EbKSKh+bh1E1IFxeO0pg1n4dvoOTt0UDiXMd/qn++r98+jPO1xtJilvXldeuQ8giIB5IkpjCgMleHMNEsGH6pg==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "cac": "^6.7.14",
+        "debug": "^4.4.1",
+        "es-module-lexer": "^1.7.0",
+        "pathe": "^2.0.3",
+        "vite": "^5.0.0 || ^6.0.0 || ^7.0.0-0"
+      },
+      "bin": {
+        "vite-node": "vite-node.mjs"
+      },
+      "engines": {
+        "node": "^18.0.0 || ^20.0.0 || >=22.0.0"
+      },
+      "funding": {
+        "url": "https://opencollective.com/vitest"
+      }
+    },
+    "node_modules/vitest": {
+      "version": "3.2.7",
+      "resolved": "https://registry.npmjs.org/vitest/-/vitest-3.2.7.tgz",
+      "integrity": "sha512-KrxIJ62Fd89gfysR4WotlgZABiz2dqFPgqGzX7s+CwsqLFomRH7777ZcrOD6+WVAh7khPQP41A+BKbpcJFrdEg==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@types/chai": "^5.2.2",
+        "@vitest/expect": "3.2.7",
+        "@vitest/mocker": "3.2.7",
+        "@vitest/pretty-format": "^3.2.7",
+        "@vitest/runner": "3.2.7",
+        "@vitest/snapshot": "3.2.7",
+        "@vitest/spy": "3.2.7",
+        "@vitest/utils": "3.2.7",
+        "chai": "^5.2.0",
+        "debug": "^4.4.1",
+        "expect-type": "^1.2.1",
+        "magic-string": "^0.30.17",
+        "pathe": "^2.0.3",
+        "picomatch": "^4.0.2",
+        "std-env": "^3.9.0",
+        "tinybench": "^2.9.0",
+        "tinyexec": "^0.3.2",
+        "tinyglobby": "^0.2.14",
+        "tinypool": "^1.1.1",
+        "tinyrainbow": "^2.0.0",
+        "vite": "^5.0.0 || ^6.0.0 || ^7.0.0-0",
+        "vite-node": "3.2.4",
+        "why-is-node-running": "^2.3.0"
+      },
+      "bin": {
+        "vitest": "vitest.mjs"
+      },
+      "engines": {
+        "node": "^18.0.0 || ^20.0.0 || >=22.0.0"
+      },
+      "funding": {
+        "url": "https://opencollective.com/vitest"
+      },
+      "peerDependencies": {
+        "@edge-runtime/vm": "*",
+        "@types/debug": "^4.1.12",
+        "@types/node": "^18.0.0 || ^20.0.0 || >=22.0.0",
+        "@vitest/browser": "3.2.7",
+        "@vitest/ui": "3.2.7",
+        "happy-dom": "*",
+        "jsdom": "*"
+      },
+      "peerDependenciesMeta": {
+        "@edge-runtime/vm": {
+          "optional": true
+        },
+        "@types/debug": {
+          "optional": true
+        },
+        "@types/node": {
+          "optional": true
+        },
+        "@vitest/browser": {
+          "optional": true
+        },
+        "@vitest/ui": {
+          "optional": true
+        },
+        "happy-dom": {
+          "optional": true
+        },
+        "jsdom": {
+          "optional": true
+        }
+      }
+    },
+    "node_modules/w3c-xmlserializer": {
+      "version": "5.0.0",
+      "resolved": "https://registry.npmjs.org/w3c-xmlserializer/-/w3c-xmlserializer-5.0.0.tgz",
+      "integrity": "sha512-o8qghlI8NZHU1lLPrpi2+Uq7abh4GGPpYANlalzWxyWteJOCsr/P+oPBA49TOLu5FTZO4d3F9MnWJfiMo4BkmA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "xml-name-validator": "^5.0.0"
+      },
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/webidl-conversions": {
+      "version": "8.0.1",
+      "resolved": "https://registry.npmjs.org/webidl-conversions/-/webidl-conversions-8.0.1.tgz",
+      "integrity": "sha512-BMhLD/Sw+GbJC21C/UgyaZX41nPt8bUTg+jWyDeg7e7YN4xOM05YPSIXceACnXVtqyEw/LMClUQMtMZ+PGGpqQ==",
+      "dev": true,
+      "license": "BSD-2-Clause",
+      "engines": {
+        "node": ">=20"
+      }
+    },
+    "node_modules/whatwg-mimetype": {
+      "version": "4.0.0",
+      "resolved": "https://registry.npmjs.org/whatwg-mimetype/-/whatwg-mimetype-4.0.0.tgz",
+      "integrity": "sha512-QaKxh0eNIi2mE9p2vEdzfagOKHCcj1pJ56EEHGQOVxp8r9/iszLUUV7v89x9O1p/T+NlTM5W7jW6+cz4Fq1YVg==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/whatwg-url": {
+      "version": "15.1.0",
+      "resolved": "https://registry.npmjs.org/whatwg-url/-/whatwg-url-15.1.0.tgz",
+      "integrity": "sha512-2ytDk0kiEj/yu90JOAp44PVPUkO9+jVhyf+SybKlRHSDlvOOZhdPIrr7xTH64l4WixO2cP+wQIcgujkGBPPz6g==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "tr46": "^6.0.0",
+        "webidl-conversions": "^8.0.0"
+      },
+      "engines": {
+        "node": ">=20"
+      }
+    },
+    "node_modules/why-is-node-running": {
+      "version": "2.3.0",
+      "resolved": "https://registry.npmjs.org/why-is-node-running/-/why-is-node-running-2.3.0.tgz",
+      "integrity": "sha512-hUrmaWBdVDcxvYqnyh09zunKzROWjbZTiNy8dBEjkS7ehEDQibXJ7XvlmtbwuTclUiIyN+CyXQD4Vmko8fNm8w==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "siginfo": "^2.0.0",
+        "stackback": "0.0.2"
+      },
+      "bin": {
+        "why-is-node-running": "cli.js"
+      },
+      "engines": {
+        "node": ">=8"
+      }
+    },
+    "node_modules/ws": {
+      "version": "8.21.3",
+      "resolved": "https://registry.npmjs.org/ws/-/ws-8.21.3.tgz",
+      "integrity": "sha512-201TZ/kPWxoPr/OKWjquZR1SWKXcvxdH+e1xrx89b3YbmzLMFCLfnaG1HFIgWzJOEWZ7MvpK++odZufgYR50Rw==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=10.0.0"
+      },
+      "peerDependencies": {
+        "bufferutil": "^4.0.1",
+        "utf-8-validate": ">=5.0.2"
+      },
+      "peerDependenciesMeta": {
+        "bufferutil": {
+          "optional": true
+        },
+        "utf-8-validate": {
+          "optional": true
+        }
+      }
+    },
+    "node_modules/xml-name-validator": {
+      "version": "5.0.0",
+      "resolved": "https://registry.npmjs.org/xml-name-validator/-/xml-name-validator-5.0.0.tgz",
+      "integrity": "sha512-EvGK8EJ3DhaHfbRlETOWAS5pO9MZITeauHKJyb8wyajUfQUenkIg2MvLDTZ4T/TgIcm3HU0TFBgWWboAZ30UHg==",
+      "dev": true,
+      "license": "Apache-2.0",
+      "engines": {
+        "node": ">=18"
+      }
+    },
+    "node_modules/xmlchars": {
+      "version": "2.2.0",
+      "resolved": "https://registry.npmjs.org/xmlchars/-/xmlchars-2.2.0.tgz",
+      "integrity": "sha512-JZnDKK8B0RCDw84FNdDAIpZK+JuJw+s7Lz8nksI7SIuU3UXJJslUthsi+uWBUYOwPFwW7W7PRLRfUKpxjtjFCw==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/yallist": {
+      "version": "3.1.1",
+      "resolved": "https://registry.npmjs.org/yallist/-/yallist-3.1.1.tgz",
+      "integrity": "sha512-a4UGQaWPH59mOXUYnAG2ewncQS4i4F43Tv3JoAM+s2VDAmS9NsK8GpDMLrCHPksFT7h3K6TOoUNn2pb7RoXx4g==",
+      "dev": true,
+      "license": "ISC"
+    }
+  }
+}
diff --git a/frontend/package.json b/frontend/package.json
new file mode 100644
index 0000000..a20864a
--- /dev/null
+++ b/frontend/package.json
@@ -0,0 +1,33 @@
+{
+  "name": "bmad-expense-tracker-frontend",
+  "private": true,
+  "version": "0.1.0",
+  "type": "module",
+  "scripts": {
+    "dev": "vite --host 0.0.0.0",
+    "build": "tsc -b && vite build",
+    "test": "vitest run",
+    "test:watch": "vitest"
+  },
+  "dependencies": {
+    "@tanstack/react-query": "^5.90.6",
+    "lucide-react": "^0.552.0",
+    "react": "^19.2.0",
+    "react-dom": "^19.2.0",
+    "react-router-dom": "^7.9.5"
+  },
+  "devDependencies": {
+    "@testing-library/jest-dom": "^6.9.1",
+    "@testing-library/react": "^16.3.0",
+    "@testing-library/user-event": "^14.6.1",
+    "@types/node": "^24.9.1",
+    "@types/react": "^19.2.2",
+    "@types/react-dom": "^19.2.2",
+    "@vitejs/plugin-react": "^5.0.4",
+    "jsdom": "^27.0.1",
+    "typescript": "^5.9.3",
+    "vite": "^7.1.12",
+    "vitest": "^3.2.4"
+  }
+}
+
diff --git a/frontend/src/app/App.test.tsx b/frontend/src/app/App.test.tsx
new file mode 100644
index 0000000..66c786a
--- /dev/null
+++ b/frontend/src/app/App.test.tsx
@@ -0,0 +1,782 @@
+import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
+import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
+import userEvent from "@testing-library/user-event";
+import { MemoryRouter, Route, Routes } from "react-router-dom";
+import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
+import { HomePage } from "./HomePage";
+import { AppNavigation } from "./navigation";
+import { ReviewPage } from "./ReviewPage";
+import { ExpenseDetailPage } from "../features/expenses/ExpenseDetailPage";
+import { ExpenseEditPage } from "../features/expenses/ExpenseEditPage";
+import * as categoryApi from "../shared/api/categories";
+import * as expenseApi from "../shared/api/expenses";
+
+const starterCategories = [
+  { id: "10000000-0000-0000-0000-000000000001", name: "Food", isDefault: true, isProtected: true },
+  { id: "10000000-0000-0000-0000-000000000002", name: "Transport", isDefault: true, isProtected: true },
+  { id: "10000000-0000-0000-0000-000000000003", name: "Shopping", isDefault: true, isProtected: true },
+  { id: "10000000-0000-0000-0000-000000000004", name: "Bills", isDefault: true, isProtected: true },
+  { id: "10000000-0000-0000-0000-000000000005", name: "Entertainment", isDefault: true, isProtected: true },
+  { id: "10000000-0000-0000-0000-000000000006", name: "Health", isDefault: true, isProtected: true },
+  { id: "10000000-0000-0000-0000-000000000007", name: "Education", isDefault: true, isProtected: true },
+  { id: "10000000-0000-0000-0000-000000000008", name: "Other", isDefault: true, isProtected: true }
+];
+
+const expenseRows = [
+  {
+    id: "20000000-0000-0000-0000-000000000001",
+    amount: 125.5,
+    categoryId: starterCategories[0].id,
+    categoryName: "Food",
+    expenseDate: "2026-09-16",
+    description: "Lunch",
+    createdAt: "2026-09-16T10:00:00Z"
+  },
+  {
+    id: "20000000-0000-0000-0000-000000000002",
+    amount: 80,
+    categoryId: starterCategories[1].id,
+    categoryName: "Transport",
+    expenseDate: "2026-09-16",
+    description: null,
+    createdAt: "2026-09-16T09:00:00Z"
+  },
+  {
+    id: "20000000-0000-0000-0000-000000000003",
+    amount: 42,
+    categoryId: starterCategories[2].id,
+    categoryName: "Shopping",
+    expenseDate: "2026-09-15",
+    description: "Notebook",
+    createdAt: "2026-09-15T11:00:00Z"
+  },
+  {
+    id: "20000000-0000-0000-0000-000000000004",
+    amount: 1500,
+    categoryId: starterCategories[3].id,
+    categoryName: "Bills",
+    expenseDate: "2026-09-14",
+    description: null,
+    createdAt: "2026-09-14T11:00:00Z"
+  },
+  {
+    id: "20000000-0000-0000-0000-000000000005",
+    amount: 300,
+    categoryId: starterCategories[4].id,
+    categoryName: "Entertainment",
+    expenseDate: "2026-09-13",
+    description: "Movie",
+    createdAt: "2026-09-13T11:00:00Z"
+  },
+  {
+    id: "20000000-0000-0000-0000-000000000006",
+    amount: 900,
+    categoryId: starterCategories[5].id,
+    categoryName: "Health",
+    expenseDate: "2026-09-12",
+    description: "Medicine",
+    createdAt: "2026-09-12T11:00:00Z"
+  }
+];
+
+const expenseDetail = {
+  ...expenseRows[0],
+  updatedAt: "2026-09-16T10:30:00Z"
+};
+
+function renderHome() {
+  const queryClient = new QueryClient({
+    defaultOptions: {
+      queries: { retry: false }
+    }
+  });
+
+  return render(
+    <QueryClientProvider client={queryClient}>
+      <MemoryRouter initialEntries={["/"]}>
+        <AppNavigation />
+        <Routes>
+          <Route element={<HomePage />} path="/" />
+        </Routes>
+      </MemoryRouter>
+    </QueryClientProvider>
+  );
+}
+
+function renderAppRoute(initialPath: string) {
+  const queryClient = new QueryClient({
+    defaultOptions: {
+      queries: { retry: false }
+    }
+  });
+
+  const result = render(
+    <QueryClientProvider client={queryClient}>
+      <MemoryRouter initialEntries={[initialPath]}>
+        <AppNavigation />
+        <Routes>
+          <Route element={<HomePage />} path="/" />
+          <Route element={<ReviewPage />} path="/review" />
+          <Route element={<ExpenseDetailPage />} path="/expenses/:expenseId" />
+          <Route element={<ExpenseEditPage />} path="/expenses/:expenseId/edit" />
+        </Routes>
+      </MemoryRouter>
+    </QueryClientProvider>
+  );
+
+  return { queryClient, ...result };
+}
+
+describe("Home shell", () => {
+  beforeEach(() => {
+    vi.spyOn(categoryApi, "getCategories").mockResolvedValue(starterCategories);
+    vi.spyOn(expenseApi, "getExpenses").mockResolvedValue([]);
+    vi.spyOn(expenseApi, "getExpense").mockResolvedValue(expenseDetail);
+    vi.spyOn(expenseApi, "updateExpense").mockResolvedValue(expenseDetail);
+    vi.spyOn(expenseApi, "deleteExpense").mockResolvedValue();
+    vi.spyOn(expenseApi, "createExpense").mockResolvedValue({
+      id: "20000000-0000-0000-0000-000000000001",
+      amount: 125.5,
+      categoryId: starterCategories[0].id,
+      expenseDate: "2026-09-16",
+      description: null,
+      createdAt: "2026-09-16T08:00:00Z",
+      updatedAt: "2026-09-16T08:00:00Z"
+    });
+  });
+
+  afterEach(() => {
+    cleanup();
+    vi.restoreAllMocks();
+  });
+
+  it("renders Home as the default surface with required navigation", async () => {
+    renderHome();
+
+    expect(screen.getByRole("navigation", { name: /primary navigation/i })).toBeInTheDocument();
+    expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();
+    expect(screen.getByRole("link", { name: /review/i })).toBeInTheDocument();
+    expect(screen.getByRole("link", { name: /categories/i })).toBeInTheDocument();
+    expect(screen.getByRole("heading", { name: /track a new spend/i })).toBeInTheDocument();
+    expect(screen.getByText("₹0")).toBeInTheDocument();
+    expect(await screen.findByText("No expenses yet. Add your first one above.")).toBeInTheDocument();
+    expect(await screen.findByRole("button", { name: "Food" })).toBeInTheDocument();
+  });
+
+  it("shows the five most recent expenses on Home with row details and no blank description text", async () => {
+    vi.mocked(expenseApi.getExpenses).mockResolvedValueOnce(expenseRows);
+
+    renderHome();
+
+    const recentList = await screen.findByRole("list", { name: "Recent expenses" });
+    const rows = within(recentList).getAllByRole("link");
+
+    expect(rows).toHaveLength(5);
+    expect(rows.map((row) => row.textContent)).toEqual([
+      expect.stringContaining("Food"),
+      expect.stringContaining("Transport"),
+      expect.stringContaining("Shopping"),
+      expect.stringContaining("Bills"),
+      expect.stringContaining("Entertainment")
+    ]);
+    expect(rows[0]).toHaveTextContent("₹125.50");
+    expect(rows[0]).toHaveTextContent("16 Sept 2026");
+    expect(rows[0]).toHaveTextContent("Lunch");
+    expect(rows[1]).toHaveTextContent("Transport");
+    expect(rows[1]).not.toHaveTextContent("Lunch");
+    expect(within(recentList).queryByText("Health")).not.toBeInTheDocument();
+  });
+
+  it("shows a recent expense failure without hiding Add Expense", async () => {
+    vi.mocked(expenseApi.getExpenses).mockRejectedValueOnce(new Error("Nope"));
+
+    renderHome();
+
+    expect(screen.getByRole("heading", { name: /track a new spend/i })).toBeInTheDocument();
+    expect(await screen.findByText("Recent expenses could not be loaded. Try refreshing.")).toBeInTheDocument();
+  });
+
+  it("shows a loading state before Home recent expenses resolve", async () => {
+    vi.mocked(expenseApi.getExpenses).mockReturnValueOnce(new Promise(() => {}));
+
+    renderHome();
+
+    expect(screen.getByText("Loading expenses...")).toBeInTheDocument();
+    expect(screen.queryByText("No expenses yet. Add your first one above.")).not.toBeInTheDocument();
+  });
+
+  it("shows all recorded expenses on Review using the same row navigation", async () => {
+    vi.mocked(expenseApi.getExpenses).mockResolvedValueOnce(expenseRows);
+
+    renderAppRoute("/review");
+
+    const recordedList = await screen.findByRole("list", { name: "Recorded expenses" });
+    const rows = within(recordedList).getAllByRole("link");
+
+    expect(rows).toHaveLength(6);
+    expect(rows[0]).toHaveTextContent("Food");
+    expect(rows[5]).toHaveTextContent("Health");
+    expect(rows[0]).toHaveAttribute("href", "/expenses/20000000-0000-0000-0000-000000000001");
+  });
+
+  it("shows empty Review copy with a route back Home", async () => {
+    renderAppRoute("/review");
+
+    expect(await screen.findByText("No expenses recorded yet.")).toBeInTheDocument();
+    expect(screen.getByRole("link", { name: /back to home/i })).toHaveAttribute("href", "/");
+  });
+
+  it("shows a Review failure state when recorded expenses cannot be loaded", async () => {
+    vi.mocked(expenseApi.getExpenses).mockRejectedValueOnce(new Error("Nope"));
+
+    renderAppRoute("/review");
+
+    expect(await screen.findByText("Expenses could not be loaded. Try refreshing.")).toBeInTheDocument();
+    expect(screen.getByRole("heading", { name: /recorded expenses/i })).toBeInTheDocument();
+  });
+
+  it("shows a loading state before Review expenses resolve", async () => {
+    vi.mocked(expenseApi.getExpenses).mockReturnValueOnce(new Promise(() => {}));
+
+    renderAppRoute("/review");
+
+    expect(screen.getByText("Loading expenses...")).toBeInTheDocument();
+    expect(screen.queryByText("No expenses recorded yet.")).not.toBeInTheDocument();
+  });
+
+  it("navigates from an expense row to the future detail route", async () => {
+    const user = userEvent.setup();
+    vi.mocked(expenseApi.getExpenses).mockResolvedValueOnce(expenseRows);
+
+    renderAppRoute("/");
+
+    await user.click(await screen.findByRole("link", { name: /food/i }));
+
+    expect(await screen.findByRole("heading", { name: "Expense details" })).toBeInTheDocument();
+    expect(screen.getByText("₹125.50")).toBeInTheDocument();
+  });
+
+  it("renders expense detail read-only with edit and delete actions", async () => {
+    renderAppRoute(`/expenses/${expenseDetail.id}`);
+
+    expect(await screen.findByRole("heading", { name: "Expense details" })).toBeInTheDocument();
+    expect(await screen.findByText("₹125.50")).toBeInTheDocument();
+    expect(screen.getByText("Food")).toBeInTheDocument();
+    expect(screen.getByText("16 Sept 2026")).toBeInTheDocument();
+    expect(screen.getByText("Lunch")).toBeInTheDocument();
+    expect(screen.getByRole("link", { name: /edit/i })).toHaveAttribute("href", `/expenses/${expenseDetail.id}/edit`);
+    expect(screen.getByRole("button", { name: /delete/i })).toBeEnabled();
+    expect(screen.queryByLabelText("Amount")).not.toBeInTheDocument();
+  });
+
+  it("opens delete confirmation without calling the API first", async () => {
+    const user = userEvent.setup();
+    renderAppRoute(`/expenses/${expenseDetail.id}`);
+
+    await user.click(await screen.findByRole("button", { name: /delete/i }));
+
+    expect(screen.getByRole("dialog", { name: /delete this expense/i })).toBeInTheDocument();
+    expect(screen.getByText("This permanently removes the expense from your records.")).toBeInTheDocument();
+    expect(screen.getByRole("button", { name: /cancel/i })).toHaveFocus();
+    expect(expenseApi.deleteExpense).not.toHaveBeenCalled();
+  });
+
+  it("cancels delete confirmation and leaves the expense visible", async () => {
+    const user = userEvent.setup();
+    renderAppRoute(`/expenses/${expenseDetail.id}`);
+
+    await user.click(await screen.findByRole("button", { name: /delete/i }));
+    await user.click(screen.getByRole("button", { name: /cancel/i }));
+
+    expect(screen.queryByRole("dialog", { name: /delete this expense/i })).not.toBeInTheDocument();
+    expect(screen.getByText("₹125.50")).toBeInTheDocument();
+    expect(expenseApi.deleteExpense).not.toHaveBeenCalled();
+  });
+
+  it("deletes an expense, returns to Review, refreshes the list, and shows feedback", async () => {
+    const user = userEvent.setup();
+    vi.mocked(expenseApi.getExpenses).mockResolvedValueOnce(expenseRows.slice(1));
+    renderAppRoute(`/expenses/${expenseDetail.id}`);
+
+    await user.click(await screen.findByRole("button", { name: /delete/i }));
+    await user.click(within(screen.getByRole("dialog", { name: /delete this expense/i })).getByRole("button", { name: /^delete$/i }));
+
+    expect(vi.mocked(expenseApi.deleteExpense).mock.calls[0][0]).toBe(expenseDetail.id);
+    expect(await screen.findByRole("heading", { name: /recorded expenses/i })).toBeInTheDocument();
+    expect(screen.getByText("Expense deleted.")).toBeInTheDocument();
+    const recordedList = await screen.findByRole("list", { name: "Recorded expenses" });
+    expect(within(recordedList).queryByText("Food")).not.toBeInTheDocument();
+    expect(within(recordedList).getByText("Transport")).toBeInTheDocument();
+  });
+
+  it("keeps delete failure feedback in the dialog context", async () => {
+    const user = userEvent.setup();
+    vi.mocked(expenseApi.deleteExpense).mockRejectedValueOnce(new Error("Expense could not be deleted. Try again."));
+    renderAppRoute(`/expenses/${expenseDetail.id}`);
+
+    await user.click(await screen.findByRole("button", { name: /delete/i }));
+    await user.click(within(screen.getByRole("dialog", { name: /delete this expense/i })).getByRole("button", { name: /^delete$/i }));
+
+    expect(await screen.findByText("Expense could not be deleted. Try again.")).toBeInTheDocument();
+    expect(screen.getByRole("dialog", { name: /delete this expense/i })).toBeInTheDocument();
+    expect(screen.getByText("₹125.50")).toBeInTheDocument();
+  });
+
+  it("shows not-found delete feedback without navigating away", async () => {
+    const user = userEvent.setup();
+    vi.mocked(expenseApi.deleteExpense).mockRejectedValueOnce(new Error("Expense was not found. It may have already been deleted."));
+    renderAppRoute(`/expenses/${expenseDetail.id}`);
+
+    await user.click(await screen.findByRole("button", { name: /delete/i }));
+    await user.click(within(screen.getByRole("dialog", { name: /delete this expense/i })).getByRole("button", { name: /^delete$/i }));
+
+    expect(await screen.findByText("Expense was not found. It may have already been deleted.")).toBeInTheDocument();
+    expect(screen.getByRole("heading", { name: "Expense details" })).toBeInTheDocument();
+  });
+
+  it("shows not-found detail feedback without crashing", async () => {
+    vi.mocked(expenseApi.getExpense).mockRejectedValueOnce(new Error("Expense not found."));
+
+    renderAppRoute("/expenses/20000000-0000-0000-0000-000000000999");
+
+    expect(await screen.findByText("Expense not found.")).toBeInTheDocument();
+    expect(screen.getByRole("link", { name: /back to review/i })).toHaveAttribute("href", "/review");
+  });
+
+  it("prefills edit fields and updates valid values before returning to detail", async () => {
+    const user = userEvent.setup();
+    vi.mocked(expenseApi.updateExpense).mockResolvedValueOnce({
+      ...expenseDetail,
+      amount: 200,
+      categoryId: starterCategories[1].id,
+      categoryName: "Transport",
+      expenseDate: "2026-09-17",
+      description: "Auto ride"
+    });
+    renderAppRoute(`/expenses/${expenseDetail.id}/edit`);
+
+    const amountInput = await screen.findByLabelText("Amount");
+    const dateInput = screen.getByLabelText("Date");
+    const descriptionInput = screen.getByLabelText(/description/i);
+    const foodChip = await screen.findByRole("button", { name: "Food" });
+    const transportChip = screen.getByRole("button", { name: "Transport" });
+
+    expect(amountInput).toHaveValue("125.50");
+    expect(foodChip).toHaveAttribute("aria-pressed", "true");
+    expect(dateInput).toHaveValue("2026-09-16");
+    expect(descriptionInput).toHaveValue("Lunch");
+
+    await user.clear(amountInput);
+    await user.type(amountInput, "200.00");
+    await user.click(transportChip);
+    await user.clear(dateInput);
+    await user.type(dateInput, "2026-09-17");
+    await user.clear(descriptionInput);
+    await user.type(descriptionInput, "Auto ride");
+    await user.click(screen.getByRole("button", { name: /save changes/i }));
+
+    expect(expenseApi.updateExpense).toHaveBeenCalledWith(expenseDetail.id, {
+      amount: 200,
+      categoryId: starterCategories[1].id,
+      expenseDate: "2026-09-17",
+      description: "Auto ride"
+    });
+    expect(await screen.findByText("Expense updated.")).toBeInTheDocument();
+    expect(screen.getByText("₹200.00")).toBeInTheDocument();
+    expect(screen.getByText("Transport")).toBeInTheDocument();
+    expect(screen.getByText("17 Sept 2026")).toBeInTheDocument();
+    expect(screen.getByText("Auto ride")).toBeInTheDocument();
+  });
+
+  it("does not overwrite unsaved edit values when the detail query updates", async () => {
+    const user = userEvent.setup();
+    const { queryClient } = renderAppRoute(`/expenses/${expenseDetail.id}/edit`);
+
+    const amountInput = await screen.findByLabelText("Amount");
+    await user.clear(amountInput);
+    await user.type(amountInput, "777.00");
+
+    queryClient.setQueryData(expenseApi.expenseKeys.detail(expenseDetail.id), {
+      ...expenseDetail,
+      amount: 333
+    });
+
+    expect(amountInput).toHaveValue("777.00");
+  });
+
+  it("preserves entered edit values when frontend validation fails", async () => {
+    const user = userEvent.setup();
+    renderAppRoute(`/expenses/${expenseDetail.id}/edit`);
+
+    const amountInput = await screen.findByLabelText("Amount");
+    const descriptionInput = screen.getByLabelText(/description/i);
+
+    await user.clear(amountInput);
+    await user.clear(descriptionInput);
+    await user.type(descriptionInput, "Still here");
+    await user.click(screen.getByRole("button", { name: /save changes/i }));
+
+    expect(expenseApi.updateExpense).not.toHaveBeenCalled();
+    expect(screen.getByText("Enter an amount to save this expense.")).toBeInTheDocument();
+    expect(descriptionInput).toHaveValue("Still here");
+  });
+
+  it("maps backend edit validation feedback while preserving entered values", async () => {
+    const user = userEvent.setup();
+    vi.mocked(expenseApi.updateExpense).mockRejectedValueOnce(new expenseApi.ExpenseApiError({
+      message: "One or more validation errors occurred.",
+      status: 400,
+      validationErrors: {
+        Amount: ["Enter an amount with no more than two decimal places."]
+      }
+    }));
+    renderAppRoute(`/expenses/${expenseDetail.id}/edit`);
+
+    const amountInput = await screen.findByLabelText("Amount");
+    const descriptionInput = screen.getByLabelText(/description/i);
+
+    await user.clear(amountInput);
+    await user.type(amountInput, "42.00");
+    await user.clear(descriptionInput);
+    await user.type(descriptionInput, "Snacks");
+    await user.click(screen.getByRole("button", { name: /save changes/i }));
+
+    expect(await screen.findByText("Enter an amount with no more than two decimal places.")).toBeInTheDocument();
+    expect(screen.getByText("Review the highlighted fields and try again.")).toBeInTheDocument();
+    expect(amountInput).toHaveValue("42.00");
+    expect(descriptionInput).toHaveValue("Snacks");
+  });
+
+  it("discards unsaved edit changes on cancel", async () => {
+    const user = userEvent.setup();
+    renderAppRoute(`/expenses/${expenseDetail.id}/edit`);
+
+    const amountInput = await screen.findByLabelText("Amount");
+    await user.clear(amountInput);
+    await user.type(amountInput, "999.00");
+    await user.click(screen.getByRole("link", { name: /cancel/i }));
+
+    expect(await screen.findByRole("heading", { name: "Expense details" })).toBeInTheDocument();
+    expect(screen.getByText("₹125.50")).toBeInTheDocument();
+    expect(expenseApi.updateExpense).not.toHaveBeenCalled();
+  });
+
+  it("shows concise edit category load failure feedback", async () => {
+    vi.mocked(categoryApi.getCategories).mockRejectedValueOnce(new Error("Nope"));
+
+    renderAppRoute(`/expenses/${expenseDetail.id}/edit`);
+
+    expect(await screen.findByText("Categories could not be loaded. Try refreshing before saving.")).toBeInTheDocument();
+    expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled();
+  });
+
+  it("uses backend-loaded category chips with selected state", async () => {
+    const user = userEvent.setup();
+    renderHome();
+
+    const categories = screen.getByRole("group", { name: /category/i });
+    const foodChip = await within(categories).findByRole("button", { name: "Food" });
+
+    await user.click(foodChip);
+
+    expect(categoryApi.getCategories).toHaveBeenCalledOnce();
+    expect(foodChip).toHaveAttribute("aria-pressed", "true");
+  });
+
+  it("keeps mobile reading order as add expense, current month, recent expenses", () => {
+    renderHome();
+
+    const home = screen.getByRole("main", { name: "Home" });
+    const headings = within(home).getAllByRole("heading").map((heading) => heading.textContent);
+
+    expect(headings).toEqual(["Track a new spend", "₹0", "Latest activity"]);
+  });
+
+  it("shows an inline category failure while keeping the Home shell visible", async () => {
+    vi.mocked(categoryApi.getCategories).mockRejectedValueOnce(new Error("Nope"));
+
+    renderHome();
+
+    expect(screen.getByRole("heading", { name: /track a new spend/i })).toBeInTheDocument();
+    expect(await screen.findByText("Categories could not be loaded. Try refreshing.")).toBeInTheDocument();
+  });
+
+  it("creates an expense with omitted description and resets for another entry", async () => {
+    const user = userEvent.setup();
+    renderHome();
+
+    const foodChip = await screen.findByRole("button", { name: "Food" });
+    const amountInput = screen.getByLabelText("Amount");
+    const dateInput = screen.getByLabelText("Date");
+    const descriptionInput = screen.getByLabelText(/description/i);
+
+    await user.click(foodChip);
+    await user.clear(amountInput);
+    await user.type(amountInput, "125.50");
+    await user.clear(dateInput);
+    await user.type(dateInput, "2026-09-16");
+    await user.click(screen.getByRole("button", { name: /save expense/i }));
+
+    expect(expenseApi.createExpense).toHaveBeenCalledOnce();
+    expect(vi.mocked(expenseApi.createExpense).mock.calls[0][0]).toEqual({
+      amount: 125.5,
+      categoryId: starterCategories[0].id,
+      expenseDate: "2026-09-16",
+      description: null
+    });
+    expect(await screen.findByText("Expense saved.")).toBeInTheDocument();
+    expect(amountInput).toHaveValue("");
+    expect(descriptionInput).toHaveValue("");
+    expect((dateInput as HTMLInputElement).value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
+    expect(foodChip).toHaveAttribute("aria-pressed", "false");
+  });
+
+  it("refreshes recent expenses after a successful create", async () => {
+    const user = userEvent.setup();
+    vi.mocked(expenseApi.getExpenses)
+      .mockResolvedValueOnce([])
+      .mockResolvedValueOnce([expenseRows[0]]);
+    renderHome();
+
+    expect(await screen.findByText("No expenses yet. Add your first one above.")).toBeInTheDocument();
+
+    await user.click(await screen.findByRole("button", { name: "Food" }));
+    await user.type(screen.getByLabelText("Amount"), "125.50");
+    await user.click(screen.getByRole("button", { name: /save expense/i }));
+
+    expect(await screen.findByText("Expense saved.")).toBeInTheDocument();
+    expect(await screen.findByRole("link", { name: /food/i })).toHaveTextContent("Lunch");
+    await waitFor(() => expect(expenseApi.getExpenses).toHaveBeenCalledTimes(2));
+  });
+
+  it("prevents saving with a missing amount and keeps entered values", async () => {
+    const user = userEvent.setup();
+    renderHome();
+
+    const foodChip = await screen.findByRole("button", { name: "Food" });
+    const descriptionInput = screen.getByLabelText(/description/i);
+
+    await user.click(foodChip);
+    await user.type(descriptionInput, "Lunch");
+    await user.click(screen.getByRole("button", { name: /save expense/i }));
+
+    expect(expenseApi.createExpense).not.toHaveBeenCalled();
+    expect(screen.getByText("Enter an amount to save this expense.")).toBeInTheDocument();
+    expect(descriptionInput).toHaveValue("Lunch");
+    expect(foodChip).toHaveAttribute("aria-pressed", "true");
+  });
+
+  it.each([
+    ["0", /greater than zero/i],
+    ["-1", /greater than zero/i],
+    ["abc", /numbers only/i],
+    ["12.345", /no more than two decimal places/i],
+    ["10000000000", /below ₹10,000,000,000/i]
+  ])("prevents saving invalid amount %s", async (invalidAmount, expectedMessage) => {
+    const user = userEvent.setup();
+    renderHome();
+
+    await user.click(await screen.findByRole("button", { name: "Food" }));
+    await user.type(screen.getByLabelText("Amount"), invalidAmount);
+    await user.click(screen.getByRole("button", { name: /save expense/i }));
+
+    expect(expenseApi.createExpense).not.toHaveBeenCalled();
+    expect(screen.getByText(expectedMessage)).toBeInTheDocument();
+  });
+
+  it("prevents saving with an overlong description", async () => {
+    const user = userEvent.setup();
+    renderHome();
+
+    const descriptionInput = screen.getByLabelText(/description/i);
+
+    await user.click(await screen.findByRole("button", { name: "Food" }));
+    await user.type(screen.getByLabelText("Amount"), "42.00");
+    await user.type(descriptionInput, "x".repeat(241));
+    await user.click(screen.getByRole("button", { name: /save expense/i }));
+
+    expect(expenseApi.createExpense).not.toHaveBeenCalled();
+    expect(screen.getByText("Keep description under 240 characters.")).toBeInTheDocument();
+    expect(descriptionInput).toHaveValue("x".repeat(241));
+  });
+
+  it("prevents saving without a selected category", async () => {
+    const user = userEvent.setup();
+    renderHome();
+
+    const amountInput = screen.getByLabelText("Amount");
+    await user.type(amountInput, "42.00");
+    await user.click(screen.getByRole("button", { name: /save expense/i }));
+
+    expect(expenseApi.createExpense).not.toHaveBeenCalled();
+    expect(screen.getByText("Choose a category to save this expense.")).toBeInTheDocument();
+    expect(amountInput).toHaveValue("42.00");
+  });
+
+  it("prevents saving with an invalid date", async () => {
+    const user = userEvent.setup();
+    renderHome();
+
+    await user.click(await screen.findByRole("button", { name: "Food" }));
+    await user.type(screen.getByLabelText("Amount"), "42.00");
+    await user.clear(screen.getByLabelText("Date"));
+    await user.click(screen.getByRole("button", { name: /save expense/i }));
+
+    expect(expenseApi.createExpense).not.toHaveBeenCalled();
+    expect(screen.getByText("Enter a valid date in YYYY-MM-DD format.")).toBeInTheDocument();
+  });
+
+  it("clears stale field errors when the related input is corrected", async () => {
+    const user = userEvent.setup();
+    renderHome();
+
+    const foodChip = await screen.findByRole("button", { name: "Food" });
+    const amountInput = screen.getByLabelText("Amount");
+
+    await user.click(foodChip);
+    await user.click(screen.getByRole("button", { name: /save expense/i }));
+    expect(screen.getByText("Enter an amount to save this expense.")).toBeInTheDocument();
+
+    await user.type(amountInput, "42.00");
+
+    expect(screen.queryByText("Enter an amount to save this expense.")).not.toBeInTheDocument();
+    expect(amountInput).toHaveValue("42.00");
+    expect(foodChip).toHaveAttribute("aria-pressed", "true");
+  });
+
+  it("maps backend validation feedback while preserving form data", async () => {
+    const user = userEvent.setup();
+    vi.mocked(expenseApi.createExpense).mockRejectedValueOnce(new expenseApi.ExpenseApiError({
+      message: "One or more validation errors occurred.",
+      status: 400,
+      validationErrors: {
+        Amount: ["Enter an amount with no more than two decimal places."]
+      }
+    }));
+    renderHome();
+
+    const foodChip = await screen.findByRole("button", { name: "Food" });
+    const amountInput = screen.getByLabelText("Amount");
+    const descriptionInput = screen.getByLabelText(/description/i);
+
+    await user.click(foodChip);
+    await user.type(amountInput, "42.00");
+    await user.type(descriptionInput, "Snacks");
+    await user.click(screen.getByRole("button", { name: /save expense/i }));
+
+    expect(await screen.findByText("Enter an amount with no more than two decimal places.")).toBeInTheDocument();
+    expect(screen.getByText("Review the highlighted fields and try again.")).toBeInTheDocument();
+    expect(amountInput).toHaveValue("42.00");
+    expect(descriptionInput).toHaveValue("Snacks");
+    expect(foodChip).toHaveAttribute("aria-pressed", "true");
+    expect(screen.queryByText("Expense saved.")).not.toBeInTheDocument();
+  });
+
+  it("maps backend category validation feedback while preserving form data", async () => {
+    const user = userEvent.setup();
+    vi.mocked(expenseApi.createExpense).mockRejectedValueOnce(new expenseApi.ExpenseApiError({
+      message: "One or more validation errors occurred.",
+      status: 400,
+      validationErrors: {
+        CategoryId: ["Choose an existing category."]
+      }
+    }));
+    renderHome();
+
+    const foodChip = await screen.findByRole("button", { name: "Food" });
+    const amountInput = screen.getByLabelText("Amount");
+    const descriptionInput = screen.getByLabelText(/description/i);
+
+    await user.click(foodChip);
+    await user.type(amountInput, "42.00");
+    await user.type(descriptionInput, "Snacks");
+    await user.click(screen.getByRole("button", { name: /save expense/i }));
+
+    expect(await screen.findByText("Choose an existing category.")).toBeInTheDocument();
+    expect(screen.getByText("Review the highlighted fields and try again.")).toBeInTheDocument();
+    expect(amountInput).toHaveValue("42.00");
+    expect(descriptionInput).toHaveValue("Snacks");
+    expect(foodChip).toHaveAttribute("aria-pressed", "true");
+  });
+
+  it("maps backend date and description validation feedback while preserving form data", async () => {
+    const user = userEvent.setup();
+    vi.mocked(expenseApi.createExpense).mockRejectedValueOnce(new expenseApi.ExpenseApiError({
+      message: "One or more validation errors occurred.",
+      status: 400,
+      validationErrors: {
+        ExpenseDate: ["Choose a date."],
+        Description: ["Keep description under 240 characters."]
+      }
+    }));
+    renderHome();
+
+    const foodChip = await screen.findByRole("button", { name: "Food" });
+    const amountInput = screen.getByLabelText("Amount");
+    const dateInput = screen.getByLabelText("Date");
+    const descriptionInput = screen.getByLabelText(/description/i);
+
+    await user.click(foodChip);
+    await user.type(amountInput, "42.00");
+    await user.clear(dateInput);
+    await user.type(dateInput, "2026-09-16");
+    await user.type(descriptionInput, "Snacks");
+    await user.click(screen.getByRole("button", { name: /save expense/i }));
+
+    expect(await screen.findByText("Choose a date.")).toBeInTheDocument();
+    expect(screen.getByText("Keep description under 240 characters.")).toBeInTheDocument();
+    expect(screen.getByText("Review the highlighted fields and try again.")).toBeInTheDocument();
+    expect(amountInput).toHaveValue("42.00");
+    expect(dateInput).toHaveValue("2026-09-16");
+    expect(descriptionInput).toHaveValue("Snacks");
+    expect(foodChip).toHaveAttribute("aria-pressed", "true");
+  });
+
+  it("shows operation failure feedback while preserving form data", async () => {
+    const user = userEvent.setup();
+    vi.mocked(expenseApi.createExpense).mockRejectedValueOnce(new Error("Network down"));
+    renderHome();
+
+    const foodChip = await screen.findByRole("button", { name: "Food" });
+    const amountInput = screen.getByLabelText("Amount");
+    const descriptionInput = screen.getByLabelText(/description/i);
+
+    await user.click(foodChip);
+    await user.type(amountInput, "42.00");
+    await user.type(descriptionInput, "Snacks");
+    await user.click(screen.getByRole("button", { name: /save expense/i }));
+
+    await waitFor(() => expect(expenseApi.createExpense).toHaveBeenCalledOnce());
+    expect(await screen.findByText("Expense could not be saved. Check the details and try again.")).toBeInTheDocument();
+    expect(amountInput).toHaveValue("42.00");
+    expect(descriptionInput).toHaveValue("Snacks");
+    expect(foodChip).toHaveAttribute("aria-pressed", "true");
+    expect(screen.queryByText("Expense saved.")).not.toBeInTheDocument();
+  });
+
+  it("clears stale success feedback when a later save fails", async () => {
+    const user = userEvent.setup();
+    renderHome();
+
+    const foodChip = await screen.findByRole("button", { name: "Food" });
+    const amountInput = screen.getByLabelText("Amount");
+    const descriptionInput = screen.getByLabelText(/description/i);
+
+    await user.click(foodChip);
+    await user.type(amountInput, "42.00");
+    await user.click(screen.getByRole("button", { name: /save expense/i }));
+    expect(await screen.findByText("Expense saved.")).toBeInTheDocument();
+
+    vi.mocked(expenseApi.createExpense).mockRejectedValueOnce(new Error("Network down"));
+    await user.click(foodChip);
+    await user.type(amountInput, "55.00");
+    await user.type(descriptionInput, "Retry");
+    await user.click(screen.getByRole("button", { name: /save expense/i }));
+
+    expect(await screen.findByText("Expense could not be saved. Check the details and try again.")).toBeInTheDocument();
+    expect(screen.queryByText("Expense saved.")).not.toBeInTheDocument();
+    expect(amountInput).toHaveValue("55.00");
+    expect(descriptionInput).toHaveValue("Retry");
+    expect(foodChip).toHaveAttribute("aria-pressed", "true");
+  });
+});
diff --git a/frontend/src/app/App.tsx b/frontend/src/app/App.tsx
new file mode 100644
index 0000000..f3f7573
--- /dev/null
+++ b/frontend/src/app/App.tsx
@@ -0,0 +1,42 @@
+import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
+import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
+import { AppNavigation } from "./navigation";
+import { HomePage } from "./HomePage";
+import { PlaceholderPage } from "./PlaceholderPage";
+import { ReviewPage } from "./ReviewPage";
+import { ExpenseDetailPage } from "../features/expenses/ExpenseDetailPage";
+import { ExpenseEditPage } from "../features/expenses/ExpenseEditPage";
+
+const queryClient = new QueryClient({
+  defaultOptions: {
+    queries: {
+      retry: false
+    }
+  }
+});
+
+export function App() {
+  return (
+    <QueryClientProvider client={queryClient}>
+      <BrowserRouter>
+        <div className="app-shell">
+          <header className="app-header">
+            <div className="brand-mark">
+              <span>₹</span>
+              <strong>Expense Tracker</strong>
+            </div>
+            <AppNavigation />
+          </header>
+          <Routes>
+            <Route element={<HomePage />} path="/" />
+            <Route element={<ReviewPage />} path="/review" />
+            <Route element={<ExpenseDetailPage />} path="/expenses/:expenseId" />
+            <Route element={<ExpenseEditPage />} path="/expenses/:expenseId/edit" />
+            <Route element={<PlaceholderPage title="Categories" />} path="/categories" />
+            <Route element={<Navigate replace to="/" />} path="*" />
+          </Routes>
+        </div>
+      </BrowserRouter>
+    </QueryClientProvider>
+  );
+}
diff --git a/frontend/src/app/HomePage.tsx b/frontend/src/app/HomePage.tsx
new file mode 100644
index 0000000..7f61602
--- /dev/null
+++ b/frontend/src/app/HomePage.tsx
@@ -0,0 +1,16 @@
+import { AddExpensePanel } from "../features/expenses/AddExpensePanel";
+import { CurrentMonthSummary } from "../features/expenses/CurrentMonthSummary";
+import { RecentExpenses } from "../features/expenses/RecentExpenses";
+
+export function HomePage() {
+  return (
+    <main className="home-layout" aria-label="Home">
+      <div className="home-main-column">
+        <AddExpensePanel />
+        <CurrentMonthSummary />
+      </div>
+      <RecentExpenses />
+    </main>
+  );
+}
+
diff --git a/frontend/src/app/PlaceholderPage.tsx b/frontend/src/app/PlaceholderPage.tsx
new file mode 100644
index 0000000..257bcf1
--- /dev/null
+++ b/frontend/src/app/PlaceholderPage.tsx
@@ -0,0 +1,12 @@
+type PlaceholderPageProps = {
+  title: string;
+};
+
+export function PlaceholderPage({ title }: PlaceholderPageProps) {
+  return (
+    <main className="placeholder-page" aria-labelledby="placeholder-title">
+      <h1 id="placeholder-title">{title}</h1>
+    </main>
+  );
+}
+
diff --git a/frontend/src/app/navigation.tsx b/frontend/src/app/navigation.tsx
new file mode 100644
index 0000000..90268fc
--- /dev/null
+++ b/frontend/src/app/navigation.tsx
@@ -0,0 +1,26 @@
+import { Home, ListChecks, Tags } from "lucide-react";
+import { NavLink } from "react-router-dom";
+
+const navItems = [
+  { to: "/", label: "Home", icon: Home },
+  { to: "/review", label: "Review", icon: ListChecks },
+  { to: "/categories", label: "Categories", icon: Tags }
+];
+
+export function AppNavigation() {
+  return (
+    <nav className="app-nav" aria-label="Primary navigation">
+      {navItems.map((item) => {
+        const Icon = item.icon;
+
+        return (
+          <NavLink className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} end={item.to === "/"} key={item.to} to={item.to}>
+            <Icon aria-hidden="true" size={18} />
+            <span>{item.label}</span>
+          </NavLink>
+        );
+      })}
+    </nav>
+  );
+}
+
diff --git a/frontend/src/app/styles.css b/frontend/src/app/styles.css
new file mode 100644
index 0000000..5240df7
--- /dev/null
+++ b/frontend/src/app/styles.css
@@ -0,0 +1,529 @@
+:root {
+  color: #24313a;
+  background: #faf7f1;
+  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
+  font-synthesis: none;
+  line-height: 1.5;
+  text-rendering: optimizeLegibility;
+}
+
+* {
+  box-sizing: border-box;
+}
+
+body {
+  margin: 0;
+  min-width: 320px;
+  min-height: 100vh;
+  background: #faf7f1;
+}
+
+button,
+input {
+  font: inherit;
+}
+
+.app-shell {
+  min-height: 100vh;
+  padding: 16px 16px 88px;
+}
+
+.app-header {
+  align-items: center;
+  display: flex;
+  justify-content: space-between;
+  margin: 0 auto 20px;
+  max-width: 1120px;
+}
+
+.brand-mark {
+  align-items: center;
+  color: #18252d;
+  display: flex;
+  gap: 10px;
+}
+
+.brand-mark span {
+  align-items: center;
+  background: #0f766e;
+  border-radius: 8px;
+  color: #ffffff;
+  display: inline-flex;
+  font-weight: 800;
+  height: 34px;
+  justify-content: center;
+  width: 34px;
+}
+
+.app-nav {
+  align-items: center;
+  background: #ffffff;
+  border: 1px solid #eadfd1;
+  border-radius: 8px;
+  box-shadow: 0 10px 24px rgb(47 39 29 / 0.08);
+  display: flex;
+  gap: 4px;
+  padding: 4px;
+}
+
+.nav-link {
+  align-items: center;
+  border-radius: 6px;
+  color: #5f6d74;
+  display: inline-flex;
+  gap: 8px;
+  min-height: 42px;
+  padding: 0 12px;
+  text-decoration: none;
+}
+
+.nav-link.active {
+  background: #e6f4f2;
+  color: #0f766e;
+}
+
+.home-layout {
+  display: grid;
+  gap: 20px;
+  grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.65fr);
+  margin: 0 auto;
+  max-width: 1120px;
+}
+
+.home-main-column {
+  display: flex;
+  flex-direction: column;
+  gap: 20px;
+}
+
+.surface {
+  background: #ffffff;
+  border: 1px solid #eadfd1;
+  border-radius: 8px;
+  box-shadow: 0 12px 30px rgb(47 39 29 / 0.08);
+  padding: 22px;
+}
+
+.section-heading {
+  margin-bottom: 18px;
+}
+
+.section-heading.compact {
+  margin-bottom: 10px;
+}
+
+.eyebrow {
+  color: #0f766e;
+  font-size: 0.78rem;
+  font-weight: 800;
+  margin: 0 0 4px;
+  text-transform: uppercase;
+}
+
+h1,
+h2 {
+  color: #18252d;
+  line-height: 1.16;
+  margin: 0;
+}
+
+h1 {
+  font-size: 1.65rem;
+}
+
+h2 {
+  font-size: 1.35rem;
+}
+
+.expense-form {
+  display: grid;
+  gap: 16px;
+}
+
+.field {
+  color: #3c4a52;
+  display: grid;
+  font-weight: 700;
+  gap: 8px;
+}
+
+.field input {
+  background: #fffdf9;
+  border: 1px solid #d8cbbb;
+  border-radius: 8px;
+  color: #18252d;
+  min-height: 46px;
+  padding: 0 12px;
+  width: 100%;
+}
+
+.amount-field input {
+  font-size: 1.35rem;
+  font-weight: 800;
+}
+
+.currency-input,
+.date-input {
+  align-items: center;
+  background: #fffdf9;
+  border: 1px solid #d8cbbb;
+  border-radius: 8px;
+  display: flex;
+  gap: 8px;
+  padding-left: 12px;
+}
+
+.currency-input input,
+.date-input input {
+  border: 0;
+}
+
+.field input.invalid-control,
+.currency-input:has(.invalid-control),
+.date-input:has(.invalid-control) {
+  border-color: #b42318;
+  box-shadow: 0 0 0 2px rgb(180 35 24 / 0.12);
+}
+
+.field-error {
+  color: #b42318;
+  font-size: 0.9rem;
+  font-weight: 700;
+}
+
+.category-field {
+  border: 0;
+  margin: 0;
+  min-width: 0;
+  padding: 0;
+}
+
+.category-field legend {
+  color: #3c4a52;
+  font-weight: 800;
+  margin-bottom: 8px;
+}
+
+.chip-list {
+  display: flex;
+  flex-wrap: wrap;
+  gap: 8px;
+}
+
+.category-chip {
+  background: #fffdf9;
+  border: 1px solid #d8cbbb;
+  border-radius: 999px;
+  color: #34434b;
+  cursor: pointer;
+  min-height: 40px;
+  padding: 0 14px;
+}
+
+.category-chip.selected {
+  background: #0f766e;
+  border-color: #0f766e;
+  color: #ffffff;
+  font-weight: 800;
+  outline: 2px solid #8dd7ce;
+  outline-offset: 2px;
+}
+
+.button {
+  align-items: center;
+  border: 0;
+  border-radius: 8px;
+  display: inline-flex;
+  font-weight: 800;
+  justify-content: center;
+  min-height: 46px;
+  padding: 0 16px;
+}
+
+.button-primary {
+  background: #0f766e;
+  color: #ffffff;
+}
+
+.button-ghost {
+  background: #ffffff;
+  border: 1px solid #d8cbbb;
+  color: #34434b;
+}
+
+.button-link {
+  gap: 8px;
+  text-decoration: none;
+}
+
+.danger-action {
+  background: #fff4f2;
+  border: 1px solid #f0b8ae;
+  color: #b42318;
+  gap: 8px;
+}
+
+.danger-action-solid {
+  background: #b42318;
+  color: #ffffff;
+}
+
+.button:disabled {
+  background: #c9d6d3;
+  color: #ffffff;
+  cursor: not-allowed;
+}
+
+.muted,
+.supporting-copy,
+.empty-state,
+.inline-note {
+  color: #66747b;
+  font-weight: 500;
+}
+
+.supporting-copy,
+.empty-state,
+.inline-note,
+.inline-success,
+.inline-error {
+  margin: 0;
+}
+
+.inline-success {
+  color: #0f766e;
+  font-weight: 800;
+}
+
+.inline-error {
+  color: #b42318;
+  font-weight: 700;
+}
+
+.recent-expenses {
+  min-height: 240px;
+}
+
+.expense-list {
+  display: grid;
+  gap: 10px;
+  list-style: none;
+  margin: 0;
+  padding: 0;
+}
+
+.expense-row {
+  background: #fffdf9;
+  border: 1px solid #eadfd1;
+  border-radius: 8px;
+  color: #24313a;
+  display: grid;
+  gap: 6px;
+  min-height: 76px;
+  padding: 12px;
+  text-decoration: none;
+}
+
+.expense-row:hover,
+.expense-row:focus-visible {
+  border-color: #0f766e;
+  box-shadow: 0 0 0 3px rgb(15 118 110 / 0.14);
+  outline: 0;
+}
+
+.expense-row-main,
+.expense-row-meta {
+  align-items: baseline;
+  display: flex;
+  gap: 10px;
+  justify-content: space-between;
+}
+
+.expense-amount {
+  color: #18252d;
+  font-size: 1.05rem;
+  font-weight: 900;
+}
+
+.expense-category {
+  color: #0f766e;
+  font-weight: 800;
+}
+
+.expense-row-meta {
+  color: #66747b;
+  font-size: 0.92rem;
+  font-weight: 600;
+}
+
+.review-page {
+  margin: 0 auto;
+  max-width: 760px;
+}
+
+.detail-page {
+  margin: 0 auto;
+  max-width: 760px;
+}
+
+.detail-surface {
+  display: grid;
+  gap: 18px;
+}
+
+.detail-heading {
+  align-items: flex-start;
+  display: flex;
+  gap: 16px;
+  justify-content: space-between;
+  margin-bottom: 0;
+}
+
+.detail-message {
+  background: #e6f4f2;
+  border: 1px solid #b9e2dc;
+  border-radius: 8px;
+  padding: 10px 12px;
+}
+
+.review-message {
+  margin-bottom: 14px;
+}
+
+.detail-list {
+  display: grid;
+  gap: 12px;
+  margin: 0;
+}
+
+.detail-list div {
+  background: #fffdf9;
+  border: 1px solid #eadfd1;
+  border-radius: 8px;
+  display: grid;
+  gap: 4px;
+  padding: 12px;
+}
+
+.detail-list dt {
+  color: #66747b;
+  font-size: 0.82rem;
+  font-weight: 800;
+  margin: 0;
+  text-transform: uppercase;
+}
+
+.detail-list dd {
+  color: #18252d;
+  font-weight: 800;
+  margin: 0;
+}
+
+.detail-amount {
+  font-size: 1.35rem;
+}
+
+.detail-actions,
+.form-actions {
+  display: flex;
+  flex-wrap: wrap;
+  gap: 10px;
+}
+
+.dialog-backdrop {
+  align-items: center;
+  background: rgb(24 37 45 / 0.42);
+  display: flex;
+  inset: 0;
+  justify-content: center;
+  padding: 16px;
+  position: fixed;
+  z-index: 20;
+}
+
+.confirm-dialog {
+  background: #ffffff;
+  border: 1px solid #eadfd1;
+  border-radius: 8px;
+  box-shadow: 0 22px 60px rgb(24 37 45 / 0.24);
+  display: grid;
+  gap: 18px;
+  max-width: 420px;
+  padding: 22px;
+  width: min(100%, 420px);
+}
+
+.dialog-actions {
+  display: flex;
+  flex-wrap: wrap;
+  gap: 10px;
+  justify-content: flex-end;
+}
+
+.empty-review {
+  display: grid;
+  gap: 10px;
+}
+
+.text-link {
+  color: #0f766e;
+  font-weight: 800;
+}
+
+.placeholder-page {
+  margin: 0 auto;
+  max-width: 1120px;
+}
+
+@media (max-width: 760px) {
+  .app-shell {
+    padding: 14px 12px 92px;
+  }
+
+  .app-header {
+    align-items: flex-start;
+    margin-bottom: 14px;
+  }
+
+  .brand-mark strong {
+    display: none;
+  }
+
+  .app-nav {
+    bottom: 12px;
+    left: 12px;
+    position: fixed;
+    right: 12px;
+    z-index: 10;
+  }
+
+  .nav-link {
+    flex: 1;
+    justify-content: center;
+    padding: 0 8px;
+  }
+
+  .home-layout {
+    display: flex;
+    flex-direction: column;
+  }
+
+  .surface {
+    padding: 18px;
+  }
+
+  .detail-heading {
+    display: grid;
+  }
+
+  .expense-row-main,
+  .expense-row-meta {
+    align-items: flex-start;
+    flex-direction: column;
+    gap: 2px;
+  }
+
+  h1 {
+    font-size: 1.42rem;
+  }
+}
diff --git a/frontend/src/features/categories/useCategories.ts b/frontend/src/features/categories/useCategories.ts
new file mode 100644
index 0000000..2543661
--- /dev/null
+++ b/frontend/src/features/categories/useCategories.ts
@@ -0,0 +1,10 @@
+import { useQuery } from "@tanstack/react-query";
+import { getCategories } from "../../shared/api/categories";
+
+export function useCategories() {
+  return useQuery({
+    queryKey: ["categories"],
+    queryFn: getCategories
+  });
+}
+
diff --git a/frontend/src/features/expenses/AddExpensePanel.tsx b/frontend/src/features/expenses/AddExpensePanel.tsx
new file mode 100644
index 0000000..32e48b8
--- /dev/null
+++ b/frontend/src/features/expenses/AddExpensePanel.tsx
@@ -0,0 +1,196 @@
+import { Calendar, IndianRupee } from "lucide-react";
+import { FormEvent, useId, useMemo, useState } from "react";
+import { useCategories } from "../categories/useCategories";
+import { applyExpenseServerError, FieldErrors, validateExpenseForm } from "./expenseFormValidation";
+import { useCreateExpense } from "./useCreateExpense";
+import { Button } from "../../shared/ui/Button";
+import { Surface } from "../../shared/ui/Surface";
+
+function todayInKolkata() {
+  const formatter = new Intl.DateTimeFormat("en-CA", {
+    timeZone: "Asia/Kolkata",
+    year: "numeric",
+    month: "2-digit",
+    day: "2-digit"
+  });
+
+  const parts = formatter.formatToParts(new Date());
+  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
+
+  return `${values.year}-${values.month}-${values.day}`;
+}
+
+export function AddExpensePanel() {
+  const titleId = useId();
+  const amountId = useId();
+  const dateId = useId();
+  const descriptionId = useId();
+  const amountErrorId = useId();
+  const categoryErrorId = useId();
+  const dateErrorId = useId();
+  const descriptionErrorId = useId();
+  const formErrorId = useId();
+  const { data: categories = [], isError, isLoading } = useCategories();
+  const createExpense = useCreateExpense();
+  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
+  const initialDate = useMemo(() => todayInKolkata(), []);
+  const [amount, setAmount] = useState("");
+  const [expenseDate, setExpenseDate] = useState(initialDate);
+  const [description, setDescription] = useState("");
+  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
+  const [formError, setFormError] = useState("");
+  const [successMessage, setSuccessMessage] = useState("");
+
+  function handleSubmit(event: FormEvent<HTMLFormElement>) {
+    event.preventDefault();
+    setSuccessMessage("");
+    setFormError("");
+
+    const validation = validateExpenseForm(amount, selectedCategoryId, expenseDate, description);
+    setFieldErrors(validation.fieldErrors);
+
+    if (!validation.isValid) {
+      return;
+    }
+
+    createExpense.mutate(
+      {
+        amount: validation.amount,
+        categoryId: selectedCategoryId!,
+        expenseDate,
+        description: description.trim() ? description.trim() : null
+      },
+      {
+        onSuccess: () => {
+          setAmount("");
+          setExpenseDate(todayInKolkata());
+          setDescription("");
+          setSelectedCategoryId(null);
+          setFieldErrors({});
+          setFormError("");
+          setSuccessMessage("Expense saved.");
+        },
+        onError: (error) => {
+          setSuccessMessage("");
+          applyExpenseServerError(error, setFieldErrors, setFormError);
+        }
+      }
+    );
+  }
+
+  return (
+    <Surface className="add-expense" aria-labelledby={titleId}>
+      <div className="section-heading">
+        <p className="eyebrow">Add Expense</p>
+        <h1 id={titleId}>Track a new spend</h1>
+      </div>
+
+      <form className="expense-form" aria-label="Add expense form" onSubmit={handleSubmit}>
+        <label className="field amount-field" htmlFor={amountId}>
+          <span>Amount</span>
+          <span className="currency-input">
+            <IndianRupee aria-hidden="true" size={18} />
+            <input
+              id={amountId}
+              inputMode="decimal"
+              aria-describedby={fieldErrors.amount ? amountErrorId : undefined}
+              aria-invalid={fieldErrors.amount ? "true" : "false"}
+              className={fieldErrors.amount ? "invalid-control" : undefined}
+              onChange={(event) => {
+                setAmount(event.target.value);
+                setFieldErrors((current) => ({ ...current, amount: undefined }));
+                setSuccessMessage("");
+                setFormError("");
+              }}
+              type="text"
+              placeholder="0.00"
+              value={amount}
+            />
+          </span>
+          {fieldErrors.amount ? <span className="field-error" id={amountErrorId}>{fieldErrors.amount}</span> : null}
+        </label>
+
+        <fieldset
+          aria-describedby={fieldErrors.category ? categoryErrorId : undefined}
+          className="category-field"
+        >
+          <legend>Category</legend>
+          {isLoading ? <p className="inline-note">Loading categories...</p> : null}
+          {isError ? <p className="inline-error">Categories could not be loaded. Try refreshing.</p> : null}
+          <div className="chip-list" aria-label="Expense categories">
+            {categories.map((category) => {
+              const isSelected = category.id === selectedCategoryId;
+
+              return (
+                <button
+                  aria-pressed={isSelected}
+                  className={`category-chip ${isSelected ? "selected" : ""}`}
+                  key={category.id}
+                  onClick={() => {
+                    setSelectedCategoryId(category.id);
+                    setFieldErrors((current) => ({ ...current, category: undefined }));
+                    setSuccessMessage("");
+                    setFormError("");
+                  }}
+                  type="button"
+                >
+                  {category.name}
+                </button>
+              );
+            })}
+          </div>
+          {fieldErrors.category ? <p className="field-error" id={categoryErrorId}>{fieldErrors.category}</p> : null}
+        </fieldset>
+
+        <label className="field" htmlFor={dateId}>
+          <span>Date</span>
+          <span className="date-input">
+            <Calendar aria-hidden="true" size={18} />
+            <input
+              id={dateId}
+              aria-describedby={fieldErrors.date ? dateErrorId : undefined}
+              aria-invalid={fieldErrors.date ? "true" : "false"}
+              className={fieldErrors.date ? "invalid-control" : undefined}
+              onChange={(event) => {
+                setExpenseDate(event.target.value);
+                setFieldErrors((current) => ({ ...current, date: undefined }));
+                setSuccessMessage("");
+                setFormError("");
+              }}
+              type="date"
+              value={expenseDate}
+            />
+          </span>
+          {fieldErrors.date ? <span className="field-error" id={dateErrorId}>{fieldErrors.date}</span> : null}
+        </label>
+
+        <label className="field" htmlFor={descriptionId}>
+          <span>Description <span className="muted">(optional)</span></span>
+          <input
+            id={descriptionId}
+            aria-describedby={fieldErrors.description ? descriptionErrorId : undefined}
+            aria-invalid={fieldErrors.description ? "true" : "false"}
+            className={fieldErrors.description ? "invalid-control" : undefined}
+            onChange={(event) => {
+              setDescription(event.target.value);
+              setFieldErrors((current) => ({ ...current, description: undefined }));
+              setSuccessMessage("");
+              setFormError("");
+            }}
+            type="text"
+            placeholder="A short note"
+            value={description}
+          />
+          {fieldErrors.description ? <span className="field-error" id={descriptionErrorId}>{fieldErrors.description}</span> : null}
+        </label>
+
+        {successMessage ? <p className="inline-success" role="status">{successMessage}</p> : null}
+        {formError ? <p className="inline-error" id={formErrorId} role="alert">{formError}</p> : null}
+
+        <Button aria-describedby={formError ? formErrorId : undefined} disabled={createExpense.isPending} type="submit">
+          {createExpense.isPending ? "Saving..." : "Save expense"}
+        </Button>
+      </form>
+    </Surface>
+  );
+}
diff --git a/frontend/src/features/expenses/CurrentMonthSummary.tsx b/frontend/src/features/expenses/CurrentMonthSummary.tsx
new file mode 100644
index 0000000..c4e7358
--- /dev/null
+++ b/frontend/src/features/expenses/CurrentMonthSummary.tsx
@@ -0,0 +1,14 @@
+import { Surface } from "../../shared/ui/Surface";
+
+export function CurrentMonthSummary() {
+  return (
+    <Surface className="summary-panel" aria-labelledby="current-month-heading">
+      <div className="section-heading compact">
+        <p className="eyebrow">Current Month</p>
+        <h2 id="current-month-heading">₹0</h2>
+      </div>
+      <p className="supporting-copy">No spending recorded yet this month.</p>
+    </Surface>
+  );
+}
+
diff --git a/frontend/src/features/expenses/RecentExpenses.tsx b/frontend/src/features/expenses/RecentExpenses.tsx
new file mode 100644
index 0000000..827c53b
--- /dev/null
+++ b/frontend/src/features/expenses/RecentExpenses.tsx
@@ -0,0 +1,31 @@
+import { useQuery } from "@tanstack/react-query";
+import { expenseKeys, getExpenses } from "../../shared/api/expenses";
+import { Surface } from "../../shared/ui/Surface";
+import { ExpenseList } from "./ExpenseList";
+
+export function RecentExpenses() {
+  const expensesQuery = useQuery({
+    queryKey: expenseKeys.lists(),
+    queryFn: getExpenses
+  });
+
+  const recentExpenses = expensesQuery.data?.slice(0, 5) ?? [];
+
+  return (
+    <Surface className="recent-expenses" aria-labelledby="recent-expenses-heading">
+      <div className="section-heading compact">
+        <p className="eyebrow">Recent Expenses</p>
+        <h2 id="recent-expenses-heading">Latest activity</h2>
+      </div>
+      {expensesQuery.isLoading ? (
+        <p className="inline-note">Loading expenses...</p>
+      ) : expensesQuery.isError ? (
+        <p className="inline-error" role="alert">Recent expenses could not be loaded. Try refreshing.</p>
+      ) : recentExpenses.length > 0 ? (
+        <ExpenseList expenses={recentExpenses} ariaLabel="Recent expenses" />
+      ) : (
+        <p className="empty-state">No expenses yet. Add your first one above.</p>
+      )}
+    </Surface>
+  );
+}
diff --git a/frontend/src/features/expenses/useCreateExpense.ts b/frontend/src/features/expenses/useCreateExpense.ts
new file mode 100644
index 0000000..fb19734
--- /dev/null
+++ b/frontend/src/features/expenses/useCreateExpense.ts
@@ -0,0 +1,15 @@
+import { useMutation, useQueryClient } from "@tanstack/react-query";
+import { createExpense, expenseKeys } from "../../shared/api/expenses";
+
+export function useCreateExpense() {
+  const queryClient = useQueryClient();
+
+  return useMutation({
+    mutationFn: createExpense,
+    onSuccess: () => {
+      void queryClient.invalidateQueries({ queryKey: expenseKeys.all });
+      void queryClient.invalidateQueries({ queryKey: ["categories"] });
+      void queryClient.invalidateQueries({ queryKey: ["current-month-summary"] });
+    }
+  });
+}
diff --git a/frontend/src/main.tsx b/frontend/src/main.tsx
new file mode 100644
index 0000000..2691b52
--- /dev/null
+++ b/frontend/src/main.tsx
@@ -0,0 +1,11 @@
+import { StrictMode } from "react";
+import { createRoot } from "react-dom/client";
+import { App } from "./app/App";
+import "./app/styles.css";
+
+createRoot(document.getElementById("root")!).render(
+  <StrictMode>
+    <App />
+  </StrictMode>
+);
+
diff --git a/frontend/src/shared/api/categories.ts b/frontend/src/shared/api/categories.ts
new file mode 100644
index 0000000..9f5b1c5
--- /dev/null
+++ b/frontend/src/shared/api/categories.ts
@@ -0,0 +1,19 @@
+export type CategoryDto = {
+  id: string;
+  name: string;
+  isDefault: boolean;
+  isProtected: boolean;
+};
+
+const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";
+
+export async function getCategories(): Promise<CategoryDto[]> {
+  const response = await fetch(`${apiBaseUrl}/api/categories`);
+
+  if (!response.ok) {
+    throw new Error("Categories could not be loaded.");
+  }
+
+  return response.json() as Promise<CategoryDto[]>;
+}
+
diff --git a/frontend/src/shared/api/expenses.ts b/frontend/src/shared/api/expenses.ts
new file mode 100644
index 0000000..3081f03
--- /dev/null
+++ b/frontend/src/shared/api/expenses.ts
@@ -0,0 +1,178 @@
+export type CreateExpenseRequest = {
+  amount: number;
+  categoryId: string;
+  expenseDate: string;
+  description?: string | null;
+};
+
+export type UpdateExpenseRequest = CreateExpenseRequest;
+
+export type ExpenseDto = {
+  id: string;
+  amount: number;
+  categoryId: string;
+  expenseDate: string;
+  description: string | null;
+  createdAt: string;
+  updatedAt: string;
+};
+
+export type ExpenseListItemDto = {
+  id: string;
+  amount: number;
+  categoryId: string;
+  categoryName: string;
+  expenseDate: string;
+  description: string | null;
+  createdAt: string;
+};
+
+export type ExpenseDetailDto = ExpenseDto & {
+  categoryName: string;
+};
+
+export type ExpenseApiErrorDetails = {
+  message: string;
+  status?: number;
+  validationErrors: Record<string, string[]>;
+};
+
+export class ExpenseApiError extends Error {
+  status?: number;
+  validationErrors: Record<string, string[]>;
+
+  constructor(details: ExpenseApiErrorDetails) {
+    super(details.message);
+    this.name = "ExpenseApiError";
+    this.status = details.status;
+    this.validationErrors = details.validationErrors;
+  }
+}
+
+const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";
+
+export const expenseKeys = {
+  all: ["expenses"] as const,
+  lists: () => [...expenseKeys.all, "list"] as const,
+  detail: (id: string) => [...expenseKeys.all, "detail", id] as const
+};
+
+export async function getExpenses(): Promise<ExpenseListItemDto[]> {
+  const response = await fetch(`${apiBaseUrl}/api/expenses`);
+
+  if (!response.ok) {
+    throw new Error("Expenses could not be loaded. Try refreshing.");
+  }
+
+  return response.json() as Promise<ExpenseListItemDto[]>;
+}
+
+export async function getExpense(id: string): Promise<ExpenseDetailDto> {
+  const response = await fetch(`${apiBaseUrl}/api/expenses/${id}`);
+
+  if (response.status === 404) {
+    throw new Error("Expense not found.");
+  }
+
+  if (!response.ok) {
+    throw new Error("Expense could not be loaded. Try refreshing.");
+  }
+
+  return response.json() as Promise<ExpenseDetailDto>;
+}
+
+export async function createExpense(request: CreateExpenseRequest): Promise<ExpenseDto> {
+  const response = await fetch(`${apiBaseUrl}/api/expenses`, {
+    method: "POST",
+    headers: {
+      "Content-Type": "application/json"
+    },
+    body: JSON.stringify(request)
+  });
+
+  if (!response.ok) {
+    throw await createExpenseApiError(response);
+  }
+
+  return response.json() as Promise<ExpenseDto>;
+}
+
+export async function updateExpense(id: string, request: UpdateExpenseRequest): Promise<ExpenseDetailDto> {
+  const response = await fetch(`${apiBaseUrl}/api/expenses/${id}`, {
+    method: "PUT",
+    headers: {
+      "Content-Type": "application/json"
+    },
+    body: JSON.stringify(request)
+  });
+
+  if (!response.ok) {
+    throw await createExpenseApiError(response);
+  }
+
+  return response.json() as Promise<ExpenseDetailDto>;
+}
+
+export async function deleteExpense(id: string): Promise<void> {
+  const response = await fetch(`${apiBaseUrl}/api/expenses/${id}`, {
+    method: "DELETE"
+  });
+
+  if (response.status === 404) {
+    throw new ExpenseApiError({
+      message: "Expense was not found. It may have already been deleted.",
+      status: response.status,
+      validationErrors: {}
+    });
+  }
+
+  if (!response.ok) {
+    throw new ExpenseApiError({
+      message: "Expense could not be deleted. Try again.",
+      status: response.status,
+      validationErrors: {}
+    });
+  }
+}
+
+async function createExpenseApiError(response: Response) {
+  const fallbackMessage = "Expense could not be saved. Check the details and try again.";
+
+  try {
+    const problem = await response.json() as {
+      title?: unknown;
+      detail?: unknown;
+      errors?: unknown;
+    };
+
+    return new ExpenseApiError({
+      message: typeof problem.detail === "string"
+        ? problem.detail
+        : typeof problem.title === "string"
+          ? problem.title
+          : fallbackMessage,
+      status: response.status,
+      validationErrors: parseValidationErrors(problem.errors)
+    });
+  } catch {
+    return new ExpenseApiError({
+      message: fallbackMessage,
+      status: response.status,
+      validationErrors: {}
+    });
+  }
+}
+
+function parseValidationErrors(errors: unknown) {
+  if (!errors || typeof errors !== "object") {
+    return {};
+  }
+
+  return Object.entries(errors).reduce<Record<string, string[]>>((result, [field, messages]) => {
+    if (Array.isArray(messages)) {
+      result[field] = messages.filter((message): message is string => typeof message === "string");
+    }
+
+    return result;
+  }, {});
+}
diff --git a/frontend/src/shared/ui/Button.tsx b/frontend/src/shared/ui/Button.tsx
new file mode 100644
index 0000000..6957006
--- /dev/null
+++ b/frontend/src/shared/ui/Button.tsx
@@ -0,0 +1,10 @@
+import type { ButtonHTMLAttributes } from "react";
+
+type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
+  variant?: "primary" | "ghost";
+};
+
+export function Button({ className = "", variant = "primary", ...props }: ButtonProps) {
+  return <button className={`button button-${variant} ${className}`.trim()} {...props} />;
+}
+
diff --git a/frontend/src/shared/ui/Surface.tsx b/frontend/src/shared/ui/Surface.tsx
new file mode 100644
index 0000000..e47b203
--- /dev/null
+++ b/frontend/src/shared/ui/Surface.tsx
@@ -0,0 +1,15 @@
+import type { PropsWithChildren } from "react";
+
+type SurfaceProps = PropsWithChildren<{
+  className?: string;
+  "aria-labelledby"?: string;
+}>;
+
+export function Surface({ children, className = "", ...props }: SurfaceProps) {
+  return (
+    <section className={`surface ${className}`.trim()} {...props}>
+      {children}
+    </section>
+  );
+}
+
diff --git a/frontend/src/test/setup.ts b/frontend/src/test/setup.ts
new file mode 100644
index 0000000..a86a67e
--- /dev/null
+++ b/frontend/src/test/setup.ts
@@ -0,0 +1,2 @@
+import "@testing-library/jest-dom/vitest";
+
diff --git a/frontend/tsconfig.app.json b/frontend/tsconfig.app.json
new file mode 100644
index 0000000..d779b7c
--- /dev/null
+++ b/frontend/tsconfig.app.json
@@ -0,0 +1,21 @@
+{
+  "compilerOptions": {
+    "target": "ES2022",
+    "useDefineForClassFields": true,
+    "lib": ["ES2022", "DOM", "DOM.Iterable"],
+    "allowJs": false,
+    "skipLibCheck": true,
+    "esModuleInterop": true,
+    "allowSyntheticDefaultImports": true,
+    "strict": true,
+    "forceConsistentCasingInFileNames": true,
+    "module": "ESNext",
+    "moduleResolution": "Bundler",
+    "resolveJsonModule": true,
+    "isolatedModules": true,
+    "noEmit": true,
+    "jsx": "react-jsx",
+    "types": ["vite/client", "vitest/globals", "@testing-library/jest-dom"]
+  },
+  "include": ["src"]
+}
diff --git a/frontend/tsconfig.json b/frontend/tsconfig.json
new file mode 100644
index 0000000..e891e30
--- /dev/null
+++ b/frontend/tsconfig.json
@@ -0,0 +1,8 @@
+{
+  "files": [],
+  "references": [
+    { "path": "./tsconfig.app.json" },
+    { "path": "./tsconfig.node.json" }
+  ]
+}
+
diff --git a/frontend/tsconfig.node.json b/frontend/tsconfig.node.json
new file mode 100644
index 0000000..a04dcf1
--- /dev/null
+++ b/frontend/tsconfig.node.json
@@ -0,0 +1,12 @@
+{
+  "compilerOptions": {
+    "composite": true,
+    "skipLibCheck": true,
+    "module": "ESNext",
+    "moduleResolution": "Bundler",
+    "allowSyntheticDefaultImports": true,
+    "strict": true,
+    "noEmit": true
+  },
+  "include": ["vite.config.ts"]
+}
diff --git a/frontend/vite.config.ts b/frontend/vite.config.ts
new file mode 100644
index 0000000..697e0ed
--- /dev/null
+++ b/frontend/vite.config.ts
@@ -0,0 +1,14 @@
+import { defineConfig } from "vitest/config";
+import react from "@vitejs/plugin-react";
+
+export default defineConfig({
+  plugins: [react()],
+  test: {
+    environment: "jsdom",
+    setupFiles: "./src/test/setup.ts",
+    css: true
+  },
+  server: {
+    port: 5173
+  }
+});
diff --git a/tests/backend-integration/CategoryApiTests.cs b/tests/backend-integration/CategoryApiTests.cs
new file mode 100644
index 0000000..5e52556
--- /dev/null
+++ b/tests/backend-integration/CategoryApiTests.cs
@@ -0,0 +1,637 @@
+using System.Net.Http.Json;
+using Backend.Data;
+using Backend.Domain;
+using Backend.Features.Categories;
+using Backend.Features.Expenses;
+using FluentAssertions;
+using Microsoft.AspNetCore.Hosting;
+using Microsoft.AspNetCore.Mvc.Testing;
+using Microsoft.EntityFrameworkCore;
+using Microsoft.Extensions.DependencyInjection;
+using System.Data;
+using System.Net;
+using System.Text.Json;
+using Testcontainers.PostgreSql;
+using Xunit;
+
+namespace Backend.IntegrationTests;
+
+public sealed class CategoryApiTests : IAsyncLifetime
+{
+    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
+        .WithImage("postgres:17-alpine")
+        .WithDatabase("expense_tracker_tests")
+        .WithUsername("postgres")
+        .WithPassword("postgres")
+        .Build();
+
+    private WebApplicationFactory<Program>? _factory;
+
+    public async Task InitializeAsync()
+    {
+        await _postgres.StartAsync();
+
+        _factory = new WebApplicationFactory<Program>()
+            .WithWebHostBuilder(builder =>
+            {
+                builder.UseEnvironment("Testing");
+                builder.ConfigureServices(services =>
+                {
+                    var descriptor = services.SingleOrDefault(service => service.ServiceType == typeof(DbContextOptions<AppDbContext>));
+                    if (descriptor is not null)
+                    {
+                        services.Remove(descriptor);
+                    }
+
+                    services.AddDbContext<AppDbContext>(options => options.UseNpgsql(_postgres.GetConnectionString()));
+                });
+            });
+
+        using var scope = _factory.Services.CreateScope();
+        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
+        await dbContext.Database.MigrateAsync();
+    }
+
+    public async Task DisposeAsync()
+    {
+        if (_factory is not null)
+        {
+            await _factory.DisposeAsync();
+        }
+
+        await _postgres.DisposeAsync();
+    }
+
+    [Fact]
+    public async Task Migrations_seed_protected_default_categories()
+    {
+        using var scope = _factory!.Services.CreateScope();
+        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
+
+        var categories = await dbContext.Categories.AsNoTracking().OrderBy(category => category.Name).ToListAsync();
+
+        categories.Select(category => category.Name).Should().BeEquivalentTo(
+        [
+            "Food",
+            "Transport",
+            "Shopping",
+            "Bills",
+            "Entertainment",
+            "Health",
+            "Education",
+            "Other"
+        ]);
+        categories.Should().OnlyContain(category => category.Id != Guid.Empty);
+        categories.Should().OnlyContain(category => category.IsDefault);
+        categories.Should().OnlyContain(category => category.IsProtected);
+        categories.Select(category => category.Name).Should().OnlyHaveUniqueItems();
+    }
+
+    [Fact]
+    public async Task Categories_endpoint_returns_explicit_dtos()
+    {
+        var client = _factory!.CreateClient();
+
+        var response = await client.GetAsync("/api/categories");
+
+        response.EnsureSuccessStatusCode();
+        var categories = await response.Content.ReadFromJsonAsync<List<CategoryDto>>();
+
+        categories.Should().NotBeNull();
+        categories!.Should().HaveCount(8);
+        categories.Should().ContainEquivalentOf(new
+        {
+            Id = new Guid("10000000-0000-0000-0000-000000000001"),
+            Name = "Food",
+            IsDefault = true,
+            IsProtected = true
+        });
+    }
+
+    [Fact]
+    public async Task Expenses_endpoint_creates_expense_with_explicit_dto_and_required_persistence_types()
+    {
+        var client = _factory!.CreateClient();
+        var request = new CreateExpenseRequest(
+            125.50m,
+            new Guid("10000000-0000-0000-0000-000000000001"),
+            new DateOnly(2026, 9, 16),
+            " ");
+
+        var response = await client.PostAsJsonAsync("/api/expenses", request);
+
+        response.StatusCode.Should().Be(HttpStatusCode.Created);
+        var responseJson = await response.Content.ReadAsStringAsync();
+        using var responseDocument = JsonDocument.Parse(responseJson);
+        responseDocument.RootElement.TryGetProperty("currency", out _).Should().BeFalse();
+
+        var expenseDto = JsonSerializer.Deserialize<ExpenseDto>(responseJson, new JsonSerializerOptions(JsonSerializerDefaults.Web));
+        expenseDto.Should().NotBeNull();
+        expenseDto!.Amount.Should().Be(125.50m);
+        expenseDto.CategoryId.Should().Be(request.CategoryId);
+        expenseDto.ExpenseDate.Should().Be(request.ExpenseDate);
+        expenseDto.Description.Should().BeNull();
+        expenseDto.CreatedAt.Offset.Should().Be(TimeSpan.Zero);
+        expenseDto.UpdatedAt.Offset.Should().Be(TimeSpan.Zero);
+
+        using var scope = _factory.Services.CreateScope();
+        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
+        var storedExpense = await dbContext.Expenses.AsNoTracking().SingleAsync();
+
+        storedExpense.Amount.Should().Be(125.50m);
+        storedExpense.CategoryId.Should().Be(request.CategoryId);
+        storedExpense.ExpenseDate.Should().Be(request.ExpenseDate);
+        storedExpense.Description.Should().BeNull();
+        storedExpense.CreatedAt.Offset.Should().Be(TimeSpan.Zero);
+        storedExpense.UpdatedAt.Offset.Should().Be(TimeSpan.Zero);
+
+        var amountType = await GetColumnTypeAsync(dbContext, "expenses", "amount");
+        var expenseDateType = await GetColumnTypeAsync(dbContext, "expenses", "expense_date");
+        var createdAtType = await GetColumnTypeAsync(dbContext, "expenses", "created_at");
+        var updatedAtType = await GetColumnTypeAsync(dbContext, "expenses", "updated_at");
+        var currencyColumnCount = await GetColumnCountAsync(dbContext, "expenses", "currency");
+
+        amountType.Should().Be("numeric(12,2)");
+        expenseDateType.Should().Be("date");
+        createdAtType.Should().Be("timestamp with time zone");
+        updatedAtType.Should().Be("timestamp with time zone");
+        currencyColumnCount.Should().Be(0);
+    }
+
+    [Fact]
+    public async Task Expenses_endpoint_rejects_unknown_category_without_saving()
+    {
+        var client = _factory!.CreateClient();
+        var request = new CreateExpenseRequest(
+            42.00m,
+            Guid.NewGuid(),
+            new DateOnly(2026, 9, 16),
+            null);
+        using var scope = _factory.Services.CreateScope();
+        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
+        var countBefore = await dbContext.Expenses.CountAsync();
+
+        var response = await client.PostAsJsonAsync("/api/expenses", request);
+
+        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
+        await AssertValidationProblemAsync(response, "CategoryId");
+
+        var countAfter = await dbContext.Expenses.CountAsync();
+        countAfter.Should().Be(countBefore);
+    }
+
+    public static IEnumerable<object[]> InvalidCreateRequests()
+    {
+        var categoryId = new Guid("10000000-0000-0000-0000-000000000001");
+
+        yield return
+        [
+            new CreateExpenseRequest(0m, categoryId, new DateOnly(2026, 9, 16), null),
+            "Amount"
+        ];
+        yield return
+        [
+            new CreateExpenseRequest(12.345m, categoryId, new DateOnly(2026, 9, 16), null),
+            "Amount"
+        ];
+        yield return
+        [
+            new CreateExpenseRequest(10000000000m, categoryId, new DateOnly(2026, 9, 16), null),
+            "Amount"
+        ];
+        yield return
+        [
+            new CreateExpenseRequest(12.34m, Guid.Empty, new DateOnly(2026, 9, 16), null),
+            "CategoryId"
+        ];
+        yield return
+        [
+            new CreateExpenseRequest(12.34m, categoryId, default, null),
+            "ExpenseDate"
+        ];
+        yield return
+        [
+            new CreateExpenseRequest(12.34m, categoryId, new DateOnly(2026, 9, 16), new string('x', 241)),
+            "Description"
+        ];
+    }
+
+    [Theory]
+    [MemberData(nameof(InvalidCreateRequests))]
+    public async Task Expenses_endpoint_rejects_invalid_create_requests_without_saving(
+        CreateExpenseRequest request,
+        string expectedField)
+    {
+        var client = _factory!.CreateClient();
+        using var scope = _factory.Services.CreateScope();
+        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
+        var countBefore = await dbContext.Expenses.CountAsync();
+
+        var response = await client.PostAsJsonAsync("/api/expenses", request);
+
+        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
+        await AssertValidationProblemAsync(response, expectedField);
+
+        var countAfter = await dbContext.Expenses.CountAsync();
+        countAfter.Should().Be(countBefore);
+    }
+
+    [Fact]
+    public async Task Expenses_endpoint_returns_empty_list_when_no_expenses_exist()
+    {
+        var client = _factory!.CreateClient();
+
+        var response = await client.GetAsync("/api/expenses");
+
+        response.EnsureSuccessStatusCode();
+        var expenses = await response.Content.ReadFromJsonAsync<List<ExpenseListItemDto>>();
+
+        expenses.Should().NotBeNull();
+        expenses.Should().BeEmpty();
+    }
+
+    [Fact]
+    public async Task Expenses_endpoint_returns_ordered_list_rows_with_category_names()
+    {
+        var foodId = new Guid("10000000-0000-0000-0000-000000000001");
+        var transportId = new Guid("10000000-0000-0000-0000-000000000002");
+
+        using var scope = _factory!.Services.CreateScope();
+        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
+        var olderSameDateId = Guid.NewGuid();
+        var newerSameDateId = Guid.NewGuid();
+        var olderExpenseDateId = Guid.NewGuid();
+        dbContext.Expenses.AddRange(
+            new Expense(
+                olderSameDateId,
+                42.00m,
+                foodId,
+                new DateOnly(2030, 1, 2),
+                "Earlier same day",
+                new DateTimeOffset(2030, 1, 2, 8, 0, 0, TimeSpan.Zero),
+                new DateTimeOffset(2030, 1, 2, 8, 0, 0, TimeSpan.Zero)),
+            new Expense(
+                newerSameDateId,
+                80.00m,
+                transportId,
+                new DateOnly(2030, 1, 2),
+                null,
+                new DateTimeOffset(2030, 1, 2, 9, 0, 0, TimeSpan.Zero),
+                new DateTimeOffset(2030, 1, 2, 9, 0, 0, TimeSpan.Zero)),
+            new Expense(
+                olderExpenseDateId,
+                125.50m,
+                foodId,
+                new DateOnly(2030, 1, 1),
+                "Previous day",
+                new DateTimeOffset(2030, 1, 1, 10, 0, 0, TimeSpan.Zero),
+                new DateTimeOffset(2030, 1, 1, 10, 0, 0, TimeSpan.Zero)));
+        await dbContext.SaveChangesAsync();
+        var client = _factory.CreateClient();
+
+        var response = await client.GetAsync("/api/expenses");
+
+        response.EnsureSuccessStatusCode();
+        var expenses = await response.Content.ReadFromJsonAsync<List<ExpenseListItemDto>>();
+
+        expenses.Should().NotBeNull();
+        expenses!.Select(expense => expense.Id).Should().StartWith(
+        [
+            newerSameDateId,
+            olderSameDateId,
+            olderExpenseDateId
+        ]);
+        expenses[0].CategoryName.Should().Be("Transport");
+        expenses[0].Description.Should().BeNull();
+        expenses[1].CategoryName.Should().Be("Food");
+        expenses[1].Description.Should().Be("Earlier same day");
+    }
+
+    [Fact]
+    public async Task Expense_detail_endpoint_returns_explicit_detail_dto_with_category_name()
+    {
+        var foodId = new Guid("10000000-0000-0000-0000-000000000001");
+        var expenseId = Guid.NewGuid();
+        using var scope = _factory!.Services.CreateScope();
+        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
+        dbContext.Expenses.Add(new Expense(
+            expenseId,
+            125.50m,
+            foodId,
+            new DateOnly(2031, 2, 3),
+            "Lunch",
+            new DateTimeOffset(2031, 2, 3, 8, 0, 0, TimeSpan.Zero),
+            new DateTimeOffset(2031, 2, 3, 8, 0, 0, TimeSpan.Zero)));
+        await dbContext.SaveChangesAsync();
+        var client = _factory.CreateClient();
+
+        var response = await client.GetAsync($"/api/expenses/{expenseId}");
+
+        response.EnsureSuccessStatusCode();
+        var detail = await response.Content.ReadFromJsonAsync<ExpenseDetailDto>();
+        detail.Should().NotBeNull();
+        detail!.Id.Should().Be(expenseId);
+        detail.Amount.Should().Be(125.50m);
+        detail.CategoryId.Should().Be(foodId);
+        detail.CategoryName.Should().Be("Food");
+        detail.ExpenseDate.Should().Be(new DateOnly(2031, 2, 3));
+        detail.Description.Should().Be("Lunch");
+    }
+
+    [Fact]
+    public async Task Expense_detail_endpoint_returns_not_found_for_missing_expense()
+    {
+        var client = _factory!.CreateClient();
+
+        var response = await client.GetAsync($"/api/expenses/{Guid.NewGuid()}");
+
+        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
+    }
+
+    [Fact]
+    public async Task Expense_update_endpoint_updates_editable_fields_and_preserves_created_at()
+    {
+        var foodId = new Guid("10000000-0000-0000-0000-000000000001");
+        var transportId = new Guid("10000000-0000-0000-0000-000000000002");
+        var expenseId = Guid.NewGuid();
+        var createdAt = new DateTimeOffset(2032, 3, 4, 8, 0, 0, TimeSpan.Zero);
+        using var scope = _factory!.Services.CreateScope();
+        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
+        dbContext.Expenses.Add(new Expense(
+            expenseId,
+            125.50m,
+            foodId,
+            new DateOnly(2032, 3, 4),
+            "Lunch",
+            createdAt,
+            createdAt));
+        await dbContext.SaveChangesAsync();
+        var client = _factory.CreateClient();
+        var request = new UpdateExpenseRequest(
+            200.00m,
+            transportId,
+            new DateOnly(2032, 3, 5),
+            " Auto ride ");
+
+        var response = await client.PutAsJsonAsync($"/api/expenses/{expenseId}", request);
+
+        response.EnsureSuccessStatusCode();
+        var detail = await response.Content.ReadFromJsonAsync<ExpenseDetailDto>();
+        detail.Should().NotBeNull();
+        detail!.Amount.Should().Be(200.00m);
+        detail.CategoryId.Should().Be(transportId);
+        detail.CategoryName.Should().Be("Transport");
+        detail.ExpenseDate.Should().Be(new DateOnly(2032, 3, 5));
+        detail.Description.Should().Be("Auto ride");
+        detail.CreatedAt.Should().Be(createdAt);
+        detail.UpdatedAt.Should().BeAfter(createdAt);
+
+        var storedExpense = await dbContext.Expenses.AsNoTracking().SingleAsync(expense => expense.Id == expenseId);
+        storedExpense.Amount.Should().Be(200.00m);
+        storedExpense.CategoryId.Should().Be(transportId);
+        storedExpense.ExpenseDate.Should().Be(new DateOnly(2032, 3, 5));
+        storedExpense.Description.Should().Be("Auto ride");
+        storedExpense.CreatedAt.Should().Be(createdAt);
+        storedExpense.UpdatedAt.Should().BeAfter(createdAt);
+    }
+
+    [Fact]
+    public async Task Expense_update_endpoint_returns_not_found_for_missing_expense()
+    {
+        var client = _factory!.CreateClient();
+        var request = new UpdateExpenseRequest(
+            42.00m,
+            new Guid("10000000-0000-0000-0000-000000000001"),
+            new DateOnly(2032, 3, 5),
+            null);
+
+        var response = await client.PutAsJsonAsync($"/api/expenses/{Guid.NewGuid()}", request);
+
+        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
+    }
+
+    [Fact]
+    public async Task Expense_update_endpoint_rejects_unknown_category_without_saving()
+    {
+        var foodId = new Guid("10000000-0000-0000-0000-000000000001");
+        var expenseId = Guid.NewGuid();
+        using var scope = _factory!.Services.CreateScope();
+        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
+        dbContext.Expenses.Add(new Expense(
+            expenseId,
+            125.50m,
+            foodId,
+            new DateOnly(2033, 4, 5),
+            "Lunch",
+            new DateTimeOffset(2033, 4, 5, 8, 0, 0, TimeSpan.Zero),
+            new DateTimeOffset(2033, 4, 5, 8, 0, 0, TimeSpan.Zero)));
+        await dbContext.SaveChangesAsync();
+        var client = _factory.CreateClient();
+        var request = new UpdateExpenseRequest(
+            42.00m,
+            Guid.NewGuid(),
+            new DateOnly(2033, 4, 6),
+            null);
+
+        var response = await client.PutAsJsonAsync($"/api/expenses/{expenseId}", request);
+
+        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
+        await AssertValidationProblemAsync(response, "CategoryId");
+
+        var storedExpense = await dbContext.Expenses.AsNoTracking().SingleAsync(expense => expense.Id == expenseId);
+        storedExpense.Amount.Should().Be(125.50m);
+        storedExpense.CategoryId.Should().Be(foodId);
+        storedExpense.ExpenseDate.Should().Be(new DateOnly(2033, 4, 5));
+    }
+
+    public static IEnumerable<object[]> InvalidUpdateRequests()
+    {
+        var categoryId = new Guid("10000000-0000-0000-0000-000000000001");
+
+        yield return
+        [
+            new UpdateExpenseRequest(0m, categoryId, new DateOnly(2034, 5, 6), null),
+            "Amount"
+        ];
+        yield return
+        [
+            new UpdateExpenseRequest(12.345m, categoryId, new DateOnly(2034, 5, 6), null),
+            "Amount"
+        ];
+        yield return
+        [
+            new UpdateExpenseRequest(10000000000m, categoryId, new DateOnly(2034, 5, 6), null),
+            "Amount"
+        ];
+        yield return
+        [
+            new UpdateExpenseRequest(12.34m, Guid.Empty, new DateOnly(2034, 5, 6), null),
+            "CategoryId"
+        ];
+        yield return
+        [
+            new UpdateExpenseRequest(12.34m, categoryId, default, null),
+            "ExpenseDate"
+        ];
+        yield return
+        [
+            new UpdateExpenseRequest(12.34m, categoryId, new DateOnly(2034, 5, 6), new string('x', 241)),
+            "Description"
+        ];
+    }
+
+    [Theory]
+    [MemberData(nameof(InvalidUpdateRequests))]
+    public async Task Expense_update_endpoint_rejects_invalid_update_requests_without_saving(
+        UpdateExpenseRequest request,
+        string expectedField)
+    {
+        var foodId = new Guid("10000000-0000-0000-0000-000000000001");
+        var expenseId = Guid.NewGuid();
+        using var scope = _factory!.Services.CreateScope();
+        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
+        dbContext.Expenses.Add(new Expense(
+            expenseId,
+            125.50m,
+            foodId,
+            new DateOnly(2035, 6, 7),
+            "Lunch",
+            new DateTimeOffset(2035, 6, 7, 8, 0, 0, TimeSpan.Zero),
+            new DateTimeOffset(2035, 6, 7, 8, 0, 0, TimeSpan.Zero)));
+        await dbContext.SaveChangesAsync();
+        var client = _factory.CreateClient();
+
+        var response = await client.PutAsJsonAsync($"/api/expenses/{expenseId}", request);
+
+        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
+        await AssertValidationProblemAsync(response, expectedField);
+
+        var storedExpense = await dbContext.Expenses.AsNoTracking().SingleAsync(expense => expense.Id == expenseId);
+        storedExpense.Amount.Should().Be(125.50m);
+        storedExpense.CategoryId.Should().Be(foodId);
+        storedExpense.ExpenseDate.Should().Be(new DateOnly(2035, 6, 7));
+    }
+
+    [Fact]
+    public async Task Expense_delete_endpoint_deletes_only_the_requested_expense()
+    {
+        var foodId = new Guid("10000000-0000-0000-0000-000000000001");
+        var expenseId = Guid.NewGuid();
+        var retainedExpenseId = Guid.NewGuid();
+        using var scope = _factory!.Services.CreateScope();
+        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
+        dbContext.Expenses.AddRange(
+            new Expense(
+                expenseId,
+                125.50m,
+                foodId,
+                new DateOnly(2036, 7, 8),
+                "Lunch",
+                new DateTimeOffset(2036, 7, 8, 8, 0, 0, TimeSpan.Zero),
+                new DateTimeOffset(2036, 7, 8, 8, 0, 0, TimeSpan.Zero)),
+            new Expense(
+                retainedExpenseId,
+                42.00m,
+                foodId,
+                new DateOnly(2036, 7, 9),
+                "Dinner",
+                new DateTimeOffset(2036, 7, 9, 8, 0, 0, TimeSpan.Zero),
+                new DateTimeOffset(2036, 7, 9, 8, 0, 0, TimeSpan.Zero)));
+        await dbContext.SaveChangesAsync();
+        var client = _factory.CreateClient();
+
+        var response = await client.DeleteAsync($"/api/expenses/{expenseId}");
+
+        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
+        (await dbContext.Expenses.AsNoTracking().AnyAsync(expense => expense.Id == expenseId)).Should().BeFalse();
+        (await dbContext.Expenses.AsNoTracking().AnyAsync(expense => expense.Id == retainedExpenseId)).Should().BeTrue();
+    }
+
+    [Fact]
+    public async Task Expense_delete_endpoint_returns_not_found_for_missing_expense()
+    {
+        var client = _factory!.CreateClient();
+
+        var response = await client.DeleteAsync($"/api/expenses/{Guid.NewGuid()}");
+
+        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
+    }
+
+    private static async Task AssertValidationProblemAsync(HttpResponseMessage response, string expectedField)
+    {
+        var problemJson = await response.Content.ReadAsStringAsync();
+        using var problemDocument = JsonDocument.Parse(problemJson);
+        var root = problemDocument.RootElement;
+
+        root.GetProperty("status").GetInt32().Should().Be((int)HttpStatusCode.BadRequest);
+        root.GetProperty("title").GetString().Should().NotBeNullOrWhiteSpace();
+        root.TryGetProperty("errors", out var errors).Should().BeTrue();
+        errors.ValueKind.Should().Be(JsonValueKind.Object);
+        errors.TryGetProperty(expectedField, out var fieldErrors).Should().BeTrue();
+        fieldErrors.ValueKind.Should().Be(JsonValueKind.Array);
+        fieldErrors.GetArrayLength().Should().BeGreaterThan(0);
+    }
+
+    private static async Task<string> GetColumnTypeAsync(AppDbContext dbContext, string tableName, string columnName)
+    {
+        var connection = dbContext.Database.GetDbConnection();
+        if (connection.State != ConnectionState.Open)
+        {
+            await connection.OpenAsync();
+        }
+
+        await using var command = connection.CreateCommand();
+        command.CommandText = """
+            select format_type(a.atttypid, a.atttypmod)
+            from pg_attribute a
+            join pg_class c on c.oid = a.attrelid
+            where c.relname = @tableName
+              and a.attname = @columnName
+              and a.attnum > 0
+              and not a.attisdropped
+            """;
+
+        var tableParameter = command.CreateParameter();
+        tableParameter.ParameterName = "tableName";
+        tableParameter.Value = tableName;
+        command.Parameters.Add(tableParameter);
+
+        var columnParameter = command.CreateParameter();
+        columnParameter.ParameterName = "columnName";
+        columnParameter.Value = columnName;
+        command.Parameters.Add(columnParameter);
+
+        var result = await command.ExecuteScalarAsync();
+        return result.Should().BeOfType<string>().Subject;
+    }
+
+    private static async Task<int> GetColumnCountAsync(AppDbContext dbContext, string tableName, string columnName)
+    {
+        var connection = dbContext.Database.GetDbConnection();
+        if (connection.State != ConnectionState.Open)
+        {
+            await connection.OpenAsync();
+        }
+
+        await using var command = connection.CreateCommand();
+        command.CommandText = """
+            select count(*)
+            from information_schema.columns
+            where table_name = @tableName
+              and column_name = @columnName
+            """;
+
+        var tableParameter = command.CreateParameter();
+        tableParameter.ParameterName = "tableName";
+        tableParameter.Value = tableName;
+        command.Parameters.Add(tableParameter);
+
+        var columnParameter = command.CreateParameter();
+        columnParameter.ParameterName = "columnName";
+        columnParameter.Value = columnName;
+        command.Parameters.Add(columnParameter);
+
+        var result = await command.ExecuteScalarAsync();
+        return Convert.ToInt32(result);
+    }
+}
diff --git a/tests/backend-integration/backend-integration.csproj b/tests/backend-integration/backend-integration.csproj
new file mode 100644
index 0000000..e4f1550
--- /dev/null
+++ b/tests/backend-integration/backend-integration.csproj
@@ -0,0 +1,29 @@
+<Project Sdk="Microsoft.NET.Sdk">
+  <PropertyGroup>
+    <TargetFramework>net10.0</TargetFramework>
+    <Nullable>enable</Nullable>
+    <ImplicitUsings>enable</ImplicitUsings>
+    <IsPackable>false</IsPackable>
+  </PropertyGroup>
+
+  <ItemGroup>
+    <PackageReference Include="coverlet.collector" Version="6.0.4">
+      <PrivateAssets>all</PrivateAssets>
+      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
+    </PackageReference>
+    <PackageReference Include="FluentAssertions" Version="8.6.0" />
+    <PackageReference Include="Microsoft.AspNetCore.Mvc.Testing" Version="10.0.0" />
+    <PackageReference Include="Microsoft.NET.Test.Sdk" Version="18.0.0" />
+    <PackageReference Include="Testcontainers.PostgreSql" Version="4.8.0" />
+    <PackageReference Include="xunit" Version="2.9.3" />
+    <PackageReference Include="xunit.runner.visualstudio" Version="3.1.5">
+      <PrivateAssets>all</PrivateAssets>
+      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
+    </PackageReference>
+  </ItemGroup>
+
+  <ItemGroup>
+    <ProjectReference Include="..\..\backend\backend.csproj" />
+  </ItemGroup>
+</Project>
+
diff --git a/_bmad-output/implementation-artifacts/epic-2-context.md b/_bmad-output/implementation-artifacts/epic-2-context.md
new file mode 100644
index 0000000..4d33534
--- /dev/null
+++ b/_bmad-output/implementation-artifacts/epic-2-context.md
@@ -0,0 +1,57 @@
+# Epic 2 Context: Expense Review and Maintenance
+
+<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->
+
+## Goal
+
+Epic 2 turns saved Expenses into maintainable records. Users can review recent and all recorded expenses, open one expense for read-only inspection, edit mistakes, and delete only after confirmation. This matters because the capture flow from Epic 1 is only useful if the user can later confirm what was recorded and safely correct or remove wrong entries.
+
+## Stories
+
+- Story 2.1: Review Recorded Expenses
+- Story 2.2: View and Edit Expense Details
+- Story 2.3: Delete an Expense with Confirmation
+
+## Requirements & Constraints
+
+Home must show exactly 5 Recent Expenses when expenses exist. Rows contain amount, Category, date, and optional description as secondary text when present. Recent Expenses are ordered by `ExpenseDate` descending, then `CreatedAt` descending as the stable same-date tie-breaker. Each row opens Expense Detail.
+
+Review must show all recorded Expenses in one simple scrollable list using the same row structure and ordering as Home. MVP Review must not include grouping, pagination, infinite scroll, search, filtering, sorting controls, chart exploration, or analytics. When no expenses exist, Home keeps Add Expense visible and Recent Expenses shows `No expenses yet. Add your first one above.`; Review shows `No expenses recorded yet.` and a clear route back to Home.
+
+Expense Detail is read-only by default and shows amount, Category, date, and optional description. Edit and Delete actions live on the detail surface, not directly on list rows. Edit uses the same Expense form pattern as Add Expense, pre-populated with the existing amount, Category chip, date, and optional description. Cancel or Back discards unsaved changes and returns to Detail. Successful update shows `Expense updated.` and refreshes Home, Review, Detail, and relevant server state.
+
+Delete requires an accessible confirmation dialog with concise title/explanation, Cancel, and visually destructive Delete action. Cancel leaves the expense unchanged. Confirm deletes through the API, shows `Expense deleted.`, and refreshes Home/Review lists and relevant summary state. MVP has no undo, trash, archive, recovery, or soft-delete recovery workflow.
+
+Validation and failures keep the user in context, preserve entered data where applicable, and show concise actionable feedback near the relevant field/action. Create/update validation rules are shared: amount, Category, and date are required; amount must be positive with up to 2 decimal places; description is optional. Backend validation remains authoritative and returns ProblemDetails/ValidationProblemDetails.
+
+## Technical Decisions
+
+Use the existing React/Vite TypeScript frontend, ASP.NET Core Web API backend, and PostgreSQL persistence. Preserve the single backend project with feature folders, Domain, Data, and explicit DTO contracts. Endpoints remain thin and delegate to feature services; do not expose EF Core/domain entities directly.
+
+Use resource-oriented REST for Expenses. Story 2.1 needs expense list readers; Story 2.2 needs detail and update; Story 2.3 needs delete. Do not introduce CQRS, MediatR, Redux, Zustand, auth/user tables, UserId columns, or startup auto-migrations.
+
+Expense keeps `CategoryId` and resolves Category names for list/detail DTOs. Do not snapshot Category name into Expense. Monetary values remain .NET `decimal` and PostgreSQL `numeric(12,2)`. `ExpenseDate` remains `DateOnly` mapped to PostgreSQL `date`; `CreatedAt` and `UpdatedAt` remain UTC timestamps. API dates use `YYYY-MM-DD`; timestamps use ISO 8601.
+
+Frontend server state for expense lists, detail, mutations, categories, and summaries belongs to TanStack Query. UI components import typed DTOs and API functions from `shared/api`; feature UI should not hand-shape raw backend responses. React Router owns navigation among Home, Review, Detail, and Edit surfaces.
+
+Backend integration tests should cover PostgreSQL-sensitive ordering, retrieval, update, delete, and error behavior when Docker/Testcontainers is available. In this local environment, if Docker is unavailable, compile the tests and record Testcontainers execution as an environment blocker without changing architecture.
+
+## UX & Interaction Patterns
+
+Home stays the default landing surface with Add Expense first, Current Month summary second, and Recent Expenses third on mobile; desktop keeps Add Expense and summary in the main/left column with Recent Expenses on the right. Add Expense remains visible in empty states.
+
+Expense rows should be clean, tappable/clickable, keyboard-accessible rows. They show INR amounts, Category, date, and optional description as secondary text. Row actions should navigate to Expense Detail; list rows do not show inline edit/delete controls.
+
+Review is a simple browsing surface, not a data table. It uses the same navigation IA as Home and Categories. Empty Review uses the exact copy `No expenses recorded yet.` and provides a clear route back to Home.
+
+Detail/Edit/Delete interactions must follow the established clean personal-utility visual system: warm off-white page, white surfaces, teal primary action, semantic danger for destructive action, practical spacing, modest radii, and no dense dashboard treatment.
+
+Accessibility expectations include meaningful labels, keyboard access for rows/actions/forms/dialogs, focus order following reading order, validation feedback associated with fields, dialog focus management, and destructive/selected/error states that do not rely on color alone.
+
+## Cross-Story Dependencies
+
+Story 2.1 depends on Epic 1's persisted Expense model, Category model, create API, Add Expense mutation invalidations, and validation behavior. It establishes list DTO/API/query patterns that Story 2.2 reuses for detail navigation and edit refresh.
+
+Story 2.2 depends on Story 2.1 row navigation and list readers. It adds read-only detail and update behavior that must refresh the same list/query keys.
+
+Story 2.3 depends on Story 2.2 detail actions. It adds destructive confirmation and delete behavior that must remove the expense from Home/Review and refresh related server state.
diff --git a/_bmad-output/implementation-artifacts/spec-1-3-validate-fast-expense-capture-with-clear-feedback.md b/_bmad-output/implementation-artifacts/spec-1-3-validate-fast-expense-capture-with-clear-feedback.md
new file mode 100644
index 0000000..c4a46c2
--- /dev/null
+++ b/_bmad-output/implementation-artifacts/spec-1-3-validate-fast-expense-capture-with-clear-feedback.md
@@ -0,0 +1,98 @@
+---
+title: 'Story 1.3: Validate Fast Expense Capture with Clear Feedback'
+type: 'feature'
+created: '2026-09-16'
+status: 'done'
+route: 'dispatch'
+review_loop_iteration: 0
+baseline_commit: '7acbffa7e5e6b98e5b49c3d56f88cbac0f0b13b7'
+context:
+  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
+---
+
+<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">
+
+## Intent
+
+**Problem:** Story 1.2 can create an Expense, but the Add Expense form still relies on silent returns, disabled-submit gating, browser behavior, and generic API failures for many invalid states. The user needs clear validation and failure feedback while staying in the fast capture context.
+
+**Approach:** Add explicit frontend validation for amount, category, and date before mutation; preserve entered values on validation and operation failures; parse backend ProblemDetails/ValidationProblemDetails so authoritative validation can surface near the form; and tighten backend tests around the existing validation contract.
+
+## Boundaries & Constraints
+
+**Always:** Missing amount copy must be exactly `Enter an amount to save this expense.` Amount validation must prevent empty, zero, negative, non-numeric, over-precision, and out-of-range values before submit. Category and date validation must produce inline, understandable feedback. Backend validation remains authoritative and returns ASP.NET Core ProblemDetails/ValidationProblemDetails with appropriate status codes. Operation failures keep the user on Home, preserve entered form data, clear stale success copy, and show concise actionable feedback near the action/form area.
+
+**Never:** Do not add merchant, payment method, tags, currency storage, exchange rates, auth/user concepts, Review list/detail behavior, summaries, category management, Redux/Zustand, CQRS, MediatR, Docker changes, or startup auto-migrations. Do not redesign the Add Expense layout or move it to another route.
+
+## I/O & Edge-Case Matrix
+
+| Scenario | Input / State | Expected Output / Behavior | Error Handling |
+|----------|--------------|---------------------------|----------------|
+| Missing amount | User submits with no amount | Mutation is not called; inline amount feedback says `Enter an amount to save this expense.` | Preserve category/date/description values |
+| Invalid amount | Amount is zero, negative, non-numeric, >2 decimals, or beyond backend max | Mutation is not called; amount feedback explains the issue plainly | Preserve all entered values |
+| Missing category | User submits without selected chip | Mutation is not called; category feedback explains that a Category is required | Preserve amount/date/description |
+| Invalid date | Date is blank or not a valid `YYYY-MM-DD` calendar date | Mutation is not called; date feedback explains that a valid date is required | Preserve amount/category/description |
+| Backend validation | API returns ValidationProblemDetails | Form stays in context and shows relevant field/form feedback from the response | Preserve entered values and clear stale success copy |
+| Operation failure | Network/server failure after valid input | Form stays in context with generic actionable failure near Save | Preserve entered values and clear stale success copy |
+
+</frozen-after-approval>
+
+## Code Map
+
+- `_bmad-output/implementation-artifacts/epic-1-context.md` -- Epic 1 validation, feedback, accessibility, and no-scope-expansion constraints.
+- `_bmad-output/implementation-artifacts/spec-1-2-create-an-expense-end-to-end.md` -- continuity for the completed create path; preserve success/reset behavior and Story 1.2 backend guardrails.
+- `_bmad-output/planning-artifacts/epics.md` -- Story 1.3 acceptance criteria and MVP exclusions.
+- `frontend/src/features/expenses/AddExpensePanel.tsx` -- add explicit validation state, inline messages, server-error display, enabled submit attempt path, and failure-preserving behavior.
+- `frontend/src/shared/api/expenses.ts` -- parse failed responses, preserving ValidationProblemDetails field errors for UI handling while keeping DTO contracts explicit.
+- `frontend/src/features/expenses/useCreateExpense.ts` -- keep the existing TanStack Query mutation/invalidation; no global store.
+- `frontend/src/app/styles.css` -- reuse existing inline success/error styling; add only small accessibility/error affordance selectors if needed.
+- `frontend/src/app/App.test.tsx` -- add focused interaction tests for frontend validation and preserved state after failed create.
+- `frontend/src/shared/api/expenses.test.ts` -- add API-client test for ValidationProblemDetails parsing.
+- `tests/backend-integration/CategoryApiTests.cs` -- strengthen invalid create tests to assert ValidationProblemDetails shape/status without changing Testcontainers setup.
+
+## Tasks & Acceptance
+
+**Execution:**
+- [x] `frontend/src/shared/api/expenses.ts` -- add a typed API error/validation-error parser for non-OK expense creates -- lets the form show backend validation without custom backend envelopes.
+- [x] `frontend/src/features/expenses/AddExpensePanel.tsx` -- add field validation, inline feedback, server validation mapping, and failure-preserving behavior -- satisfies Story 1.3 UX while keeping the fast form in place.
+- [x] `frontend/src/app/styles.css` -- add minimal invalid-control/error-summary affordances if required -- keeps feedback visible and accessible without redesign.
+- [x] `frontend/src/app/App.test.tsx` -- cover missing/invalid amount, missing category, invalid date, failed mutation preservation, and success path preservation -- verifies the user-facing validation contract.
+- [x] `frontend/src/shared/api/expenses.test.ts` -- verify ValidationProblemDetails parsing and generic failure fallback -- protects the frontend/backend boundary.
+- [x] `tests/backend-integration/CategoryApiTests.cs` -- assert invalid create responses expose `errors` and HTTP 400 while saving no rows -- verifies authoritative backend validation contract.
+
+**Acceptance Criteria:**
+- Given the user attempts to save with invalid amount, category, or date input, when frontend validation runs, then saving is prevented and inline feedback identifies the field to fix.
+- Given frontend validation feedback appears, when the user corrects the related input, then the stale field error clears without clearing unrelated entered values.
+- Given backend validation or operation failure occurs, when the error returns to the form, then entered data is preserved and concise feedback appears near the relevant field or form action.
+- Given create succeeds, when the Story 1.2 happy path is used, then `Expense saved.` and reset-for-next-entry behavior continue to work.
+
+## Implementation Notes
+
+- Added explicit Add Expense validation for missing, non-numeric, zero/negative, over-precision, and out-of-range amount input; missing category; and invalid/blank date.
+- Changed amount entry to `type="text"` with decimal input mode so non-numeric input can be preserved and explained instead of silently discarded by browser number-input behavior.
+- Added typed `ExpenseApiError` parsing for ASP.NET Core ProblemDetails/ValidationProblemDetails and mapped backend field errors back into the inline form feedback.
+- Preserved Story 1.2 success behavior: successful create still shows `Expense saved.` and resets the form for another entry.
+- Review patch added frontend description length validation/server-error mapping, clearer negative amount feedback, live regions for success/failure messages, and form-boundary tests for backend CategoryId, ExpenseDate, and Description validation errors.
+
+## Spec Change Log
+
+## Review Triage Log
+
+- low / patch: Self-review found stale success clearing on a later failed save was implemented but under-tested. Added `clears stale success feedback when a later save fails` in `frontend/src/app/App.test.tsx`, which verifies the previous `Expense saved.` message is removed while retry values remain.
+- low / patch: Backend `CategoryId` and `ExpenseDate` validation errors were parsed but not verified at the Add Expense form boundary. Added frontend tests that mock `ExpenseApiError` for those fields and assert inline messages plus preserved values.
+- medium / patch: Backend `Description` validation could return without inline field feedback. Added `description` to the form error map, frontend description length validation, and tests for both pre-submit and backend-mapped description errors.
+- low / patch: Negative amount feedback said "numbers only" because the validation regex rejected the sign before the positive-value check. Updated validation so `-1` shows the positive-amount guidance.
+- low / patch: Dynamic success/failure messages lacked live-region semantics. Added `role="status"` for success and `role="alert"` for form failures.
+- false: Additional tests for category/date stale-error clearing are useful but not required because current tests cover amount clearing plus backend-mapped category/date rendering and direct category/date frontend validation; no broken behavior was demonstrated.
+- false: Malformed JSON/model-binding API tests are outside Story 1.3's fast-capture form contract; existing backend tests cover business-rule invalid requests and ProblemDetails shape for the DTO path used by the app.
+- false: Moving max amount/description rules into the domain or adding database check constraints would expand the already-approved architecture/persistence scope; the authoritative service validation and PostgreSQL type constraints remain intact for MVP.
+- false: README updates are documentation polish and not a concrete blocker for Story 1.3 implementation.
+
+## Verification
+
+**Commands:**
+- `npm --prefix frontend test` -- passed: 2 files, 23 tests.
+- `npm --prefix frontend run build` -- passed: TypeScript/Vite build succeeded.
+- `dotnet build backend/backend.csproj --no-restore` -- passed: backend compiled with 0 warnings/errors.
+- `dotnet build tests/backend-integration/backend-integration.csproj --no-restore` -- passed with existing NU1903 warning for `SSH.NET` 2024.2.0.
+- `docker info --format '{{.ServerVersion}}'` -- blocked: Docker daemon unavailable at `/Users/wallstreet62/.docker/run/docker.sock`; Testcontainers suite not run per no-Docker local rule.
diff --git a/_bmad-output/implementation-artifacts/spec-2-1-review-recorded-expenses.md b/_bmad-output/implementation-artifacts/spec-2-1-review-recorded-expenses.md
new file mode 100644
index 0000000..148e85a
--- /dev/null
+++ b/_bmad-output/implementation-artifacts/spec-2-1-review-recorded-expenses.md
@@ -0,0 +1,95 @@
+---
+title: 'Story 2.1: Review Recorded Expenses'
+type: 'feature'
+created: '2026-09-16'
+status: 'done'
+route: 'dispatch'
+review_loop_iteration: 0
+baseline_commit: '7acbffa7e5e6b98e5b49c3d56f88cbac0f0b13b7'
+context:
+  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
+---
+
+<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">
+
+## Intent
+
+**Problem:** Expenses can be captured, but the app still shows placeholder recent activity and a placeholder Review route. The user needs to confirm recently recorded expenses from Home and browse all recorded expenses from Review.
+
+**Approach:** Add ordered Expense retrieval through explicit DTOs, render Home Recent Expenses as the latest 5 rows, replace the Review placeholder with a simple all-expenses list, and make each row navigate toward the future Expense Detail route without implementing detail/edit/delete yet.
+
+## Boundaries & Constraints
+
+**Always:** Expense rows show INR amount, Category name, date, and optional description as secondary text when present. Ordering is `ExpenseDate` descending then `CreatedAt` descending. Home shows exactly 5 recent expenses when more exist; Review shows all expenses in one simple scroll. TanStack Query owns list server state and imports typed DTO/API functions from `shared/api`. Empty Home keeps Add Expense visible and Recent Expenses copy remains `No expenses yet. Add your first one above.` Empty Review copy is `No expenses recorded yet.` with a clear route back to Home.
+
+**Never:** Do not implement Expense Detail, Edit, Delete, search, filter, sort controls, grouping, pagination, infinite scroll, charts, analytics, summaries, category management, auth, or new architecture/state libraries in this story.
+
+## I/O & Edge-Case Matrix
+
+| Scenario | Input / State | Expected Output / Behavior | Error Handling |
+|----------|--------------|---------------------------|----------------|
+| Home recent expenses | More than 5 expenses exist | Home renders exactly 5 rows ordered by ExpenseDate desc then CreatedAt desc | If API fails, show concise list failure without hiding Add Expense |
+| Review all expenses | Any number of expenses exist | Review renders all rows with same row structure/order as Home | If API fails, show concise Review failure |
+| Optional description | Expense description is null/blank | Row omits secondary description text while still showing amount/category/date | N/A |
+| Empty Home | No expenses exist | Recent Expenses shows `No expenses yet. Add your first one above.` | Add Expense remains usable |
+| Empty Review | No expenses exist | Review shows `No expenses recorded yet.` and a Home route | N/A |
+| Row navigation affordance | User activates a row | App navigates to `/expenses/{id}` for future detail | Detail route may remain a placeholder until Story 2.2 |
+
+</frozen-after-approval>
+
+## Code Map
+
+- `_bmad-output/implementation-artifacts/epic-2-context.md` -- Epic 2 review/list/detail boundaries and no advanced Review controls.
+- `_bmad-output/implementation-artifacts/spec-1-3-validate-fast-expense-capture-with-clear-feedback.md` -- completed Add Expense mutation/invalidations; preserve create behavior and query invalidation intent.
+- `backend/Features/Expenses/ExpenseService.cs` and `ExpenseEndpoints.cs` -- add ordered list retrieval alongside create without exposing entities.
+- `backend/Features/Expenses/ExpenseDto.cs` -- current create DTO lacks Category name; add or introduce a list DTO that includes Category display data for rows.
+- `frontend/src/shared/api/expenses.ts` -- add typed list DTO/API function while preserving create API/error behavior.
+- `frontend/src/features/expenses/RecentExpenses.tsx` -- replace placeholder with query-backed Home recent list and failure/empty states.
+- `frontend/src/app/PlaceholderPage.tsx` / `App.tsx` -- replace Review placeholder with a real Review page; future detail route can remain placeholder.
+- `frontend/src/app/styles.css` -- add modest row/list styles consistent with existing surfaces.
+- `frontend/src/app/App.test.tsx` and `frontend/src/shared/api/expenses.test.ts` -- cover Home recent limit/order rendering, Review all/empty states, row navigation, and API client shape.
+- `tests/backend-integration/CategoryApiTests.cs` -- add ordered retrieval tests while preserving Docker/Testcontainers setup.
+
+## Tasks & Acceptance
+
+**Execution:**
+- [x] `backend/Features/Expenses/**` -- add GET expense list endpoint/service method with explicit row DTO including Category name and stable ordering -- supports Home and Review without leaking entities.
+- [x] `frontend/src/shared/api/expenses.ts` -- add list DTO/API function and query key usage compatible with existing create invalidations -- keeps the frontend/backend contract typed.
+- [x] `frontend/src/features/expenses/RecentExpenses.tsx` and new Review component/page as needed -- render Home limit and Review all-expense rows, empty/failure states, and row navigation affordance -- satisfies user-facing review behavior.
+- [x] `frontend/src/app/App.tsx` / routing -- wire Review page and future `/expenses/:expenseId` placeholder route without implementing detail -- enables row navigation now and Story 2.2 continuation.
+- [x] `frontend/src/app/styles.css` -- add list/row styling and accessible focus affordances without redesign -- keeps UX consistent.
+- [x] `frontend/src/app/App.test.tsx`, `frontend/src/shared/api/expenses.test.ts`, `tests/backend-integration/**` -- add focused tests for ordered retrieval, Home recent limit, Review all/empty, and row navigation -- verifies the matrix.
+
+**Acceptance Criteria:**
+- Given expenses exist, when Home renders, then Recent Expenses shows 5 or fewer ordered rows with amount, Category, date, and optional description.
+- Given expenses exist, when Review renders, then all expenses use the same row structure and ordering as Home.
+- Given no expenses exist, when Home or Review renders, then the finalized empty-state copy appears in the right context.
+- Given a row is activated, when navigation occurs, then the URL targets the future Expense Detail route and no inline edit/delete actions are shown.
+
+## Implementation Notes
+
+- Added `GET /api/expenses` returning explicit list-row DTOs with Category name and ordered by ExpenseDate descending, CreatedAt descending, then Id descending for deterministic ties.
+- Added query-backed Home Recent Expenses, shared expense row/list UI, a real Review page, and a future detail placeholder route at `/expenses/:expenseId`.
+- Review patch added Home/Review loading states, Review route failure coverage, list refetch-after-create coverage, and backend empty-list retrieval coverage.
+
+## Spec Change Log
+
+## Review Triage Log
+
+- low / patch: Review load failure state existed but was not covered at the route boundary. Added a `/review` rejection test asserting `Expenses could not be loaded. Try refreshing.` while the Review heading remains visible.
+- medium / patch: Successful create invalidated expense list queries but no test proved Home Recent Expenses refreshed. Added a test that starts empty, saves an expense, then verifies the refetched recent row appears.
+- low / patch: Home and Review briefly showed empty-state copy while the expense list query was pending. Added `Loading expenses...` states and tests for both surfaces.
+- low / patch: Identical ExpenseDate and CreatedAt values could still produce unstable ordering. Added Id descending as a deterministic tertiary sort.
+- low / patch: Backend retrieval tests covered populated lists but not the empty-list contract. Added `Expenses_endpoint_returns_empty_list_when_no_expenses_exist`.
+- false: Findings claiming `ReviewPage.tsx`, `ExpenseList.tsx`, and row behavior were absent were disproven by the files and passing frontend build/tests.
+- false: Adding a backend recent-limit endpoint is not required by Story 2.1; the approved scope uses one all-expenses reader with Home applying the display limit, and the MVP is single-user.
+- false: Renaming the backend integration fixture and README/appsettings documentation updates are not concrete implementation blockers for Story 2.1.
+
+## Verification
+
+**Commands:**
+- `npm --prefix frontend test` -- passed: 2 files, 34 tests.
+- `npm --prefix frontend run build` -- passed: TypeScript/Vite build succeeded.
+- `dotnet build backend/backend.csproj --no-restore` -- passed: backend compiled with 0 warnings/errors.
+- `dotnet build tests/backend-integration/backend-integration.csproj --no-restore` -- passed on sequential rerun; warning NU1903 for transitive `SSH.NET` vulnerability remains.
+- `docker info --format '{{.ServerVersion}}'` -- blocked earlier in this session because Docker daemon was unavailable at `/Users/wallstreet62/.docker/run/docker.sock`; Testcontainers suite not run per no-Docker local rule.
diff --git a/_bmad-output/implementation-artifacts/spec-2-2-view-and-edit-expense-details.md b/_bmad-output/implementation-artifacts/spec-2-2-view-and-edit-expense-details.md
new file mode 100644
index 0000000..eabacaa
--- /dev/null
+++ b/_bmad-output/implementation-artifacts/spec-2-2-view-and-edit-expense-details.md
@@ -0,0 +1,92 @@
+---
+title: 'Story 2.2: View and Edit Expense Details'
+type: 'feature'
+created: '2026-09-16'
+status: 'done'
+route: 'dispatch'
+review_loop_iteration: 0
+baseline_commit: '7acbffa7e5e6b98e5b49c3d56f88cbac0f0b13b7'
+context:
+  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
+---
+
+<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">
+
+## Intent
+
+**Problem:** Expense rows now navigate to a placeholder detail route, but users cannot inspect a saved expense or correct mistakes. The MVP needs a read-only Expense Detail surface and an edit flow for amount, Category, date, and optional description.
+
+**Approach:** Add Expense detail/update REST endpoints with explicit DTOs, render a real detail route, add an edit route/form that reuses the Add Expense validation/category-chip pattern, and refresh list/detail server state after updates.
+
+## Boundaries & Constraints
+
+**Always:** Detail shows amount, Category, date, and description when present, read-only by default. Edit and Delete actions are visible on the detail surface, but only Edit is functional in this story; Delete may remain a Story 2.3 placeholder/action affordance. Edit pre-populates amount, selected Category chip, date, and optional description. Save uses an explicit update DTO, returns to Detail, shows `Expense updated.`, and invalidates expense list/detail/summary state. Cancel or Back discards unsaved changes and returns to Detail. Create/update validation rules and ProblemDetails handling match Add Expense.
+
+**Never:** Do not implement delete confirmation/delete API, inline row edit/delete controls, audit history, undo, soft delete, merchant/payment/tags/currency fields, search/filter/grouping, auth, new state libraries, CQRS/MediatR, Docker changes, or startup auto-migrations.
+
+## I/O & Edge-Case Matrix
+
+| Scenario | Input / State | Expected Output / Behavior | Error Handling |
+|----------|--------------|---------------------------|----------------|
+| Detail render | Existing expense id | Read-only detail shows INR amount, Category name, date, optional description, Edit and Delete actions | Missing id returns not-found UI without crashing |
+| Edit open | User activates Edit | Form is pre-populated with existing values and category chips | Category load failure shows concise feedback |
+| Valid update | User changes amount/category/date/description and saves | API updates row; user returns to detail; `Expense updated.` appears; lists/detail refresh | Preserve form during operation failure |
+| Invalid edit | Missing/invalid amount/category/date or overlong description | Frontend blocks save with inline feedback; backend repeats validation with ValidationProblemDetails | Preserve entered values |
+| Cancel/back | User changes fields then cancels or goes back | Unsaved changes are discarded and original detail remains unchanged | N/A |
+
+</frozen-after-approval>
+
+## Code Map
+
+- `_bmad-output/implementation-artifacts/epic-2-context.md` -- Epic 2 detail/edit constraints and validation/refresh expectations.
+- `_bmad-output/implementation-artifacts/spec-2-1-review-recorded-expenses.md` -- completed row navigation, list DTO/API/query keys, and Review route continuity.
+- `backend/Domain/Expense.cs` -- add update behavior preserving CreatedAt and refreshing UpdatedAt.
+- `backend/Features/Expenses/ExpenseService.cs`, `ExpenseEndpoints.cs`, DTO files -- add get-by-id and update service methods/endpoints using explicit DTOs and existing validation guardrails.
+- `frontend/src/shared/api/expenses.ts` -- add detail DTO/API functions, update request, query keys, and typed error reuse.
+- `frontend/src/features/expenses/AddExpensePanel.tsx` -- reuse validation concepts/copy; extract only if it keeps the patch smaller and clearer.
+- `frontend/src/app/App.tsx` -- replace detail placeholder route with real detail and edit routes.
+- `frontend/src/features/expenses/**` or `frontend/src/app/**` -- add detail/edit components using existing Surface, Button, ExpenseList formatting style, and category chips.
+- `frontend/src/app/App.test.tsx`, `frontend/src/shared/api/expenses.test.ts`, `tests/backend-integration/**` -- cover detail render, edit prefill/save/cancel/validation, API contracts, valid/invalid update.
+
+## Tasks & Acceptance
+
+**Execution:**
+- [x] `backend/Domain/Expense.cs` -- add update method for editable fields with validation-compatible invariants and UpdatedAt refresh -- keeps domain state coherent.
+- [x] `backend/Features/Expenses/**` -- add `GET /api/expenses/{id}` and `PUT /api/expenses/{id}` with explicit detail/update DTOs, category-name resolution, not-found handling, and validation problem responses -- supports detail/edit without leaking entities.
+- [x] `frontend/src/shared/api/expenses.ts` -- add detail/update DTOs, API functions, and query keys while preserving create/list behavior -- keeps typed boundary and invalidation consistent.
+- [x] `frontend/src/app/App.tsx` plus detail/edit components -- render read-only detail, Edit/Delete actions, pre-populated edit form, cancel/back behavior, update success feedback, and not-found/failure states -- completes the user workflow.
+- [x] `frontend/src/app/styles.css` -- add modest detail/edit styles and focus affordances without redesign -- keeps UX consistent.
+- [x] `frontend/src/app/App.test.tsx`, `frontend/src/shared/api/expenses.test.ts`, `tests/backend-integration/**` -- add focused tests for detail retrieval/rendering, prefilled edit, valid/invalid update, cancel, state refresh, and DTO/API shape -- verifies the matrix.
+
+**Acceptance Criteria:**
+- Given a user opens an existing expense row, when Detail renders, then it is read-only and shows amount, Category, date, and optional description plus Edit/Delete actions.
+- Given the user edits valid values, when Save succeeds, then the API updates the expense, the user returns to Detail, and `Expense updated.` appears with fresh data.
+- Given validation fails on edit, when frontend or backend validation runs, then inline feedback appears and entered values are preserved.
+- Given the user cancels edit, when they return to Detail, then unsaved changes are discarded.
+
+## Implementation Notes
+
+- Added explicit expense detail/update backend contracts: `GET /api/expenses/{id}` returns a detail DTO with Category name, and `PUT /api/expenses/{id}` validates through shared service rules, rejects missing categories, updates editable fields, preserves `CreatedAt`, and refreshes `UpdatedAt`.
+- Added real Detail and Edit routes. Detail is read-only and shows amount, Category, date, optional description, Edit, and disabled Delete affordance for Story 2.3. Edit pre-populates the existing values, reuses the Add Expense validation/category-chip pattern, preserves form data on failures, and returns to Detail with `Expense updated.` after save.
+- Added typed frontend API functions/query keys for detail/update plus update invalidation for list/detail/summary state.
+- Review patch seeds the updated detail into TanStack Query cache, avoids refetch-on-mount from replacing freshly updated detail, keeps unsaved edit values from being overwritten by background detail-cache changes, disables edit save when categories fail to load, and handles an unexpected missing detail after backend update without null-forgiving throw.
+
+## Spec Change Log
+
+## Review Triage Log
+
+- medium / patch: Updated detail could display stale cached values beside `Expense updated.`. Seeded `expenseKeys.detail(id)` with the update response, narrowed invalidation to list/summary state, disabled detail refetch-on-mount when cached data exists, and added a test asserting updated amount/category/date/description render after save.
+- medium / patch: Edit form rehydrated from every detail query data change, risking unsaved input loss during background cache updates. Added one-shot hydration per expense id and a cache-update test proving unsaved amount remains intact.
+- medium / patch: Edit save remained available when category chips failed to load, allowing save with an invisible selected category. Updated copy and disabled Save while category loading has failed; added frontend coverage.
+- low / patch: Backend update refetched joined detail with a null-forgiving operator. Returned not-found if the post-update detail lookup unexpectedly fails.
+- false: Current Month summary remaining placeholder is Epic 4 scope; Story 2.2 invalidates summary state for future summary implementation but does not calculate summaries.
+- false: Bare not-found bodies, README updates, fixture renaming, and disabled Delete explanation are not blockers for Story 2.2; Delete behavior is explicitly reserved for Story 2.3.
+
+## Verification
+
+**Commands:**
+- `npm --prefix frontend test` -- passed: 2 files, 46 tests.
+- `npm --prefix frontend run build` -- passed: TypeScript/Vite build succeeded.
+- `dotnet build backend/backend.csproj --no-restore` -- passed: backend compiled with 0 warnings/errors.
+- `dotnet build tests/backend-integration/backend-integration.csproj --no-restore` -- passed: integration test project compiled; warning NU1903 for transitive `SSH.NET` vulnerability remains.
+- `docker info --format '{{.ServerVersion}}'` -- blocked: Docker daemon unavailable at `/Users/wallstreet62/.docker/run/docker.sock`, so Testcontainers execution was not run.
diff --git a/_bmad-output/implementation-artifacts/spec-2-3-delete-an-expense-with-confirmation.md b/_bmad-output/implementation-artifacts/spec-2-3-delete-an-expense-with-confirmation.md
new file mode 100644
index 0000000..fc706f3
--- /dev/null
+++ b/_bmad-output/implementation-artifacts/spec-2-3-delete-an-expense-with-confirmation.md
@@ -0,0 +1,86 @@
+---
+title: 'Story 2.3: Delete an Expense with Confirmation'
+type: 'feature'
+created: '2026-09-16'
+status: 'in-review'
+route: 'dispatch'
+review_loop_iteration: 0
+baseline_commit: '7acbffa7e5e6b98e5b49c3d56f88cbac0f0b13b7'
+context:
+  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
+---
+
+<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">
+
+## Intent
+
+**Problem:** Expense Detail exposes a Delete affordance, but deletion is not implemented. Users need to remove an incorrect expense only after an explicit confirmation step.
+
+**Approach:** Add an Expense delete endpoint/service method, make the Detail Delete action open an accessible confirmation dialog, delete through the API on confirmation, refresh relevant server state, and return the user to Review with `Expense deleted.` feedback.
+
+## Boundaries & Constraints
+
+**Always:** Delete is only available from Expense Detail, never inline on Home/Review rows. Confirmation dialog has clear title/explanation, Cancel, and visually destructive Delete action. Cancel closes the dialog and leaves the expense visible. Confirm deletes the Expense through the API, invalidates list/detail/summary state, navigates back to Review, and shows `Expense deleted.`. Failure keeps the user in context and shows concise actionable feedback near the dialog/action.
+
+**Never:** Do not add undo, trash, archive, soft-delete recovery, bulk delete, row-level delete controls, auth/user ownership, audit history, or category deletion behavior. Do not alter the no-Docker local setup.
+
+## I/O & Edge-Case Matrix
+
+| Scenario | Input / State | Expected Output / Behavior | Error Handling |
+|----------|--------------|---------------------------|----------------|
+| Open confirmation | User activates Delete on Detail | Accessible confirmation dialog opens with Cancel and destructive Delete | N/A |
+| Cancel delete | User cancels dialog | Dialog closes; expense remains visible and unchanged | N/A |
+| Confirm delete | User confirms | API deletes expense; Review shows `Expense deleted.`; deleted row no longer appears after refresh | N/A |
+| Delete failure | API/network delete fails | User stays on Detail/dialog context with actionable failure feedback | Preserve expense detail |
+| Missing expense | API returns not-found on delete | Treat as failure/not-found feedback without crashing | Preserve navigation context |
+
+</frozen-after-approval>
+
+## Code Map
+
+- `_bmad-output/implementation-artifacts/epic-2-context.md` -- delete confirmation, feedback, accessibility, and no-undo constraints.
+- `_bmad-output/implementation-artifacts/spec-2-2-view-and-edit-expense-details.md` -- completed Detail route/action surface and update-query continuity.
+- `backend/Features/Expenses/ExpenseService.cs`, `ExpenseEndpoints.cs` -- add delete service/endpoint with not-found handling.
+- `frontend/src/shared/api/expenses.ts` -- add delete API function and reuse query keys/errors.
+- `frontend/src/features/expenses/ExpenseDetailPage.tsx` -- replace disabled Delete affordance with dialog state, confirm/cancel behavior, mutation, and failure feedback.
+- `frontend/src/app/ReviewPage.tsx` -- display route-state success feedback after delete while preserving empty/list behavior.
+- `frontend/src/app/styles.css` -- add minimal dialog/destructive action styling and focus affordances.
+- `frontend/src/app/App.test.tsx`, `frontend/src/shared/api/expenses.test.ts`, `tests/backend-integration/**` -- cover confirm, cancel, success refresh/navigation, failure, API shape, backend deletion/not-found.
+
+## Tasks & Acceptance
+
+**Execution:**
+- [x] `backend/Features/Expenses/**` -- add `DELETE /api/expenses/{id}` and service method returning no-content or not-found without deleting unrelated rows -- completes REST delete contract.
+- [x] `frontend/src/shared/api/expenses.ts` and mutation hook as needed -- add delete function, typed failure behavior, and query invalidations for lists/detail/summary -- keeps server state fresh.
+- [x] `frontend/src/features/expenses/ExpenseDetailPage.tsx` -- implement accessible confirmation dialog, cancel, confirm, pending/failure states, and delete success navigation -- completes user workflow.
+- [x] `frontend/src/app/ReviewPage.tsx` -- show `Expense deleted.` from route state after successful delete -- provides compact feedback in the destination context.
+- [x] `frontend/src/app/styles.css` -- add minimal modal/destructive styling consistent with current UI -- keeps UX clear without redesign.
+- [x] Tests -- add frontend/API/backend coverage for confirm, cancel, success feedback/list refresh, failure, deletion, and not-found -- verifies the matrix.
+
+**Acceptance Criteria:**
+- Given the user chooses Delete on Expense Detail, when the dialog opens, then confirmation is required before any API delete occurs.
+- Given the user cancels, when the dialog closes, then the expense remains visible.
+- Given the user confirms deletion and the API succeeds, when Review renders, then `Expense deleted.` appears and the deleted expense is absent from refreshed lists.
+- Given delete fails, when feedback is shown, then the user remains in context and can retry or cancel.
+
+## Implementation Notes
+
+## Spec Change Log
+
+## Review Triage Log
+
+## Verification
+
+**Commands:**
+- `npm --prefix frontend test` -- expected: frontend delete/API tests pass.
+- `npm --prefix frontend run build` -- expected: TypeScript/Vite build succeeds.
+- `dotnet build backend/backend.csproj --no-restore` -- expected: backend compiles.
+- `dotnet build tests/backend-integration/backend-integration.csproj --no-restore` -- expected: backend integration test project compiles.
+- `dotnet test tests/backend-integration/backend-integration.csproj --no-build` -- expected: run only when Docker is available; otherwise record Docker/Testcontainers unavailability as an environment blocker.
+
+**Results:**
+- `npm --prefix frontend test` -- passed, 54 tests.
+- `npm --prefix frontend run build` -- passed.
+- `dotnet build backend/backend.csproj --no-restore` -- passed.
+- `dotnet build tests/backend-integration/backend-integration.csproj --no-restore` -- passed with existing `SSH.NET` NU1903 advisory warning.
+- `dotnet test tests/backend-integration/backend-integration.csproj --no-build` -- blocked by Docker/Testcontainers unavailable after rerun with sandbox escalation; failed to connect to Docker endpoints at `/var/run/docker.sock` and `/Users/wallstreet62/.docker/run/docker.sock`.
diff --git a/backend/Features/Expenses/UpdateExpenseRequest.cs b/backend/Features/Expenses/UpdateExpenseRequest.cs
new file mode 100644
index 0000000..d10a773
--- /dev/null
+++ b/backend/Features/Expenses/UpdateExpenseRequest.cs
@@ -0,0 +1,7 @@
+namespace Backend.Features.Expenses;
+
+public sealed record UpdateExpenseRequest(
+    decimal Amount,
+    Guid CategoryId,
+    DateOnly ExpenseDate,
+    string? Description);
diff --git a/frontend/src/app/ReviewPage.tsx b/frontend/src/app/ReviewPage.tsx
new file mode 100644
index 0000000..8f7875d
--- /dev/null
+++ b/frontend/src/app/ReviewPage.tsx
@@ -0,0 +1,44 @@
+import { useQuery } from "@tanstack/react-query";
+import { Link, useLocation } from "react-router-dom";
+import { ExpenseList } from "../features/expenses/ExpenseList";
+import { expenseKeys, getExpenses } from "../shared/api/expenses";
+import { Surface } from "../shared/ui/Surface";
+
+type LocationState = {
+  successMessage?: string;
+};
+
+export function ReviewPage() {
+  const location = useLocation();
+  const successMessage = (location.state as LocationState | null)?.successMessage;
+  const expensesQuery = useQuery({
+    queryKey: expenseKeys.lists(),
+    queryFn: getExpenses
+  });
+
+  const expenses = expensesQuery.data ?? [];
+
+  return (
+    <main className="review-page" aria-labelledby="review-title">
+      <Surface>
+        <div className="section-heading">
+          <p className="eyebrow">Review</p>
+          <h1 id="review-title">Recorded expenses</h1>
+        </div>
+        {successMessage ? <p className="inline-success detail-message review-message" role="status">{successMessage}</p> : null}
+        {expensesQuery.isLoading ? (
+          <p className="inline-note">Loading expenses...</p>
+        ) : expensesQuery.isError ? (
+          <p className="inline-error" role="alert">Expenses could not be loaded. Try refreshing.</p>
+        ) : expenses.length > 0 ? (
+          <ExpenseList expenses={expenses} ariaLabel="Recorded expenses" />
+        ) : (
+          <div className="empty-review">
+            <p className="empty-state">No expenses recorded yet.</p>
+            <Link className="text-link" to="/">Back to Home</Link>
+          </div>
+        )}
+      </Surface>
+    </main>
+  );
+}
diff --git a/frontend/src/features/expenses/ExpenseDetailPage.tsx b/frontend/src/features/expenses/ExpenseDetailPage.tsx
new file mode 100644
index 0000000..387ac46
--- /dev/null
+++ b/frontend/src/features/expenses/ExpenseDetailPage.tsx
@@ -0,0 +1,170 @@
+import { useQuery } from "@tanstack/react-query";
+import { Pencil, Trash2 } from "lucide-react";
+import { useEffect, useRef, useState } from "react";
+import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
+import { expenseKeys, getExpense } from "../../shared/api/expenses";
+import { Surface } from "../../shared/ui/Surface";
+import { amountFormatter, formatExpenseDate } from "./formatters";
+import { useDeleteExpense } from "./useDeleteExpense";
+
+type LocationState = {
+  successMessage?: string;
+};
+
+export function ExpenseDetailPage() {
+  const { expenseId } = useParams();
+  const location = useLocation();
+  const navigate = useNavigate();
+  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
+  const cancelButtonRef = useRef<HTMLButtonElement>(null);
+  const successMessage = (location.state as LocationState | null)?.successMessage;
+  const deleteMutation = useDeleteExpense();
+  const {
+    data: expense,
+    error,
+    isError,
+    isLoading
+  } = useQuery({
+    queryKey: expenseKeys.detail(expenseId ?? ""),
+    queryFn: () => getExpense(expenseId!),
+    enabled: Boolean(expenseId),
+    refetchOnMount: false
+  });
+
+  useEffect(() => {
+    if (isConfirmingDelete) {
+      cancelButtonRef.current?.focus();
+    }
+  }, [isConfirmingDelete]);
+
+  function openDeleteDialog() {
+    deleteMutation.reset();
+    setIsConfirmingDelete(true);
+  }
+
+  function closeDeleteDialog() {
+    setIsConfirmingDelete(false);
+    deleteMutation.reset();
+  }
+
+  function handleDeleteConfirm() {
+    if (!expense) {
+      return;
+    }
+
+    deleteMutation.mutate(expense.id, {
+      onSuccess: () => {
+        navigate("/review", {
+          replace: true,
+          state: { successMessage: "Expense deleted." }
+        });
+      }
+    });
+  }
+
+  const deleteErrorMessage = deleteMutation.error instanceof Error
+    ? deleteMutation.error.message
+    : "Expense could not be deleted. Try again.";
+
+  return (
+    <main className="detail-page" aria-label="Expense detail">
+      <Surface className="detail-surface">
+        <div className="section-heading detail-heading">
+          <div>
+            <p className="eyebrow">Expense Detail</p>
+            <h1>Expense details</h1>
+          </div>
+          <Link className="text-link" to="/review">Back to Review</Link>
+        </div>
+
+        {successMessage ? <p className="inline-success detail-message" role="status">{successMessage}</p> : null}
+
+        {isLoading ? <p className="inline-note">Loading expense...</p> : null}
+
+        {isError ? (
+          <div className="empty-review">
+            <p className="inline-error">{error instanceof Error ? error.message : "Expense could not be loaded. Try refreshing."}</p>
+          </div>
+        ) : null}
+
+        {expense ? (
+          <>
+            <dl className="detail-list">
+              <div>
+                <dt>Amount</dt>
+                <dd className="detail-amount">{amountFormatter.format(expense.amount)}</dd>
+              </div>
+              <div>
+                <dt>Category</dt>
+                <dd>{expense.categoryName}</dd>
+              </div>
+              <div>
+                <dt>Date</dt>
+                <dd>{formatExpenseDate(expense.expenseDate)}</dd>
+              </div>
+              {expense.description?.trim() ? (
+                <div>
+                  <dt>Description</dt>
+                  <dd>{expense.description}</dd>
+                </div>
+              ) : null}
+            </dl>
+
+            <div className="detail-actions" aria-label="Expense actions">
+              <Link className="button button-primary button-link" to={`/expenses/${expense.id}/edit`}>
+                <Pencil aria-hidden="true" size={18} />
+                Edit
+              </Link>
+              <button className="button danger-action" onClick={openDeleteDialog} type="button">
+                <Trash2 aria-hidden="true" size={18} />
+                Delete
+              </button>
+            </div>
+
+            {isConfirmingDelete ? (
+              <div className="dialog-backdrop" role="presentation">
+                <section
+                  aria-describedby="delete-expense-description"
+                  aria-labelledby="delete-expense-title"
+                  aria-modal="true"
+                  className="confirm-dialog"
+                  role="dialog"
+                >
+                  <div>
+                    <h2 id="delete-expense-title">Delete this expense?</h2>
+                    <p className="supporting-copy" id="delete-expense-description">
+                      This permanently removes the expense from your records.
+                    </p>
+                  </div>
+                  {deleteMutation.isError ? (
+                    <p className="inline-error" role="alert">{deleteErrorMessage}</p>
+                  ) : null}
+                  <div className="dialog-actions">
+                    <button
+                      className="button button-ghost"
+                      disabled={deleteMutation.isPending}
+                      onClick={closeDeleteDialog}
+                      ref={cancelButtonRef}
+                      type="button"
+                    >
+                      Cancel
+                    </button>
+                    <button
+                      className="button danger-action danger-action-solid"
+                      disabled={deleteMutation.isPending}
+                      onClick={handleDeleteConfirm}
+                      type="button"
+                    >
+                      <Trash2 aria-hidden="true" size={18} />
+                      {deleteMutation.isPending ? "Deleting..." : "Delete"}
+                    </button>
+                  </div>
+                </section>
+              </div>
+            ) : null}
+          </>
+        ) : null}
+      </Surface>
+    </main>
+  );
+}
diff --git a/frontend/src/features/expenses/ExpenseEditPage.tsx b/frontend/src/features/expenses/ExpenseEditPage.tsx
new file mode 100644
index 0000000..94204ba
--- /dev/null
+++ b/frontend/src/features/expenses/ExpenseEditPage.tsx
@@ -0,0 +1,224 @@
+import { useQuery } from "@tanstack/react-query";
+import { Calendar, IndianRupee } from "lucide-react";
+import { FormEvent, useEffect, useId, useState } from "react";
+import { Link, useNavigate, useParams } from "react-router-dom";
+import { useCategories } from "../categories/useCategories";
+import { expenseKeys, getExpense } from "../../shared/api/expenses";
+import { Button } from "../../shared/ui/Button";
+import { Surface } from "../../shared/ui/Surface";
+import { applyExpenseServerError, FieldErrors, validateExpenseForm } from "./expenseFormValidation";
+import { useUpdateExpense } from "./useUpdateExpense";
+
+export function ExpenseEditPage() {
+  const { expenseId } = useParams();
+  const navigate = useNavigate();
+  const amountId = useId();
+  const dateId = useId();
+  const descriptionId = useId();
+  const amountErrorId = useId();
+  const categoryErrorId = useId();
+  const dateErrorId = useId();
+  const descriptionErrorId = useId();
+  const formErrorId = useId();
+  const { data: categories = [], isError: categoriesError, isLoading: categoriesLoading } = useCategories();
+  const updateExpense = useUpdateExpense();
+  const {
+    data: expense,
+    error,
+    isError,
+    isLoading
+  } = useQuery({
+    queryKey: expenseKeys.detail(expenseId ?? ""),
+    queryFn: () => getExpense(expenseId!),
+    enabled: Boolean(expenseId)
+  });
+  const [amount, setAmount] = useState("");
+  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
+  const [expenseDate, setExpenseDate] = useState("");
+  const [description, setDescription] = useState("");
+  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
+  const [formError, setFormError] = useState("");
+  const [hydratedExpenseId, setHydratedExpenseId] = useState<string | null>(null);
+
+  useEffect(() => {
+    if (!expense || hydratedExpenseId === expense.id) {
+      return;
+    }
+
+    setAmount(expense.amount.toFixed(2));
+    setSelectedCategoryId(expense.categoryId);
+    setExpenseDate(expense.expenseDate);
+    setDescription(expense.description ?? "");
+    setFieldErrors({});
+    setFormError("");
+    setHydratedExpenseId(expense.id);
+  }, [expense, hydratedExpenseId]);
+
+  function detailPath() {
+    return `/expenses/${expenseId}`;
+  }
+
+  function handleSubmit(event: FormEvent<HTMLFormElement>) {
+    event.preventDefault();
+    setFormError("");
+
+    const validation = validateExpenseForm(amount, selectedCategoryId, expenseDate, description);
+    setFieldErrors(validation.fieldErrors);
+
+    if (!validation.isValid || !expenseId) {
+      return;
+    }
+
+    updateExpense.mutate(
+      {
+        id: expenseId,
+        request: {
+          amount: validation.amount,
+          categoryId: selectedCategoryId!,
+          expenseDate,
+          description: description.trim() ? description.trim() : null
+        }
+      },
+      {
+        onSuccess: () => {
+          navigate(detailPath(), {
+            replace: true,
+            state: { successMessage: "Expense updated." }
+          });
+        },
+        onError: (error) => {
+          applyExpenseServerError(error, setFieldErrors, setFormError);
+        }
+      }
+    );
+  }
+
+  return (
+    <main className="detail-page" aria-label="Edit expense">
+      <Surface className="detail-surface">
+        <div className="section-heading detail-heading">
+          <div>
+            <p className="eyebrow">Edit Expense</p>
+            <h1>Edit expense</h1>
+          </div>
+          <Link className="text-link" to={detailPath()}>Back to Detail</Link>
+        </div>
+
+        {isLoading ? <p className="inline-note">Loading expense...</p> : null}
+
+        {isError ? (
+          <div className="empty-review">
+            <p className="inline-error">{error instanceof Error ? error.message : "Expense could not be loaded. Try refreshing."}</p>
+          </div>
+        ) : null}
+
+        {expense ? (
+          <form className="expense-form" aria-label="Edit expense form" onSubmit={handleSubmit}>
+            <label className="field amount-field" htmlFor={amountId}>
+              <span>Amount</span>
+              <span className="currency-input">
+                <IndianRupee aria-hidden="true" size={18} />
+                <input
+                  id={amountId}
+                  inputMode="decimal"
+                  aria-describedby={fieldErrors.amount ? amountErrorId : undefined}
+                  aria-invalid={fieldErrors.amount ? "true" : "false"}
+                  className={fieldErrors.amount ? "invalid-control" : undefined}
+                  onChange={(event) => {
+                    setAmount(event.target.value);
+                    setFieldErrors((current) => ({ ...current, amount: undefined }));
+                    setFormError("");
+                  }}
+                  type="text"
+                  placeholder="0.00"
+                  value={amount}
+                />
+              </span>
+              {fieldErrors.amount ? <span className="field-error" id={amountErrorId}>{fieldErrors.amount}</span> : null}
+            </label>
+
+            <fieldset
+              aria-describedby={fieldErrors.category ? categoryErrorId : undefined}
+              className="category-field"
+            >
+              <legend>Category</legend>
+              {categoriesLoading ? <p className="inline-note">Loading categories...</p> : null}
+              {categoriesError ? <p className="inline-error">Categories could not be loaded. Try refreshing before saving.</p> : null}
+              <div className="chip-list" aria-label="Expense categories">
+                {categories.map((category) => {
+                  const isSelected = category.id === selectedCategoryId;
+
+                  return (
+                    <button
+                      aria-pressed={isSelected}
+                      className={`category-chip ${isSelected ? "selected" : ""}`}
+                      key={category.id}
+                      onClick={() => {
+                        setSelectedCategoryId(category.id);
+                        setFieldErrors((current) => ({ ...current, category: undefined }));
+                        setFormError("");
+                      }}
+                      type="button"
+                    >
+                      {category.name}
+                    </button>
+                  );
+                })}
+              </div>
+              {fieldErrors.category ? <p className="field-error" id={categoryErrorId}>{fieldErrors.category}</p> : null}
+            </fieldset>
+
+            <label className="field" htmlFor={dateId}>
+              <span>Date</span>
+              <span className="date-input">
+                <Calendar aria-hidden="true" size={18} />
+                <input
+                  id={dateId}
+                  aria-describedby={fieldErrors.date ? dateErrorId : undefined}
+                  aria-invalid={fieldErrors.date ? "true" : "false"}
+                  className={fieldErrors.date ? "invalid-control" : undefined}
+                  onChange={(event) => {
+                    setExpenseDate(event.target.value);
+                    setFieldErrors((current) => ({ ...current, date: undefined }));
+                    setFormError("");
+                  }}
+                  type="date"
+                  value={expenseDate}
+                />
+              </span>
+              {fieldErrors.date ? <span className="field-error" id={dateErrorId}>{fieldErrors.date}</span> : null}
+            </label>
+
+            <label className="field" htmlFor={descriptionId}>
+              <span>Description <span className="muted">(optional)</span></span>
+              <input
+                id={descriptionId}
+                aria-describedby={fieldErrors.description ? descriptionErrorId : undefined}
+                aria-invalid={fieldErrors.description ? "true" : "false"}
+                className={fieldErrors.description ? "invalid-control" : undefined}
+                onChange={(event) => {
+                  setDescription(event.target.value);
+                  setFieldErrors((current) => ({ ...current, description: undefined }));
+                  setFormError("");
+                }}
+                type="text"
+                placeholder="A short note"
+                value={description}
+              />
+              {fieldErrors.description ? <span className="field-error" id={descriptionErrorId}>{fieldErrors.description}</span> : null}
+            </label>
+
+            {formError ? <p className="inline-error" id={formErrorId} role="alert">{formError}</p> : null}
+
+            <div className="form-actions">
+              <Button aria-describedby={formError ? formErrorId : undefined} disabled={updateExpense.isPending || categoriesError} type="submit">
+                {updateExpense.isPending ? "Saving..." : "Save changes"}
+              </Button>
+              <Link className="button button-ghost button-link" to={detailPath()}>Cancel</Link>
+            </div>
+          </form>
+        ) : null}
+      </Surface>
+    </main>
+  );
+}
diff --git a/frontend/src/features/expenses/ExpenseList.tsx b/frontend/src/features/expenses/ExpenseList.tsx
new file mode 100644
index 0000000..dd22036
--- /dev/null
+++ b/frontend/src/features/expenses/ExpenseList.tsx
@@ -0,0 +1,29 @@
+import { Link } from "react-router-dom";
+import type { ExpenseListItemDto } from "../../shared/api/expenses";
+import { amountFormatter, formatExpenseDate } from "./formatters";
+
+type ExpenseListProps = {
+  expenses: ExpenseListItemDto[];
+  ariaLabel: string;
+};
+
+export function ExpenseList({ expenses, ariaLabel }: ExpenseListProps) {
+  return (
+    <ul className="expense-list" aria-label={ariaLabel}>
+      {expenses.map((expense) => (
+        <li key={expense.id}>
+          <Link className="expense-row" to={`/expenses/${expense.id}`}>
+            <span className="expense-row-main">
+              <span className="expense-amount">{amountFormatter.format(expense.amount)}</span>
+              <span className="expense-category">{expense.categoryName}</span>
+            </span>
+            <span className="expense-row-meta">
+              <span>{formatExpenseDate(expense.expenseDate)}</span>
+              {expense.description?.trim() ? <span>{expense.description}</span> : null}
+            </span>
+          </Link>
+        </li>
+      ))}
+    </ul>
+  );
+}
diff --git a/frontend/src/features/expenses/expenseFormValidation.ts b/frontend/src/features/expenses/expenseFormValidation.ts
new file mode 100644
index 0000000..1e1cc27
--- /dev/null
+++ b/frontend/src/features/expenses/expenseFormValidation.ts
@@ -0,0 +1,107 @@
+import { ExpenseApiError } from "../../shared/api/expenses";
+
+export type FieldErrors = {
+  amount?: string;
+  category?: string;
+  date?: string;
+  description?: string;
+};
+
+const maxAmount = 9999999999.99;
+const maxDescriptionLength = 240;
+
+export function validateExpenseForm(
+  amount: string,
+  categoryId: string | null,
+  expenseDate: string,
+  description: string
+) {
+  const fieldErrors: FieldErrors = {};
+  const trimmedAmount = amount.trim();
+
+  if (!trimmedAmount) {
+    fieldErrors.amount = "Enter an amount to save this expense.";
+  } else if (!/^-?\d+(\.\d+)?$/.test(trimmedAmount)) {
+    fieldErrors.amount = "Enter a valid amount using numbers only.";
+  } else if (!/^-?\d+(\.\d{1,2})?$/.test(trimmedAmount)) {
+    fieldErrors.amount = "Enter an amount with no more than two decimal places.";
+  }
+
+  const numericAmount = Number(trimmedAmount);
+  if (!fieldErrors.amount && numericAmount <= 0) {
+    fieldErrors.amount = "Enter an amount greater than zero.";
+  } else if (!fieldErrors.amount && numericAmount > maxAmount) {
+    fieldErrors.amount = "Enter an amount below ₹10,000,000,000.";
+  }
+
+  if (!categoryId) {
+    fieldErrors.category = "Choose a category to save this expense.";
+  }
+
+  if (!isValidExpenseDate(expenseDate)) {
+    fieldErrors.date = "Enter a valid date in YYYY-MM-DD format.";
+  }
+
+  if (description.trim().length > maxDescriptionLength) {
+    fieldErrors.description = "Keep description under 240 characters.";
+  }
+
+  return {
+    amount: numericAmount,
+    fieldErrors,
+    isValid: Object.keys(fieldErrors).length === 0
+  };
+}
+
+export function applyExpenseServerError(
+  error: unknown,
+  setFieldErrors: (updater: (current: FieldErrors) => FieldErrors) => void,
+  setFormError: (message: string) => void
+) {
+  if (error instanceof ExpenseApiError) {
+    const mappedErrors = mapValidationErrors(error.validationErrors);
+    setFieldErrors((current) => ({ ...current, ...mappedErrors }));
+    setFormError(Object.keys(mappedErrors).length > 0
+      ? "Review the highlighted fields and try again."
+      : error.message);
+    return;
+  }
+
+  setFormError("Expense could not be saved. Check the details and try again.");
+}
+
+function isValidExpenseDate(value: string) {
+  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
+    return false;
+  }
+
+  const [year, month, day] = value.split("-").map(Number);
+  const date = new Date(Date.UTC(year, month - 1, day));
+
+  return date.getUTCFullYear() === year
+    && date.getUTCMonth() === month - 1
+    && date.getUTCDate() === day;
+}
+
+function mapValidationErrors(validationErrors: Record<string, string[]>) {
+  return Object.entries(validationErrors).reduce<FieldErrors>((result, [field, messages]) => {
+    const message = messages[0];
+    const normalizedField = field.toLowerCase();
+
+    if (!message) {
+      return result;
+    }
+
+    if (normalizedField === "amount") {
+      result.amount = message;
+    } else if (normalizedField === "categoryid") {
+      result.category = message;
+    } else if (normalizedField === "expensedate") {
+      result.date = message;
+    } else if (normalizedField === "description") {
+      result.description = message;
+    }
+
+    return result;
+  }, {});
+}
diff --git a/frontend/src/features/expenses/formatters.ts b/frontend/src/features/expenses/formatters.ts
new file mode 100644
index 0000000..0686c10
--- /dev/null
+++ b/frontend/src/features/expenses/formatters.ts
@@ -0,0 +1,17 @@
+export const amountFormatter = new Intl.NumberFormat("en-IN", {
+  style: "currency",
+  currency: "INR",
+  minimumFractionDigits: 2,
+  maximumFractionDigits: 2
+});
+
+const dateFormatter = new Intl.DateTimeFormat("en-IN", {
+  day: "numeric",
+  month: "short",
+  year: "numeric",
+  timeZone: "UTC"
+});
+
+export function formatExpenseDate(value: string) {
+  return dateFormatter.format(new Date(`${value}T00:00:00.000Z`));
+}
diff --git a/frontend/src/features/expenses/useDeleteExpense.ts b/frontend/src/features/expenses/useDeleteExpense.ts
new file mode 100644
index 0000000..2a83d5a
--- /dev/null
+++ b/frontend/src/features/expenses/useDeleteExpense.ts
@@ -0,0 +1,15 @@
+import { useMutation, useQueryClient } from "@tanstack/react-query";
+import { deleteExpense, expenseKeys } from "../../shared/api/expenses";
+
+export function useDeleteExpense() {
+  const queryClient = useQueryClient();
+
+  return useMutation({
+    mutationFn: deleteExpense,
+    onSuccess: (_result, id) => {
+      queryClient.removeQueries({ queryKey: expenseKeys.detail(id) });
+      void queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
+      void queryClient.invalidateQueries({ queryKey: ["current-month-summary"] });
+    }
+  });
+}
diff --git a/frontend/src/features/expenses/useUpdateExpense.ts b/frontend/src/features/expenses/useUpdateExpense.ts
new file mode 100644
index 0000000..8397968
--- /dev/null
+++ b/frontend/src/features/expenses/useUpdateExpense.ts
@@ -0,0 +1,20 @@
+import { useMutation, useQueryClient } from "@tanstack/react-query";
+import { expenseKeys, updateExpense, UpdateExpenseRequest } from "../../shared/api/expenses";
+
+type UpdateExpenseVariables = {
+  id: string;
+  request: UpdateExpenseRequest;
+};
+
+export function useUpdateExpense() {
+  const queryClient = useQueryClient();
+
+  return useMutation({
+    mutationFn: ({ id, request }: UpdateExpenseVariables) => updateExpense(id, request),
+    onSuccess: (expense) => {
+      queryClient.setQueryData(expenseKeys.detail(expense.id), expense);
+      void queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
+      void queryClient.invalidateQueries({ queryKey: ["current-month-summary"] });
+    }
+  });
+}
diff --git a/frontend/src/shared/api/expenses.test.ts b/frontend/src/shared/api/expenses.test.ts
new file mode 100644
index 0000000..3a3e01e
--- /dev/null
+++ b/frontend/src/shared/api/expenses.test.ts
@@ -0,0 +1,312 @@
+import { afterEach, describe, expect, it, vi } from "vitest";
+import { ExpenseApiError, createExpense, deleteExpense, getExpense, getExpenses, updateExpense } from "./expenses";
+
+describe("getExpenses", () => {
+  afterEach(() => {
+    vi.unstubAllGlobals();
+  });
+
+  it("gets ordered expense rows from the expense endpoint", async () => {
+    const fetchMock = vi.fn().mockResolvedValue({
+      ok: true,
+      json: async () => [
+        {
+          id: "20000000-0000-0000-0000-000000000001",
+          amount: 125.5,
+          categoryId: "10000000-0000-0000-0000-000000000001",
+          categoryName: "Food",
+          expenseDate: "2026-09-16",
+          description: "Lunch",
+          createdAt: "2026-09-16T08:00:00Z"
+        }
+      ]
+    });
+    vi.stubGlobal("fetch", fetchMock);
+
+    await expect(getExpenses()).resolves.toEqual([
+      {
+        id: "20000000-0000-0000-0000-000000000001",
+        amount: 125.5,
+        categoryId: "10000000-0000-0000-0000-000000000001",
+        categoryName: "Food",
+        expenseDate: "2026-09-16",
+        description: "Lunch",
+        createdAt: "2026-09-16T08:00:00Z"
+      }
+    ]);
+    expect(fetchMock).toHaveBeenCalledWith("http://localhost:5000/api/expenses");
+  });
+
+  it("throws an actionable failure when expense rows cannot be loaded", async () => {
+    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
+      ok: false,
+      status: 500
+    }));
+
+    await expect(getExpenses()).rejects.toThrow("Expenses could not be loaded. Try refreshing.");
+  });
+});
+
+describe("getExpense", () => {
+  afterEach(() => {
+    vi.unstubAllGlobals();
+  });
+
+  it("gets an expense detail from the expense detail endpoint", async () => {
+    const fetchMock = vi.fn().mockResolvedValue({
+      ok: true,
+      json: async () => ({
+        id: "20000000-0000-0000-0000-000000000001",
+        amount: 125.5,
+        categoryId: "10000000-0000-0000-0000-000000000001",
+        categoryName: "Food",
+        expenseDate: "2026-09-16",
+        description: "Lunch",
+        createdAt: "2026-09-16T08:00:00Z",
+        updatedAt: "2026-09-16T09:00:00Z"
+      })
+    });
+    vi.stubGlobal("fetch", fetchMock);
+
+    await expect(getExpense("20000000-0000-0000-0000-000000000001")).resolves.toMatchObject({
+      id: "20000000-0000-0000-0000-000000000001",
+      categoryName: "Food",
+      updatedAt: "2026-09-16T09:00:00Z"
+    });
+    expect(fetchMock).toHaveBeenCalledWith("http://localhost:5000/api/expenses/20000000-0000-0000-0000-000000000001");
+  });
+
+  it("throws not-found feedback when the detail endpoint returns 404", async () => {
+    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
+      ok: false,
+      status: 404
+    }));
+
+    await expect(getExpense("missing")).rejects.toThrow("Expense not found.");
+  });
+});
+
+describe("createExpense", () => {
+  afterEach(() => {
+    vi.unstubAllGlobals();
+  });
+
+  it("posts a create request to the expense endpoint", async () => {
+    const fetchMock = vi.fn().mockResolvedValue({
+      ok: true,
+      json: async () => ({
+        id: "20000000-0000-0000-0000-000000000001",
+        amount: 125.5,
+        categoryId: "10000000-0000-0000-0000-000000000001",
+        expenseDate: "2026-09-16",
+        description: null,
+        createdAt: "2026-09-16T08:00:00Z",
+        updatedAt: "2026-09-16T08:00:00Z"
+      })
+    });
+    vi.stubGlobal("fetch", fetchMock);
+
+    await createExpense({
+      amount: 125.5,
+      categoryId: "10000000-0000-0000-0000-000000000001",
+      expenseDate: "2026-09-16",
+      description: null
+    });
+
+    expect(fetchMock).toHaveBeenCalledWith(
+      "http://localhost:5000/api/expenses",
+      expect.objectContaining({
+        method: "POST",
+        headers: {
+          "Content-Type": "application/json"
+        },
+        body: JSON.stringify({
+          amount: 125.5,
+          categoryId: "10000000-0000-0000-0000-000000000001",
+          expenseDate: "2026-09-16",
+          description: null
+        })
+      })
+    );
+  });
+
+  it("throws parsed validation details when the expense endpoint returns ValidationProblemDetails", async () => {
+    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
+      ok: false,
+      status: 400,
+      json: async () => ({
+        type: "https://tools.ietf.org/html/rfc9110#section-15.5.1",
+        title: "One or more validation errors occurred.",
+        status: 400,
+        errors: {
+          Amount: ["Enter an amount with no more than two decimal places."],
+          CategoryId: ["Choose a category."]
+        }
+      })
+    }));
+
+    const thrown = await createExpense({
+      amount: 125.5,
+      categoryId: "10000000-0000-0000-0000-000000000001",
+      expenseDate: "2026-09-16",
+      description: null
+    }).catch((error: unknown) => error);
+
+    expect(thrown).toBeInstanceOf(ExpenseApiError);
+    expect(thrown).toMatchObject({
+      message: "One or more validation errors occurred.",
+      status: 400,
+      validationErrors: {
+        Amount: ["Enter an amount with no more than two decimal places."],
+        CategoryId: ["Choose a category."]
+      }
+    });
+  });
+
+  it("throws a generic actionable failure when the response body cannot be parsed", async () => {
+    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
+      ok: false,
+      status: 500,
+      json: async () => {
+        throw new Error("No JSON");
+      }
+    }));
+
+    await expect(createExpense({
+      amount: 125.5,
+      categoryId: "10000000-0000-0000-0000-000000000001",
+      expenseDate: "2026-09-16",
+      description: null
+    })).rejects.toMatchObject({
+      message: "Expense could not be saved. Check the details and try again.",
+      status: 500,
+      validationErrors: {}
+    });
+  });
+});
+
+describe("updateExpense", () => {
+  afterEach(() => {
+    vi.unstubAllGlobals();
+  });
+
+  it("puts an update request to the expense detail endpoint", async () => {
+    const fetchMock = vi.fn().mockResolvedValue({
+      ok: true,
+      json: async () => ({
+        id: "20000000-0000-0000-0000-000000000001",
+        amount: 200,
+        categoryId: "10000000-0000-0000-0000-000000000002",
+        categoryName: "Transport",
+        expenseDate: "2026-09-17",
+        description: "Auto ride",
+        createdAt: "2026-09-16T08:00:00Z",
+        updatedAt: "2026-09-16T09:00:00Z"
+      })
+    });
+    vi.stubGlobal("fetch", fetchMock);
+
+    await expect(updateExpense("20000000-0000-0000-0000-000000000001", {
+      amount: 200,
+      categoryId: "10000000-0000-0000-0000-000000000002",
+      expenseDate: "2026-09-17",
+      description: "Auto ride"
+    })).resolves.toMatchObject({
+      amount: 200,
+      categoryName: "Transport"
+    });
+
+    expect(fetchMock).toHaveBeenCalledWith(
+      "http://localhost:5000/api/expenses/20000000-0000-0000-0000-000000000001",
+      expect.objectContaining({
+        method: "PUT",
+        headers: {
+          "Content-Type": "application/json"
+        },
+        body: JSON.stringify({
+          amount: 200,
+          categoryId: "10000000-0000-0000-0000-000000000002",
+          expenseDate: "2026-09-17",
+          description: "Auto ride"
+        })
+      })
+    );
+  });
+
+  it("throws parsed validation details when update returns ValidationProblemDetails", async () => {
+    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
+      ok: false,
+      status: 400,
+      json: async () => ({
+        title: "One or more validation errors occurred.",
+        status: 400,
+        errors: {
+          Amount: ["Enter an amount with no more than two decimal places."]
+        }
+      })
+    }));
+
+    const thrown = await updateExpense("20000000-0000-0000-0000-000000000001", {
+      amount: 12.345,
+      categoryId: "10000000-0000-0000-0000-000000000001",
+      expenseDate: "2026-09-16",
+      description: null
+    }).catch((error: unknown) => error);
+
+    expect(thrown).toBeInstanceOf(ExpenseApiError);
+    expect(thrown).toMatchObject({
+      message: "One or more validation errors occurred.",
+      status: 400,
+      validationErrors: {
+        Amount: ["Enter an amount with no more than two decimal places."]
+      }
+    });
+  });
+});
+
+describe("deleteExpense", () => {
+  afterEach(() => {
+    vi.unstubAllGlobals();
+  });
+
+  it("deletes an expense through the expense detail endpoint", async () => {
+    const fetchMock = vi.fn().mockResolvedValue({
+      ok: true,
+      status: 204
+    });
+    vi.stubGlobal("fetch", fetchMock);
+
+    await expect(deleteExpense("20000000-0000-0000-0000-000000000001")).resolves.toBeUndefined();
+
+    expect(fetchMock).toHaveBeenCalledWith(
+      "http://localhost:5000/api/expenses/20000000-0000-0000-0000-000000000001",
+      expect.objectContaining({
+        method: "DELETE"
+      })
+    );
+  });
+
+  it("throws not-found feedback when delete returns 404", async () => {
+    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
+      ok: false,
+      status: 404
+    }));
+
+    await expect(deleteExpense("missing")).rejects.toMatchObject({
+      message: "Expense was not found. It may have already been deleted.",
+      status: 404
+    });
+  });
+
+  it("throws actionable feedback when delete fails", async () => {
+    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
+      ok: false,
+      status: 500
+    }));
+
+    await expect(deleteExpense("20000000-0000-0000-0000-000000000001")).rejects.toMatchObject({
+      message: "Expense could not be deleted. Try again.",
+      status: 500
+    });
+  });
+});

--- END UNIFIED DIFF ---
