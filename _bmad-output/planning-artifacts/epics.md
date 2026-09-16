---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - _bmad-output/planning-artifacts/briefs/brief-bmad-expense-tracker-2026-09-15/brief.md
  - _bmad-output/planning-artifacts/prds/prd-bmad-expense-tracker-2026-09-15/prd.md
  - _bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/EXPERIENCE.md
  - _bmad-output/planning-artifacts/architecture/architecture-bmad-expense-tracker-2026-09-15/ARCHITECTURE-SPINE.md
  - _bmad-output/specs/spec-bmad-expense-tracker/SPEC.md
---

# bmad-expense-tracker - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for bmad-expense-tracker, decomposing the requirements from the Product Brief, PRD, UX Design and Experience spines, Architecture Spine, and canonical SPEC into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: The user can create an Expense with amount, Category, date, and optional description; amounts display in INR (₹), and the MVP does not require or store per-expense currency.

FR2: A new Expense defaults the date to today while keeping the date editable before saving.

FR3: The system prevents saving an Expense until amount, Category, and date are valid, with understandable validation feedback.

FR4: The common Expense entry path keeps recording under 30 seconds by requiring only amount entry, Category selection, and save when using the default date and no description; amount is first, Add Expense is prominent, and no unrelated navigation is required.

FR5: The user can view Recent Expenses in a list ordered by Expense date descending with a stable same-date tie-breaker, and each row shows enough identifying information including amount, Category, date, and description when available or accessible.

FR6: The user can view an individual Expense detail from a list or summary context; detail shows amount, Category, date, optional description, and access to edit/delete.

FR7: The user can edit an existing Expense's amount, Category, date, or description; edit uses create validation, updates lists/summaries after save, and cancel leaves the Expense unchanged.

FR8: The user can delete an existing Expense only after confirmation; confirm removes it from Recent Expenses and summaries, cancel leaves it unchanged, and the MVP does not provide undo, trash, archive, or recovery.

FR9: The product provides immediately available Default Categories for Expense creation and editing, including everyday options such as Food, Transport, Shopping, Bills, Entertainment, Health, Education, and Other.

FR10: The user can create a Custom Category with a valid user-provided name, and the created Category becomes available for Expense creation and editing.

FR11: The user can rename an existing Custom Category with a valid name, preserving its association with existing Expenses.

FR12: The user can delete a Custom Category only when it is unused; deletion of an in-use Custom Category is blocked with explanatory feedback and no automatic reassignment or orphaning.

FR13: Default Categories are protected from deletion and inappropriate modification, remaining available for Expense creation and editing.

FR14: The product shows total spending for the Current Month, including Expenses dated within the Current Month and excluding Expenses dated outside it.

FR15: The product shows Current Month spending grouped by Category, including only Expenses dated within the Current Month, helping the user understand where money went without advanced analytics.

FR16: The product shows Recent Expenses from the Current Month as part of the main spending-awareness experience, with enough information to identify each Expense.

FR17: The Spending Summary updates after relevant Expense add, edit, and delete operations; the MVP excludes previous-month comparisons, percentage changes, trends, and month-over-month analytics.

### NonFunctional Requirements

NFR1: The application must be approachable, mobile-friendly, low-friction, and understandable without instructions, with the common Expense entry flow kept simple and quick.

NFR2: Common screens and Expense save operations should feel responsive for the expected small personal dataset; production-scale load targets are not required.

NFR3: Expense and Category operations must maintain consistent associations and accurate Spending Summaries; Category deletion must not leave stale, orphaned, or inconsistent data.

NFR4: The interface must meet basic accessibility expectations: semantic structure, meaningful labels, keyboard access where applicable, associated validation feedback, comfortable touch targets, and sufficient usability for common assistive technologies.

NFR5: The single-user learning MVP does not require real authentication, but it must avoid unnecessary exposure of Expense data, validate inputs, and follow reasonable basic web security practices.

NFR6: Save, edit, and delete operations should provide visible success or failure feedback while preserving user context and entered data where applicable.

NFR7: Amount values must be positive, may include up to 2 decimal places, display with INR (₹), and must not introduce per-expense currency, exchange rates, or currency conversion.

NFR8: The MVP must preserve the narrow Record -> Review -> Understand scope and avoid features that slow Expense entry or broaden the product into full personal finance.

NFR9: Verification must cover backend business rules, PostgreSQL-sensitive API/EF behavior, meaningful frontend form and interaction behavior, and a few critical E2E journeys without targeting 100 percent coverage.

### Additional Requirements

- Build the MVP as a React/Vite TypeScript frontend, ASP.NET Core Web API backend, and PostgreSQL database, keeping UI, API contracts, business rules, and persistence separately identifiable.
- Organize the backend as one deployable ASP.NET Core Web API project with internal layers/folders for `Features/Expenses`, `Features/Categories`, optional `Features/Summaries`, `Domain`, `Data` or `Infrastructure`, and `Common` only when needed.
- Keep endpoints/controllers thin; feature services coordinate validation, domain rules, and persistence; Domain must not depend on ASP.NET Core or EF Core; Data owns DbContext, EF configuration, migrations, and provider-specific persistence.
- Organize frontend TypeScript code as `app`, `features/expenses`, `features/categories`, `shared/ui`, and `shared/api`; DTO types and API functions live in `shared/api` and raw backend shapes must not leak through UI components.
- Use TanStack Query for API-backed server state and mutations; use React state/hooks for local UI state; use React Router for navigation; do not add Redux, Zustand, or another global client store.
- Use explicit request/response DTOs for every endpoint; do not expose EF Core/domain entities directly through the public API.
- Use resource-oriented REST endpoints for Expenses and Categories plus `GET /api/summaries/current-month`; do not introduce CQRS, MediatR, or another mediator framework.
- Model Category as a first-class entity and Expense as storing `CategoryId`; do not snapshot Category name on Expense, so Category renames preserve existing Expense associations.
- Seed Default Categories as protected database rows; block edit/delete of defaults and block deletion of Custom Categories referenced by Expenses using business rules and FK integrity.
- Represent money with .NET `decimal` and PostgreSQL `numeric(12,2)`; floating-point monetary amounts and summaries are forbidden.
- Store `ExpenseDate` as .NET `DateOnly` mapped to PostgreSQL `date`; store `CreatedAt`/`UpdatedAt` as UTC timestamps mapped to `timestamptz`; use `CreatedAt` as the same-date ordering tie-breaker.
- Use fixed application timezone `Asia/Kolkata` for Current Month and "today" semantics; API dates use `YYYY-MM-DD`, and timestamps use ISO 8601.
- Calculate Current Month summary on demand in the backend from normalized Expenses and Categories; do not use summary tables, materialized views, background aggregation, or caching in the MVP.
- Backend summary logic filters by `ExpenseDate` within the Asia/Kolkata current calendar month, groups by `CategoryId`, resolves Category names, ranks nonzero Category breakdowns by amount descending, and returns Recent Expenses ordered by `ExpenseDate` descending then `CreatedAt` descending.
- Frontend validation is immediate for UX, but backend validation is authoritative for data integrity and business rules; API errors use ASP.NET Core `ProblemDetails` and `ValidationProblemDetails`.
- The MVP must have no login, registration, sessions, authorization policies, User table, UserId columns, or hardcoded current user.
- PostgreSQL runs locally as an installed service/application; frontend runs as Vite dev process; backend runs as ASP.NET Core dev process; backend config supports appsettings plus environment variables/user-secrets.
- EF Core migrations are committed and applied explicitly by developers; the app must not auto-run migrations on startup.
- Backend unit tests cover business/domain rules; backend integration tests cover API + EF Core + PostgreSQL behavior with Testcontainers PostgreSQL for persistence-sensitive scenarios; frontend tests cover meaningful component/form validation and interactions; E2E tests cover critical user journeys.
- The canonical SPEC and companion DESIGN, EXPERIENCE, and ARCHITECTURE-SPINE files are the complete preservation-validated contract for what to build, test, and validate.

### UX Design Requirements

UX-DR1: Implement the adopted visual tokens from DESIGN.md: warm off-white base surface, white raised surfaces, ink hierarchy, teal primary accent, semantic success/warning/danger colors, system UI typography, practical type scale, and specified spacing/radius values.

UX-DR2: Maintain a clean, dependable utility aesthetic: readable hierarchy, minimal depth, no broad gradients, no decorative accent overuse, no dense fintech/dashboard feel, and no nested heavy card treatment for every section.

UX-DR3: Implement a mobile-first responsive IA with Home, Review, and Categories destinations; Home is the default landing screen, Add Expense is not a separate navigation destination, and desktop preserves the same IA in a compact header or side navigation.

UX-DR4: Home must show inline Add Expense first, then Current Month summary, then Recent Expenses on mobile; desktop uses two columns with Add Expense and Current Month summary in the left/main column and Recent Expenses in the right column, with Add Expense remaining visually primary.

UX-DR5: Mobile navigation uses a bottom nav with Home, Review, and Categories; desktop adapts navigation without adding separate destinations.

UX-DR6: The Add Expense form is compact and immediately visible; amount is first and visually primary, shows ₹ in or beside the field, uses mobile-optimized numeric input where supported, accepts positive amounts only, rejects zero/negative values, allows up to 2 decimal places, and validates before save.

UX-DR7: Category selection in Add/Edit Expense uses directly visible wrapping Category chips for Default and Custom Categories with clear selected state, not a dropdown for the MVP.

UX-DR8: Date is a visible compact field that defaults to today, remains easy to change, and clearly displays the selected date.

UX-DR9: Description is visible after required fields, clearly optional, compact, visually secondary, and never blocks saving.

UX-DR10: After a successful Expense save, show `Expense saved.`, reset the form for quick additional entry, and update Current Month summary and Recent Expenses.

UX-DR11: Current Month total shows the total Expense amount for the Current Month using INR (₹) and updates after Expense add/edit/delete.

UX-DR12: Category breakdown is ranked by Current Month spending amount highest first, shows every Category with nonzero Current Month spending, includes Category name, amount, and a simple horizontal bar, and does not hide lower-ranked Categories behind expand/collapse.

UX-DR13: Home Recent Expenses shows exactly 5 Expenses ordered by Expense date descending then recorded time/CreatedAt descending; rows show amount, Category, date, and optional description as secondary text; row opens Expense Detail.

UX-DR14: Expense Review shows all recorded Expenses in one simple scrollable list ordered by Expense date descending then recorded time/CreatedAt descending, using the same row structure as Home; no grouping, pagination, infinite scroll, search, filtering, sorting, or analytics in the MVP.

UX-DR15: Expense rows open Expense Detail and do not show inline Edit/Delete controls directly.

UX-DR16: Expense Detail is read-only and shows amount, Category, date, and optional description, with Edit and Delete actions.

UX-DR17: Edit Expense uses the same form pattern as Add Expense, pre-populated with existing values; Save returns to Expense Detail, and Cancel/Back discards unsaved changes and returns without changing the Expense.

UX-DR18: Delete confirmation is a simple accessible dialog with concise title/explanation, Cancel action, and visually destructive Delete action; Expense deletion copy indicates permanent removal; no undo/recovery is required.

UX-DR19: Category Management has two sections: protected Default Categories with no edit/delete and Custom Categories with Add/Edit/Delete; Add/Edit uses a compact inline form on the Categories screen.

UX-DR20: Empty states must follow EXPERIENCE.md: Home keeps Add Expense usable, shows INR 0 total with no fake bars, and uses `No expenses yet. Add your first one above.`; Review uses `No expenses recorded yet.` with a clear route back to Home; Custom Categories uses `No custom categories yet. Add one to get started.`

UX-DR21: Success feedback uses compact transient toasts with specified copy for Expense saved/updated/deleted and Category added/updated/deleted.

UX-DR22: Validation errors stay in context with concise inline feedback near the relevant field/action and do not rely on toasts for errors requiring user action; include specified copy such as `Enter an amount to save this expense.`

UX-DR23: Operation failures keep the user in context, preserve entered data where applicable, and show concise actionable failure feedback near the relevant action or form area.

UX-DR24: Category name cannot be empty, and validation feedback appears near the name field.

UX-DR25: In-use Custom Category deletion is blocked before confirmation and explains `This category is used by existing expenses. Reassign those expenses before deleting it.`

UX-DR26: Accessibility floor requires meaningful labels, associated validation feedback, keyboard access for applicable fields/buttons/navigation/chips/confirmation actions, reading-order focus flow, comfortable touch targets, and no reliance on color alone for selected/error/destructive states.

### FR Coverage Map

FR1: Epic 1 - Create expense with amount, category, date, optional description, and INR display.

FR2: Epic 1 - Default new expense date to today while keeping it editable.

FR3: Epic 1 - Validate required expense fields with understandable feedback.

FR4: Epic 1 - Keep common expense entry fast, prominent, and free of unrelated navigation.

FR5: Epic 2 - View recent expenses in a predictable, identifiable list.

FR6: Epic 2 - View expense details from list or summary context.

FR7: Epic 2 - Edit an existing expense and keep dependent views current.

FR8: Epic 2 - Delete an expense only after confirmation.

FR9: Epic 1 - Provide default categories immediately for expense creation and editing.

FR10: Epic 3 - Create a valid custom category.

FR11: Epic 3 - Rename a custom category while preserving expense associations.

FR12: Epic 3 - Delete only unused custom categories and block in-use deletion.

FR13: Epic 3 - Protect default categories from destructive modification.

FR14: Epic 4 - Show total spending for the Current Month.

FR15: Epic 4 - Show Current Month spending grouped by Category.

FR16: Epic 4 - Show Current Month Recent Expenses.

FR17: Epic 4 - Update spending summary after relevant expense changes.

## Epic List

### Epic 1: Fast Expense Capture with Starter Categories
Users can open the app and quickly record an expense using amount, category, today's date, and optional description, with default categories available immediately.
**FRs covered:** FR1, FR2, FR3, FR4, FR9

### Epic 2: Expense Review and Maintenance
Users can review recorded expenses, inspect one expense, correct mistakes, and delete an expense only after confirmation.
**FRs covered:** FR5, FR6, FR7, FR8

### Epic 3: Simple Category Management
Users can manage custom categories while default categories remain protected and existing expense-category associations stay safe.
**FRs covered:** FR10, FR11, FR12, FR13

### Epic 4: Current-Month Spending Awareness
Users can understand current-month spending from the main experience through total spending, category breakdown, and current-month recent expenses that stay fresh after changes.
**FRs covered:** FR14, FR15, FR16, FR17

## Epic 1: Fast Expense Capture with Starter Categories

Users can open the app and quickly record an expense using amount, category, today's date, and optional description, with default categories available immediately.

### Story 1.1: Open the Home Experience with Starter Categories

As a single expense tracker user,
I want the app to open to a usable Home screen with starter categories available,
So that I can begin recording expenses without setup.

**Requirements:** FR9, NFR1, NFR4, NFR5, UX-DR1, UX-DR2, UX-DR3, UX-DR4, UX-DR5, UX-DR7, UX-DR26, Architecture AD-1, AD-2, AD-4, AD-9, AD-15, AD-17

**Acceptance Criteria:**

**Given** the application is run locally in the MVP development envelope
**When** the user opens the frontend
**Then** Home is the default landing surface
**And** the app exposes Home, Review, and Categories navigation without adding authentication, accounts, roles, permissions, User tables, UserId columns, sessions, or a hardcoded current user.

**Given** the backend and database are initialized for local development
**When** EF Core migrations are applied explicitly by the developer
**Then** protected Default Categories are seeded as database rows
**And** the starter set includes Food, Transport, Shopping, Bills, Entertainment, Health, Education, and Other.

**Given** the user opens Home on a mobile-width viewport
**When** the page renders
**Then** the inline Add Expense form is visible first
**And** the layout follows the mobile order Add Expense, Current Month summary, Recent Expenses.

**Given** the user opens Home on a desktop-width viewport
**When** the page renders
**Then** Home uses two columns with Add Expense and Current Month summary in the left/main column and Recent Expenses in the right column
**And** desktop navigation preserves the same Home, Review, and Categories information architecture.

**Given** frontend and backend code are created for this story
**When** the implementation is reviewed
**Then** frontend code is organized under `app`, `features/expenses`, `features/categories`, `shared/ui`, and `shared/api`
**And** backend code is organized as one ASP.NET Core Web API project with feature folders, Domain, Data or Infrastructure, and only genuinely needed Common helpers.

**Given** Default Categories are loaded for the Add Expense form
**When** the user views category choices
**Then** categories are shown as tappable wrapping chips with a clear selected state
**And** no dropdown is used for MVP category selection.

**Given** the UI renders shared surfaces and controls
**When** visual styles are inspected
**Then** the adopted DESIGN.md tokens are used for base/raised surfaces, ink hierarchy, teal primary accent, semantic colors, system typography, spacing, and radius
**And** the interface avoids broad gradients, decorative accent overuse, dense dashboard styling, and nested heavy card treatment.

**Given** the app shell and category foundation are implemented
**When** tests are run
**Then** frontend tests cover navigation/rendering of the Home shell and category chip availability
**And** backend integration tests cover seeded Default Categories against PostgreSQL behavior.

### Story 1.2: Create an Expense End-to-End

As a single expense tracker user,
I want to save an expense with only amount, category, and date required,
So that I can capture everyday spending before I forget it.

**Requirements:** FR1, FR2, FR4, NFR1, NFR2, NFR7, UX-DR6, UX-DR7, UX-DR8, UX-DR9, UX-DR10, Architecture AD-3, AD-5, AD-6, AD-7, AD-10, AD-11

**Acceptance Criteria:**

**Given** the user is on Home and Default Categories are available
**When** the user enters a positive amount, selects a Category, keeps today's default date, optionally leaves description empty, and saves
**Then** a new Expense is persisted
**And** the saved Expense contains amount, Category, date, and description only when provided.

**Given** the Add Expense form is ready for input
**When** the form renders
**Then** amount is the first required entry field and receives primary visual emphasis
**And** the amount control displays the INR symbol `₹` in or beside the field.

**Given** the user starts a new Expense
**When** the form initializes the date
**Then** the date defaults to today's date using the fixed application timezone `Asia/Kolkata`
**And** the date remains visible, compact, editable, and displayed as the selected date.

**Given** the user records a normal Expense using the default date and no description
**When** they complete the common path
**Then** the path requires only amount entry, Category chip selection, and Save
**And** no unrelated screen navigation is required.

**Given** the backend receives a create Expense request
**When** amount, CategoryId, and ExpenseDate are valid
**Then** the API creates the Expense through explicit request/response DTOs
**And** it does not expose EF Core or domain entities directly.

**Given** the Expense is persisted
**When** the database row is inspected
**Then** amount uses .NET `decimal` and PostgreSQL `numeric(12,2)`
**And** ExpenseDate uses .NET `DateOnly` mapped to PostgreSQL `date`
**And** CreatedAt and UpdatedAt are UTC `timestamptz` values.

**Given** currency handling is inspected
**When** an Expense is created or displayed
**Then** amounts display as INR (₹)
**And** the MVP does not store per-expense currency, exchange rates, conversion, or currency selection.

**Given** the Expense creation succeeds
**When** the API response is returned to the frontend
**Then** TanStack Query updates or invalidates relevant expense/category-backed server state
**And** React local state resets the Add Expense form for fast additional entry.

**Given** this story is implemented
**When** tests are run
**Then** backend unit or integration tests cover valid Expense creation, DTO mapping, decimal/date persistence, and no floating-point monetary use
**And** frontend tests cover successful Add Expense submission with optional description omitted.

### Story 1.3: Validate Fast Expense Capture with Clear Feedback

As a single expense tracker user,
I want clear validation and feedback while recording an expense,
So that I can fix mistakes quickly without losing context.

**Requirements:** FR3, FR4, NFR4, NFR6, NFR9, UX-DR21, UX-DR22, UX-DR23, UX-DR26, Architecture AD-14, AD-16

**Acceptance Criteria:**

**Given** the user attempts to save an Expense without an amount
**When** frontend validation runs
**Then** saving is prevented
**And** inline feedback near the amount field says `Enter an amount to save this expense.`

**Given** the user enters an amount
**When** the amount is zero, negative, non-numeric, or has more than 2 decimal places
**Then** saving is prevented
**And** the feedback is understandable to a user with basic-to-moderate software comfort.

**Given** the user attempts to save without a selected Category
**When** validation runs
**Then** saving is prevented
**And** inline feedback explains that a Category is required.

**Given** the user attempts to save without a valid date
**When** validation runs
**Then** saving is prevented
**And** inline feedback explains that a valid date is required.

**Given** a create request reaches the backend
**When** required fields or business rules are invalid
**Then** the backend repeats validation authoritatively
**And** returns ASP.NET Core `ValidationProblemDetails` or `ProblemDetails` with an appropriate HTTP status code.

**Given** a valid save fails due to an operation failure
**When** the failure is shown to the user
**Then** the user remains in the Add Expense context
**And** entered data is preserved where applicable
**And** concise actionable failure feedback appears near the relevant action or form area.

**Given** a valid save succeeds
**When** the Expense is created
**Then** compact transient feedback says `Expense saved.`
**And** the form resets for quick additional entry.

**Given** the Add Expense form is used with keyboard or assistive technology
**When** the user tabs through fields, Category chips, validation messages, and Save
**Then** focus follows reading order
**And** controls have meaningful labels
**And** validation feedback is associated with the relevant fields
**And** selected/error/destructive states do not rely on color alone.

**Given** this story is implemented
**When** verification is performed
**Then** frontend component tests cover required-field, amount, category, and date validation
**And** backend tests cover invalid create requests and ProblemDetails/ValidationProblemDetails responses.

## Epic 2: Expense Review and Maintenance

Users can review recorded expenses, inspect one expense, correct mistakes, and delete an expense only after confirmation.

### Story 2.1: Review Recorded Expenses

As a single expense tracker user,
I want to review recently recorded and all recorded expenses,
So that I can confirm what I captured and when.

**Requirements:** FR5, NFR1, NFR2, NFR4, UX-DR13, UX-DR14, UX-DR15, UX-DR20, Architecture AD-4, AD-5, AD-6, AD-7, AD-11, AD-16

**Acceptance Criteria:**

**Given** Expenses exist in the system
**When** the user opens Home
**Then** Recent Expenses are shown as clean rows containing amount, Category, date, and optional description as secondary text when present
**And** each row opens Expense Detail.

**Given** more than 5 Expenses exist
**When** Home renders Recent Expenses
**Then** Home shows exactly 5 Expenses
**And** they are ordered by ExpenseDate descending then CreatedAt descending as the stable same-date tie-breaker.

**Given** Expenses exist across any dates
**When** the user opens Review
**Then** Review shows all recorded Expenses in one simple scrollable list
**And** the list uses the same row structure and ordering as Home.

**Given** the user is on Review
**When** the list renders
**Then** the MVP does not provide grouping, pagination, infinite scroll, search, filtering, sorting, chart exploration, or analytics.

**Given** no Expenses exist
**When** Home renders
**Then** the Add Expense form remains visible and usable
**And** Recent Expenses shows `No expenses yet. Add your first one above.`

**Given** no Expenses exist
**When** Review renders
**Then** Review shows `No expenses recorded yet.`
**And** provides a clear route back to Home.

**Given** expenses are retrieved from the API
**When** the implementation is reviewed
**Then** the frontend imports typed DTOs and API functions from `shared/api`
**And** TanStack Query owns the server state for Expense lists.

**Given** this story is implemented
**When** tests are run
**Then** backend tests cover ordered expense retrieval
**And** frontend tests cover Home recent limit, Review all-expense rendering, empty states, and row navigation affordance.

### Story 2.2: View and Edit Expense Details

As a single expense tracker user,
I want to inspect and edit a recorded expense,
So that I can correct mistakes in amount, category, date, or description.

**Requirements:** FR6, FR7, NFR3, NFR4, NFR6, NFR7, UX-DR15, UX-DR16, UX-DR17, UX-DR21, UX-DR22, UX-DR23, Architecture AD-5, AD-6, AD-7, AD-10, AD-11, AD-14, AD-16

**Acceptance Criteria:**

**Given** the user opens an Expense row from Home or Review
**When** Expense Detail renders
**Then** it shows amount, Category, date, and description when provided
**And** it is read-only by default.

**Given** the user is on Expense Detail
**When** they inspect available actions
**Then** Edit and Delete actions are available from the detail surface
**And** list rows themselves do not show inline Edit/Delete controls.

**Given** the user chooses Edit
**When** the Edit Expense form opens
**Then** it uses the same Expense form pattern as Add Expense
**And** amount, Category chip selection, date, and optional description are pre-populated from the existing Expense.

**Given** the user edits amount, Category, date, or description with valid values
**When** they save
**Then** the Expense is updated through an explicit update DTO
**And** the user returns to Expense Detail
**And** compact transient feedback says `Expense updated.`

**Given** the user edits an Expense
**When** required fields or amount rules are invalid
**Then** the same frontend and backend validation rules from Expense creation apply
**And** invalid backend requests return `ValidationProblemDetails` or `ProblemDetails`.

**Given** the user is editing an Expense
**When** they choose Cancel or Back
**Then** unsaved changes are discarded
**And** the user returns to Expense Detail without changing the Expense.

**Given** an update succeeds
**When** Home, Review, Expense Detail, or relevant server state is viewed
**Then** the changed amount, Category, date, or description is reflected consistently
**And** stale list data is not shown after completion.

**Given** this story is implemented
**When** tests are run
**Then** backend tests cover valid and invalid Expense updates
**And** frontend tests cover detail rendering, pre-populated edit form behavior, save, cancel, and validation feedback.

### Story 2.3: Delete an Expense with Confirmation

As a single expense tracker user,
I want to delete an expense only after confirming,
So that accidental destructive changes are less likely.

**Requirements:** FR8, NFR3, NFR4, NFR6, UX-DR18, UX-DR21, UX-DR23, UX-DR26, Architecture AD-5, AD-6, AD-7, AD-14, AD-16

**Acceptance Criteria:**

**Given** the user is on Expense Detail
**When** they choose Delete
**Then** an accessible confirmation dialog appears before deletion
**And** the dialog includes a concise title/explanation, a Cancel action, and a visually destructive Delete action.

**Given** the delete confirmation is open
**When** the user cancels
**Then** the dialog closes
**And** the Expense remains unchanged and visible.

**Given** the delete confirmation is open
**When** the user confirms deletion
**Then** the Expense is deleted through the API
**And** compact transient feedback says `Expense deleted.`

**Given** an Expense is deleted
**When** the user returns to Home or Review
**Then** the deleted Expense no longer appears in Recent Expenses or Review
**And** relevant server state is invalidated or refreshed.

**Given** the MVP delete behavior is inspected
**When** an Expense is deleted
**Then** no undo, trash, archive, recovery, or soft-delete recovery workflow is required.

**Given** a valid delete request fails
**When** the failure is shown
**Then** the user remains in context
**And** concise actionable failure feedback appears near the relevant action or dialog area.

**Given** the confirmation dialog is used with keyboard or assistive technology
**When** the dialog opens
**Then** focus is managed into the dialog
**And** Cancel/Delete actions are keyboard accessible
**And** destructive state is not conveyed by color alone.

**Given** this story is implemented
**When** tests are run
**Then** backend tests cover Expense deletion and not-found/error cases
**And** frontend tests cover confirm, cancel, success feedback, and list refresh behavior.

## Epic 3: Simple Category Management

Users can manage custom categories while default categories remain protected and existing expense-category associations stay safe.

### Story 3.1: View Categories and Create a Custom Category

As a single expense tracker user,
I want to view default categories and add a custom category,
So that category choices can reflect my spending while still being simple.

**Requirements:** FR10, FR13, NFR1, NFR3, NFR4, NFR6, UX-DR19, UX-DR20, UX-DR21, UX-DR24, Architecture AD-5, AD-6, AD-7, AD-8, AD-9, AD-14, AD-16

**Acceptance Criteria:**

**Given** the user opens Categories
**When** the page renders
**Then** it shows two sections: Default Categories and Custom Categories
**And** Default Categories are shown as protected with no edit/delete controls.

**Given** the user has no Custom Categories
**When** the Custom Categories section renders
**Then** it shows `No custom categories yet. Add one to get started.`

**Given** the user enters a valid Custom Category name
**When** they save through the compact inline Categories form
**Then** the Custom Category is persisted
**And** compact transient feedback says `Category added.`

**Given** a Custom Category is created
**When** the user opens Add Expense or Edit Expense
**Then** the new Custom Category is available as a Category chip
**And** it uses the same selection behavior as Default Categories.

**Given** the user attempts to save a Custom Category with an empty name
**When** validation runs
**Then** saving is prevented
**And** inline feedback appears near the name field.

**Given** a create Category request reaches the backend
**When** the name is valid
**Then** the API uses explicit Category DTOs
**And** the created Category is marked as custom rather than default.

**Given** this story is implemented
**When** tests are run
**Then** backend tests cover Custom Category creation and empty-name validation
**And** frontend tests cover Categories section rendering, empty state, inline creation, validation, and chip availability in Expense forms.

### Story 3.2: Rename a Custom Category Safely

As a single expense tracker user,
I want to rename a custom category,
So that my category labels stay useful without losing existing expense history.

**Requirements:** FR11, FR13, NFR3, NFR4, NFR6, UX-DR19, UX-DR21, UX-DR24, Architecture AD-6, AD-7, AD-8, AD-9, AD-14, AD-16

**Acceptance Criteria:**

**Given** a Custom Category exists
**When** the user edits its name through the compact inline Categories form
**Then** the Category name is updated
**And** compact transient feedback says `Category updated.`

**Given** the renamed Custom Category is associated with existing Expenses
**When** the rename succeeds
**Then** existing Expenses remain associated with the same CategoryId
**And** those Expenses display the updated Category name.

**Given** the Category data model is inspected
**When** Expenses are persisted
**Then** Expense stores CategoryId as a foreign key
**And** Expense does not snapshot Category name.

**Given** the user attempts to rename a Custom Category to an empty name
**When** validation runs
**Then** saving is prevented
**And** inline feedback appears near the name field.

**Given** a Default Category exists
**When** the user views the Default Categories section
**Then** no rename control is available for that Default Category in the MVP.

**Given** an update Category request reaches the backend
**When** the Category is custom and the name is valid
**Then** the API updates the Category through an explicit update DTO
**And** backend validation prevents inappropriate Default Category modification.

**Given** this story is implemented
**When** tests are run
**Then** backend tests cover Custom Category rename, empty-name rejection, default modification rejection, and preserved Expense associations
**And** frontend tests cover rename success, validation feedback, and protected Default Category rendering.

### Story 3.3: Delete Only Unused Custom Categories

As a single expense tracker user,
I want category deletion to be allowed only when safe,
So that existing expenses are not orphaned or silently reassigned.

**Requirements:** FR12, FR13, NFR3, NFR4, NFR6, UX-DR18, UX-DR19, UX-DR21, UX-DR23, UX-DR25, UX-DR26, Architecture AD-6, AD-7, AD-8, AD-9, AD-14, AD-16

**Acceptance Criteria:**

**Given** a Custom Category has no associated Expenses
**When** the user initiates deletion
**Then** an accessible confirmation dialog appears
**And** the dialog includes a Cancel action and visually destructive Delete action.

**Given** the unused Custom Category delete confirmation is open
**When** the user confirms deletion
**Then** the Category is deleted
**And** compact transient feedback says `Category deleted.`
**And** the Category is no longer available in Add/Edit Expense Category chips.

**Given** the unused Custom Category delete confirmation is open
**When** the user cancels
**Then** the Category remains unchanged.

**Given** a Custom Category is associated with one or more Expenses
**When** the user attempts deletion
**Then** deletion is blocked before confirmation
**And** feedback says `This category is used by existing expenses. Reassign those expenses before deleting it.`

**Given** an in-use Custom Category deletion is blocked
**When** backend behavior is inspected
**Then** business rules and foreign-key integrity prevent deletion
**And** the product does not automatically reassign Expenses or create orphaned Expense records.

**Given** a Default Category exists
**When** the user views or attempts category maintenance
**Then** Default Categories cannot be deleted
**And** they remain available for Expense creation and editing.

**Given** this story is implemented
**When** tests are run
**Then** backend tests cover unused Custom Category deletion, in-use deletion blocking, Default Category deletion blocking, and FK integrity
**And** frontend tests cover confirmation, cancel, blocked feedback, success feedback, and chip removal after successful deletion.

## Epic 4: Current-Month Spending Awareness

Users can understand current-month spending from the main experience through total spending, category breakdown, and current-month recent expenses that stay fresh after changes.

### Story 4.1: Calculate Current-Month Summary on Demand

As a single expense tracker user,
I want current-month spending calculated consistently,
So that totals and category amounts are accurate and trustworthy.

**Requirements:** FR14, FR15, FR16, NFR2, NFR3, NFR7, NFR9, Architecture AD-6, AD-7, AD-10, AD-11, AD-12, AD-13, AD-16

**Acceptance Criteria:**

**Given** Expenses exist inside and outside the current calendar month
**When** the frontend calls `GET /api/summaries/current-month`
**Then** the backend calculates the summary on demand from normalized Expenses and Categories
**And** no summary table, materialized view, background aggregation, or caching is introduced for the MVP.

**Given** the backend calculates the Current Month
**When** date boundaries are determined
**Then** the fixed application timezone `Asia/Kolkata` is used
**And** the response includes `monthStart` and `monthEnd` using `YYYY-MM-DD`.

**Given** the summary includes total spending
**When** Expenses are dated within the Current Month
**Then** their amounts are included in `totalAmount`
**And** Expenses dated outside the Current Month are excluded.

**Given** the summary includes category breakdown
**When** Current Month Expenses are grouped
**Then** grouping is by CategoryId
**And** Category names are resolved from Category rows
**And** only Categories with nonzero Current Month spending are returned
**And** breakdown items are ranked by amount descending.

**Given** the summary includes recent expenses
**When** Current Month Recent Expenses are returned
**Then** only Expenses dated within the Current Month are included
**And** they are ordered by ExpenseDate descending then CreatedAt descending.

**Given** summary API contracts are inspected
**When** implementation is reviewed
**Then** `CurrentMonthSummaryResponse` and related nested DTOs are explicit API contracts
**And** EF/domain entities are not exposed directly.

**Given** this story is implemented
**When** tests are run
**Then** backend integration tests cover PostgreSQL-backed current-month filtering, category grouping, decimal totals, ordering, and Asia/Kolkata boundary behavior.

### Story 4.2: Show Current-Month Total, Category Breakdown, and Recent Expenses on Home

As a single expense tracker user,
I want the Home screen to show current-month total, category breakdown, and recent expenses,
So that I can understand where my money went this month without opening analytics.

**Requirements:** FR14, FR15, FR16, NFR1, NFR4, NFR8, UX-DR4, UX-DR11, UX-DR12, UX-DR13, UX-DR20, UX-DR26, Architecture AD-4, AD-5, AD-13

**Acceptance Criteria:**

**Given** the user opens Home
**When** the Current Month summary renders
**Then** total spending is displayed using INR (₹)
**And** it answers "How much did I spend this month?" from the main experience.

**Given** Current Month category spending exists
**When** the Category breakdown renders
**Then** every nonzero Category is shown
**And** each item includes Category name, amount, and a simple horizontal bar
**And** items are ranked highest spending first.

**Given** many nonzero Categories exist
**When** the Category breakdown renders
**Then** lower-ranked Categories are not hidden behind expand/collapse in the MVP
**And** no donut/pie chart or multiple chart types are introduced.

**Given** no Current Month Expenses exist
**When** Home renders
**Then** Current Month total visibly shows INR 0
**And** the Category breakdown uses empty copy instead of fake bars
**And** the Add Expense form remains fully visible and usable.

**Given** Current Month Recent Expenses exist
**When** Home renders the summary context
**Then** Recent Expenses include amount, Category, date, and optional description as secondary text
**And** rows open Expense Detail.

**Given** the Home layout is inspected on mobile
**When** content renders
**Then** Add Expense remains first, followed by Current Month summary and Recent Expenses
**And** common form controls are usable at common mobile widths.

**Given** the Home UI is inspected for accessibility
**When** users navigate with keyboard or assistive technology
**Then** summary content uses semantic structure
**And** visual bars do not rely on color alone to convey meaning.

**Given** this story is implemented
**When** tests are run
**Then** frontend tests cover total, ranked breakdown, zero state, no fake bars, Recent Expense row content, and responsive ordering expectations where practical.

### Story 4.3: Keep Spending Awareness Fresh After Expense Changes

As a single expense tracker user,
I want summaries and recent lists to update after expense changes,
So that the main experience never gives me stale spending information.

**Requirements:** FR17, NFR2, NFR3, NFR6, NFR8, NFR9, UX-DR10, UX-DR11, UX-DR21, UX-DR23, Architecture AD-5, AD-12, AD-13, AD-16

**Acceptance Criteria:**

**Given** the user adds an Expense dated within the Current Month
**When** the create operation succeeds
**Then** Current Month total, Category breakdown, and Current Month Recent Expenses update to include it.

**Given** the user adds an Expense dated outside the Current Month
**When** the create operation succeeds
**Then** Current Month total and Category breakdown do not include it
**And** it is not required to appear in Current Month Recent Expenses.

**Given** the user edits an Expense amount, Category, date, or description
**When** the update succeeds
**Then** affected list rows, Expense Detail, Current Month total, Category breakdown, and Current Month Recent Expenses reflect the change consistently.

**Given** the user deletes an Expense included in the Current Month summary
**When** deletion succeeds
**Then** Current Month total, Category breakdown, and Current Month Recent Expenses update to remove it.

**Given** TanStack Query manages server state
**When** create, update, or delete mutations succeed
**Then** relevant expenses, categories, and current-month summary queries are invalidated or updated
**And** no Redux, Zustand, or additional global client store is introduced.

**Given** the MVP scope is inspected
**When** summary freshness is implemented
**Then** previous-month comparisons, percentage changes, trends, month-over-month analytics, search/filter/sort-heavy review, and advanced analytics remain out of scope.

**Given** this story is implemented
**When** end-to-end verification is performed
**Then** at least one critical E2E journey covers recording an Expense and seeing the Home summary/list update
**And** meaningful frontend/backend tests cover summary freshness after create, update, and delete.
