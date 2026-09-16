# Epic 4 Context: Current-Month Spending Awareness

<!-- Compiled from finalized SPEC, EXPERIENCE, DESIGN, ARCHITECTURE-SPINE, epics.md, and previous-story continuity. -->

## Goal

Epic 4 lets the user understand current-month spending from Home: total spending, category breakdown, and current-month recent expenses that stay fresh after expense changes.

## Stories

- Story 4.1: Calculate Current-Month Summary on Demand
- Story 4.2: Show Current-Month Total, Category Breakdown, and Recent Expenses on Home
- Story 4.3: Keep Spending Awareness Fresh After Expense Changes

## Requirements & Constraints

Current-month summary includes only Expenses dated within the current calendar month using fixed `Asia/Kolkata` semantics. It returns total amount, nonzero category breakdown ranked by amount descending, and recent expenses from the current month ordered by `ExpenseDate` descending then `CreatedAt` descending.

Summary is calculated on demand in the backend from normalized Expenses and Categories. Do not add summary tables, materialized views, background aggregation, frontend aggregation, caching, trend analysis, previous-month comparison, percentages, charts beyond simple bars, search/filter/sort-heavy review, or broader analytics.

Amounts remain .NET `decimal`/PostgreSQL `numeric(12,2)` and display as INR. Category grouping is by `CategoryId`; names resolve from live Category rows so category rename is reflected. API uses explicit DTO contracts and does not expose EF/domain entities.

Home still keeps Add Expense first. Empty Home shows INR 0 total, no fake bars, and Recent Expenses copy `No expenses yet. Add your first one above.`

## Technical Decisions

Use resource-oriented `GET /api/summaries/current-month`. A separate `Features/Summaries` folder is appropriate for clarity and matches the architecture spine. Summary logic lives in a feature service that queries EF Core/PostgreSQL and maps explicit response DTOs.

Frontend server state belongs to TanStack Query. Home should call the summary endpoint for the summary panel and current-month recent expenses once Story 4.2 lands. Existing create/update/delete/category mutations already invalidate `["current-month-summary"]` in several places; Story 4.3 completes and verifies freshness.

Backend integration tests should cover PostgreSQL-sensitive filtering/grouping/ordering when Docker/Testcontainers is available. In this local environment, if Docker is unavailable, compile the tests and record Testcontainers execution as an environment blocker without changing architecture.

## UX & Interaction Patterns

Current Month total should answer "How much did I spend this month?" directly on Home. Category breakdown uses simple horizontal bars for every nonzero current-month category, ranked highest first. Visual bars must not be the only information: include category name and amount.

Current-month Recent Expenses use the same row structure as existing Home/Review rows and open Expense Detail. No separate analytics destination is introduced.

## Cross-Story Dependencies

Story 4.1 adds the backend summary API and DTOs.

Story 4.2 replaces the placeholder Home summary with API-backed total, category breakdown, zero state, and current-month recent expenses.

Story 4.3 verifies and hardens freshness after add/edit/delete operations without adding new global state or broad analytics.
