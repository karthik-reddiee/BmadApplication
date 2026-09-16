# Epic 1 Context: Fast Expense Capture with Starter Categories

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Epic 1 establishes the usable starting point for the MVP: a single-user app that opens to Home, exposes starter categories immediately, and lets the user record an everyday expense quickly with only amount, category, and date required. It matters because the product's core value depends on fast manual capture before purchase details are forgotten, while preserving enough validation, persistence, and feedback to make the data trustworthy.

## Stories

- Story 1.1: Open the Home Experience with Starter Categories
- Story 1.2: Create an Expense End-to-End
- Story 1.3: Validate Fast Expense Capture with Clear Feedback

## Requirements & Constraints

The app must support creating an Expense with amount, Category, date, and optional description. Amounts display in INR using `₹`; the MVP must not require or store per-expense currency, exchange rates, conversion, or currency selection. The common save path should stay under 30 seconds by requiring only amount entry, Category selection, and Save when the date defaults to today and description is omitted.

New Expense date defaults to today using the fixed application timezone `Asia/Kolkata`, but the user must be able to edit it before saving. Amount, Category, and date are required; saving must be prevented until they are valid. Amount must be positive and allow up to 2 decimal places. Description is optional and must not block saving.

Default Categories must be available immediately as protected seeded data rows, including Food, Transport, Shopping, Bills, Entertainment, Health, Education, and Other. These categories must be usable for Expense creation and editing, and the app must not require any category setup before the first Expense can be captured.

The MVP is single-user and must not include login, registration, sessions, authorization policies, User tables, UserId columns, or a hardcoded current user. Basic security and data integrity still apply: backend validation is authoritative, API inputs are validated, and Expense data should not be unnecessarily exposed.

Save success must provide compact feedback with `Expense saved.`, reset the Add Expense form for rapid additional entry, and refresh or invalidate relevant server-backed state. Operation failures must keep the user in the Add Expense context, preserve entered data where applicable, and show concise actionable feedback near the relevant action or form area. Validation feedback must be inline and understandable; missing amount copy must be `Enter an amount to save this expense.`

Verification for this epic should cover the Home shell and category chip availability, seeded Default Categories against PostgreSQL behavior, valid Expense creation, DTO mapping, decimal/date persistence, invalid create requests, ProblemDetails or ValidationProblemDetails responses, and meaningful frontend form validation/interaction behavior.

## Technical Decisions

The MVP uses a React/Vite TypeScript frontend, ASP.NET Core Web API backend, and PostgreSQL database. UI, API contracts, business rules, and persistence must remain separately identifiable.

Backend implementation lives in one deployable ASP.NET Core Web API project with internal feature/layer folders. Endpoints or controllers stay thin and delegate to feature services. Feature services coordinate validation, domain rules, and persistence. Domain code must not depend on ASP.NET Core or EF Core. Data owns `DbContext`, EF configuration, migrations, and provider-specific persistence.

Frontend TypeScript code is organized as `app`, `features/expenses`, `features/categories`, `shared/ui`, and `shared/api`. DTO types and API functions live in `shared/api`; UI components should not hand-shape raw backend responses. TanStack Query owns API-backed server state and mutations for Expenses and Categories; React state/hooks own form state and temporary selections; React Router owns navigation. Do not add Redux, Zustand, or another global client store.

Every API endpoint must use explicit request/response DTOs and must not expose EF Core or domain entities directly. Use resource-oriented REST endpoints for Expenses and Categories, plus the current-month summary endpoint when needed by the Home shell. Do not introduce CQRS, MediatR, or another mediator framework.

Expense stores `CategoryId`; Category is a first-class entity. Expense must not snapshot Category name. Default Categories are seeded and protected. Monetary values use .NET `decimal` and PostgreSQL `numeric(12,2)`; floating-point monetary amounts are forbidden. `ExpenseDate` uses .NET `DateOnly` mapped to PostgreSQL `date`; `CreatedAt` and `UpdatedAt` are UTC timestamps mapped to `timestamptz`. API dates use `YYYY-MM-DD`, and timestamps use ISO 8601.

Frontend validation is immediate for UX, but backend validation repeats required checks and is authoritative for business rules and data integrity. API errors use ASP.NET Core `ProblemDetails` or `ValidationProblemDetails` with appropriate HTTP status codes; no custom error envelope is required. EF Core migrations are committed and applied explicitly by developers; the app must not auto-run migrations on startup.

## UX & Interaction Patterns

Home is the default landing surface. The app IA has Home, Review, and Categories destinations; Add Expense is not a separate navigation destination. Mobile uses bottom navigation, while desktop preserves the same IA in a compact header or side navigation.

On mobile, Home order is Add Expense first, Current Month summary second, Recent Expenses third. On desktop, Home uses two columns with Add Expense and Current Month summary in the left/main column and Recent Expenses in the right column. Add Expense remains visually primary on all viewports.

The Add Expense form is inline, compact, and immediately visible. Amount is first and visually primary, shows `₹` in or beside the field, uses mobile-optimized numeric input where supported, accepts positive values only, rejects zero/negative values, and allows up to 2 decimal places. Category selection uses directly visible wrapping chips with clear selected state, not a dropdown. Date is visible, compact, editable, and initialized to today. Description appears after required fields, is clearly optional, compact, and visually secondary.

Use the adopted visual system: warm off-white page background, white raised surfaces, clear ink hierarchy, teal primary accent, semantic success/warning/danger colors, system UI typography, practical spacing, and modest radii. The interface should feel like a clean personal utility, not a dense finance dashboard: avoid broad gradients, decorative accent overuse, heavy nested cards, and chart-heavy styling.

Accessibility expectations include meaningful labels, associated validation feedback, keyboard access for fields/buttons/navigation/chips, reading-order focus flow, comfortable touch targets, and selected/error/destructive states that do not rely on color alone.

## Cross-Story Dependencies

Story 1.1 provides the app shell, Home landing surface, frontend/backend structure, and seeded Default Categories needed by the Add Expense form in Stories 1.2 and 1.3.

Story 1.2 depends on the starter Category data and chip selection foundation from Story 1.1, then creates the Expense API, persistence path, DTOs, and successful form reset/server-state refresh behavior that Story 1.3 hardens with validation and failure handling.

Story 1.3 depends on the Add Expense form and create API from Story 1.2 so validation, ProblemDetails handling, preserved form state, accessibility, and success/failure feedback can be verified end to end.
