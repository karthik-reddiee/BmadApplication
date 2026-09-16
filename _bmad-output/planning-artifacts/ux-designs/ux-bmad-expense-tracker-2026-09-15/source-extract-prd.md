---
title: UX Source Extract from PRD
source: ../../prds/prd-bmad-expense-tracker-2026-09-15/prd.md
source_status: final
created: 2026-09-15
updated: 2026-09-15
product: bmad-expense-tracker
---

# UX Source Extract from PRD

## Product Thesis

`bmad-expense-tracker` helps an individual know where their money went without turning Expense tracking into work. The product is a focused, lightweight single-user expense tracker, not a full personal-finance platform.

The core loop is Record -> Review -> Understand:

- Record everyday spending quickly.
- Review Recent Expenses later.
- Understand Current Month spending through totals, Category breakdown, and Recent Expenses.

The MVP should feel lighter than a spreadsheet and less demanding than a finance app that expects bank connections, budgets, accounts, goals, and dense dashboards. It earns trust through focus, useful defaults, common actions kept close, and minimal data entry.

The MVP asks only for information needed to make spending visible:

- Amount.
- Category.
- Date.
- Optional description.

## Target User

The target user is an individual working professional with regular day-to-day Expenses who wants better spending awareness without using a complex personal-finance system.

The user:

- Wants quick, low-friction capture of everyday Expenses.
- Wants a simple way to understand where money is going.
- Is not trying to manage every part of their financial life in this product.
- Has basic-to-moderate software comfort.
- Should not need spreadsheet habits, accounting knowledge, or prior personal-finance app experience.
- Needs the product to be approachable, mobile-friendly, and understandable from the screen itself rather than through instructions.

UX decisions should favor features that help this user record spending faster, review Expenses more clearly, or understand Current Month spending with less effort.

## Non-Users for MVP

The MVP is not aimed at:

- People who require bank or credit-card synchronization as the primary value.
- People looking for a full personal-finance platform with income, investments, budgets, bills, goals, forecasting, and advice.
- Households, teams, or collaborators who need shared expenses, roles, permissions, or multi-user workflows.
- Users who need accounting-grade reporting, tax workflows, reimbursement flows, or business expense management.

## Key Jobs To Be Done

- When I make an everyday purchase, I want to record it quickly before I forget the details.
- When I open the app later, I want to see Recent Expenses so I can confirm what I have captured.
- When I think about this month's spending, I want to see the current total and category breakdown without building a spreadsheet.
- When my spending habits change, I want categories that are simple enough to use immediately but flexible enough to reflect my life.
- When I use the product over time, I want expense tracking to feel lightweight enough that I can keep doing it.

## Key User Journeys

### UJ-1: Record a Purchase Immediately After It Happens

The user opens the app, enters the amount, selects a Category, accepts the default date or changes it if necessary, optionally adds a description, and saves the Expense.

UX facts:

- The common case should be completable in under 30 seconds.
- Date defaults to today.
- Description is optional.
- The common path requires only amount entry, Category selection, and save.
- The amount field is the first required entry field in the common Expense entry flow.
- A prominent way to start adding an Expense is required from the main experience.
- The user should not need to navigate through multiple unrelated screens to save a normal Expense.

### UJ-2: Review Recent Expenses Later in the Day or Week

The user opens the app and reviews recently recorded Expenses to confirm what they spent and when. If they notice an error, they can identify the Expense and edit or delete it.

UX facts:

- Recent Expenses must show enough information to identify each Expense: amount, Category, and date.
- Description is shown when available or accessible from an Expense detail view.
- Recent Expenses are ordered by Expense date descending.
- Expenses on the same date need a stable tie-breaker so ordering is predictable.
- The user can open an Expense from a list or summary context.
- Expense detail shows amount, Category, date, and description when provided.
- Expense detail gives access to edit and delete actions.
- Editing supports amount, Category, date, and description.
- Canceling an edit leaves the Expense unchanged.
- Delete requires confirmation.
- Canceling deletion leaves the Expense unchanged.
- The MVP does not provide undo, trash, archive, recovery, or deletion recovery.

### UJ-3: Understand Current Month Spending by Total and Category

The user views the main screen and sees Current Month total spending, a Category-level breakdown, and Recent Expenses. The user should understand where money has gone without navigating through a complex analytics system.

UX facts:

- Main experience should show Current Month total spending.
- Main experience should show Current Month spending grouped by Category.
- Main experience should show Current Month Recent Expenses.
- Current Month is the calendar month containing today.
- Current Month totals include Expenses dated within the Current Month.
- Current Month totals exclude Expenses dated outside the Current Month.
- Category totals include only Expenses dated within the Current Month.
- The summary should help answer where money went this month without advanced analytics.
- Summary data must update after relevant Expense add, edit, and delete operations.

## Feature Surfaces Implied

### Main Experience / Current Month Overview

Implied content and actions:

- Current Month total spending.
- Current Month spending by Category.
- Current Month Recent Expenses.
- Prominent add Expense entry point.
- Enough Recent Expense information to identify amount, Category, and date.
- Visible updates after Expense create, edit, and delete operations.

Primary questions the screen must answer:

- "How much did I spend this month?"
- "Where did most of my money go this month?"
- "What did I recently record?"

### Add Expense Flow

Required fields and behavior:

- Amount.
- Category.
- Date defaulted to today and editable.
- Optional description.
- Save blocked until amount, Category, and date are valid.
- INR (₹) displayed as the single application-level currency.
- No per-Expense currency selector.
- No currency conversion, exchange rates, or multi-currency tracking.

Required UX qualities:

- Fast common path.
- Low friction.
- Amount first among required fields.
- Description must not block save.
- Validation feedback understandable to a user with basic-to-moderate software comfort.

### Recent Expenses List

Required content and behavior:

- List of recently recorded Expenses.
- Each listed Expense shows amount, Category, and date.
- Description is shown when available or accessible from detail.
- Ordered by Expense date descending.
- Stable tie-breaker for Expenses with the same date.
- Expense can be opened from list or summary context.

Open UX decision:

- Number of Recent Expenses to show.

### Expense Detail

Required content and behavior:

- Amount.
- Category.
- Date.
- Description when provided.
- Edit action.
- Delete action.

### Edit Expense Flow

Required behavior:

- User can update amount, Category, date, and description.
- Same required-field validation as create applies.
- Saving updates Recent Expenses and any relevant Spending Summary.
- Canceling leaves Expense unchanged.

### Delete Expense Confirmation

Required behavior:

- User can initiate deletion from detail or maintenance context.
- System asks for confirmation before deleting.
- Confirming removes Expense from Recent Expenses and relevant Spending Summary.
- Canceling leaves Expense unchanged.
- No undo or recovery is required.

### Category Selection

Required behavior:

- Default Categories are available immediately.
- Default Categories can be used when creating or editing an Expense.
- Starter examples: Food, Transport, Shopping, Bills, Entertainment, Health, Education, Other.
- UX and design may refine the starter Default Category set for clear usability reasons without expanding into complex category systems.

### Custom Category Management

Required behavior:

- User can create a Custom Category with a valid name.
- Created Custom Category becomes available for creating and editing Expenses.
- User can rename a Custom Category.
- Renaming preserves association with existing Expenses.
- A Custom Category with no associated Expenses can be deleted.
- A Custom Category associated with one or more Expenses cannot be deleted.
- When deletion is blocked, the system explains that the Category is in use and those Expenses must be reassigned before deleting the Category.
- The product does not automatically reassign Expenses, create orphaned Expense records, or provide Category deletion recovery.

Scope constraint:

- Category management exists to support Expense entry and clear Spending Summaries. It is not an independent management-heavy surface.
- No nested categories, complex rules, or automation in the MVP.

### Default Category Protection

Required behavior:

- Default Categories cannot be deleted in the MVP.
- Default Categories cannot be modified in a way that breaks existing Expenses or removes immediately available starter Categories.
- Default Categories remain available for Expense creation and editing.

### Optional All-Expense Browsing

The PRD leaves open whether the MVP needs a dedicated way to browse all Expenses beyond Recent Expenses. The default MVP stance is Recent Expenses plus Current Month Recent Expenses unless UX determines all-Expense browsing is required for basic review.

## State and Feedback Requirements

Forms:

- Required amount, Category, and date validation.
- Understandable validation feedback.
- Meaningful labels.
- Keyboard access for applicable form fields and buttons.
- Common form controls usable at common mobile widths.

Operations:

- Save, edit, and delete actions provide visible success or failure feedback.
- Spending Summary must not become stale after Expense or Category operations.
- Expense and Category operations must maintain consistent associations.

Deletion:

- Expense deletion requires confirmation.
- Custom Category deletion is blocked when the Category is associated with existing Expenses.
- Blocked Category deletion explains why deletion is unavailable and what the user must do first.

Empty and boundary states implied by requirements:

- New user can record Expenses using Default Categories before creating Custom Categories.
- Summary views must handle Current Month calculations based on Expenses dated inside or outside the Current Month.
- Description may be absent and should not create a confusing blank state.

## NFR / UX Constraints

Usability:

- Approachable.
- Mobile-friendly.
- Low-friction.
- Understandable without requiring user instructions.
- Common Expense entry flow remains simple and quick.
- Common Expense entry should be under 30 seconds with default date and no description.

Performance:

- Common screens and Expense save operations should feel responsive for the expected small personal dataset.
- No production-scale load or performance targets are required.

Data integrity:

- Expense and Category operations maintain consistent associations.
- Spending Summaries accurately reflect Expense changes.
- Categories associated with existing Expenses must not be deleted.

Accessibility:

- Basic accessibility expectations apply.
- Semantic structure.
- Keyboard accessibility where applicable.
- Meaningful labels.
- Appropriate and understandable validation feedback.
- Sufficient usability for common assistive technologies.
- No formal certification target.

Privacy and security:

- Single-user learning application.
- Real authentication is not required.
- Avoid unnecessarily exposing Expense data.
- Validate inputs.
- Follow reasonable basic web security practices.
- Bank credentials, financial-account credentials, and sensitive financial integrations are outside MVP.

Currency:

- INR (₹) is the single implicit application-level currency.
- No per-Expense currency handling.
- No multi-currency, exchange rate, or currency conversion UX.

Scope boundaries:

- No real accounts, roles, permissions, sharing, collaboration, or household workflows.
- No income tracking.
- No bank or credit-card integration.
- No automatic transaction imports.
- No investments.
- No bill management.
- No complex budgeting.
- No savings or financial goals.
- No forecasting.
- No receipt scanning or OCR.
- No automatic categorization.
- No recurring Expense automation.
- No advanced notifications.
- No advanced analytics, previous-month comparisons, percentage changes, trend analysis, or month-over-month reporting.
- No AI-powered financial advice.
- No payments, transfers, or money movement.
- No business expense, accounting, reimbursement, tax, or export workflows.

Counter-metric:

- Do not optimize for feature count.
- Added features should not make Expense entry slower or make the MVP harder to understand.

## Terms to Preserve

- Expense.
- Category.
- Default Category.
- Custom Category.
- Current Month.
- Recent Expenses.
- Spending Summary.
- Record -> Review -> Understand.

## Unresolved Open Questions

1. Recent Expenses count: determine the appropriate number of Recent Expenses to show based on main-screen UX and mobile usability.
2. Expense browsing: determine whether the MVP needs a dedicated way to browse all Expenses beyond the Recent Expenses view. The default MVP stance is Recent Expenses plus Current Month Recent Expenses unless UX determines all-Expense browsing is required for basic review.
