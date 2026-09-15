---
title: PRD: bmad-expense-tracker
status: final
created: 2026-09-15
updated: 2026-09-15
---

# PRD: bmad-expense-tracker

## 0. Document Purpose

This PRD defines the product requirements for `bmad-expense-tracker`, a greenfield learning/internal project that will be carried through the BMAD lifecycle from product thinking into architecture, epics, stories, sprint planning, implementation, and review. It is written to preserve the product intent from the finalized Product Brief while making the requirements clear enough for downstream planning and engineering work.

The PRD focuses on user-facing capabilities and product behavior, not implementation decisions. Preferred technical direction such as React, ASP.NET Core Web API, and PostgreSQL is noted as project context, but architecture choices belong in the BMAD architecture phase. Requirements in this document should explain why each capability exists, how it supports the core Record -> Review -> Understand loop, and what complexity should stay outside the MVP.

## 1. Vision

bmad-expense-tracker helps an individual know where their money went without turning Expense tracking into work. It gives the user a simple, approachable way to record everyday spending and understand recent spending patterns without adopting a full personal-finance platform.

The product is centered on a small loop: Record -> Review -> Understand. The user should be able to record a normal Expense quickly, return later to review Recent Expenses, and see enough Current Month spending information to understand where their money is going. The experience should feel lighter than a spreadsheet and less demanding than a finance app that expects bank connections, budgets, accounts, goals, and dense dashboards.

The MVP should earn trust through focus. It should ask for only the information needed to make spending visible: amount, Category, date, and an optional description. It should provide useful defaults, keep common actions close at hand, and question any feature that adds friction without directly improving Expense recording or spending awareness.

## 2. Target User

The MVP target user is an individual working professional with regular day-to-day Expenses who wants better awareness of their spending without using a complex personal-finance system. This user is not trying to manage every part of their financial life in the product. They want a quick, low-friction way to capture everyday Expenses and a simple way to understand where their money is going.

This user has basic-to-moderate comfort with software. They should not need spreadsheet habits, accounting knowledge, or prior personal-finance app experience to succeed. The product should be approachable, mobile-friendly, and understandable through the screen itself rather than through instructions.

This target user should anchor UX decisions, prioritization, and user stories. When a feature helps this user record spending faster, review Expenses more clearly, or understand Current Month spending with less effort, it belongs in consideration. When a feature mainly turns the product toward broad financial management, automation, or advanced analysis, it should be treated as outside the MVP unless explicitly revisited.

### 2.1 Jobs To Be Done

- When I make an everyday purchase, I want to record it quickly before I forget the details.
- When I open the app later, I want to see Recent Expenses so I can confirm what I have captured.
- When I think about this month's spending, I want to see the current total and category breakdown without building a spreadsheet.
- When my spending habits change, I want categories that are simple enough to use immediately but flexible enough to reflect my life.
- When I use the product over time, I want expense tracking to feel lightweight enough that I can keep doing it.

### 2.2 Key User Journeys

These journeys intentionally use the general target user rather than a named persona. For this MVP, the product decisions are driven by the user's job and context rather than by additional persona assumptions.

- **UJ-1. Record a purchase immediately after it happens.** The user opens the app, enters the amount, selects a Category, accepts the default date or changes it if necessary, optionally adds a description, and saves the Expense. The common case should be completable in under 30 seconds.
- **UJ-2. Review Recent Expenses later in the day or week.** The user opens the app and reviews recently recorded Expenses to confirm what they spent and when. If they notice an error, they can identify the Expense and edit or delete it.
- **UJ-3. Understand Current Month spending by total and Category.** The user views the main screen and sees Current Month total spending, a Category-level breakdown, and Recent Expenses. The user should be able to understand where their money has gone without navigating through a complex analytics system.

### 2.3 Non-Users for MVP

- People who need bank or credit-card synchronization as the primary value of an expense tracker.
- People looking for a full personal-finance platform with income, investments, budgets, bills, goals, forecasting, and advice.
- Households, teams, or collaborators who need shared expenses, roles, permissions, or multi-user workflows.
- Users who need accounting-grade reporting, tax workflows, reimbursement flows, or business expense management.

## 3. Glossary

- **Expense** — One recorded spending event.
- **Category** — Classification assigned to an Expense.
- **Default Category** — Built-in Category available immediately.
- **Custom Category** — User-created Category.
- **Current Month** — The calendar month containing today, used as the primary spending overview period in the MVP.
- **Recent Expenses** — The latest recorded Expenses shown for quick review.
- **Spending Summary** — Total spending and category-level spending for a selected period.

## 4. Features

The MVP feature set is limited to four groups that directly support the core product loop:

- Record -> **Expense Recording**
- Review -> **Expense Review and Maintenance**
- Understand -> **Current-Month Spending Summary**
- Support -> **Category Management**

New MVP features should be questioned unless they are necessary for recording Expenses, reviewing Expenses, understanding Current Month spending, or supporting those actions through simple Categories.

### 4.1 Expense Recording

**Description:** The user can quickly add an Expense with the minimum information needed to make spending visible: amount, Category, and date. Description is optional. The date defaults to today so the common case requires fewer choices. This feature realizes UJ-1.

**Functional Requirements:**

#### FR-1: Add an Expense

The user can create an Expense with amount, Category, date, and optional description. The Expense model does not include per-expense currency in the MVP; amounts are displayed using INR (₹) as a single application-level currency. Realizes UJ-1.

**Consequences (testable):**
- The user can save an Expense when amount, Category, and date are present.
- The user can save an Expense without entering a description.
- The saved Expense includes amount, Category, date, and description when provided.
- The saved Expense does not require or store a user-selected currency.
- Amounts are displayed using INR (₹) in the MVP.

**Out of Scope:**
- Per-expense currency selection.
- Currency conversion, exchange rates, or multi-currency tracking.

#### FR-2: Default Expense Date to Today

When the user starts creating a new Expense, the date defaults to today while remaining editable. Realizes UJ-1.

**Consequences (testable):**
- A new Expense form is prefilled with today's date.
- The user can save an Expense using the default date without changing it.
- The user can change the date before saving when recording an Expense from another day.

#### FR-3: Validate Required Expense Fields

The system prevents saving an Expense until amount, Category, and date are valid. Realizes UJ-1.

**Consequences (testable):**
- The system prevents saving an Expense with a missing or invalid amount.
- The system prevents saving an Expense without a Category.
- The system prevents saving an Expense without a valid date.
- Validation feedback is understandable to a user with basic-to-moderate software comfort.

#### FR-4: Keep Common Expense Entry Fast

The common Expense entry path is designed so the target user can record an Expense in under 30 seconds when using the default date and no description. Realizes UJ-1.

**Consequences (testable):**
- The common path requires only amount entry, Category selection, and save.
- The amount field is the first required entry field in the common Expense entry flow.
- The main experience provides a prominent way to start adding an Expense.
- Description entry is optional and does not block saving.
- The user does not need to navigate through multiple unrelated screens to save a normal Expense.

### 4.2 Expense Review and Maintenance

**Description:** The user can review Recent Expenses, view an individual Expense, correct mistakes, and delete Expenses that should no longer be tracked. This feature realizes UJ-2.

**Functional Requirements:**

#### FR-5: View Recent Expenses

The user can view Recent Expenses in a list that supports quick review of what was spent and when. Realizes UJ-2.

**Consequences (testable):**
- The user can see a list of recently recorded Expenses.
- Each listed Expense shows enough information to identify it, including amount, Category, and date.
- Description is shown when available or accessible from the Expense detail view.
- Recent Expenses are ordered by Expense date descending, with a stable tie-breaker so Expenses from the same date appear predictably.

#### FR-6: View Expense Details

The user can view an individual Expense's details. Realizes UJ-2.

**Consequences (testable):**
- The user can open an Expense from a list or summary context.
- The Expense detail view shows amount, Category, date, and description when provided.
- The detail view gives the user access to edit and delete actions for that Expense.

#### FR-7: Edit an Expense

The user can edit an existing Expense to correct amount, Category, date, or description. Realizes UJ-2.

**Consequences (testable):**
- The user can update amount, Category, date, and description for an existing Expense.
- The same required-field validation used for creating an Expense applies when editing.
- Saving changes updates the Expense shown in Recent Expenses and any relevant Spending Summary.
- Canceling an edit leaves the Expense unchanged.

#### FR-8: Delete an Expense

The user can delete an existing Expense after confirming the deletion. The MVP does not provide undo or recovery after deletion. Realizes UJ-2.

**Consequences (testable):**
- The user can initiate deletion from an Expense detail or maintenance context.
- The system asks the user to confirm before deleting the Expense.
- Confirming deletion removes the Expense from Recent Expenses and any relevant Spending Summary.
- Canceling the confirmation leaves the Expense unchanged.
- The product does not need to provide undo, trash, archive, or recovery for deleted Expenses in the MVP.

### 4.3 Category Management

**Description:** The product provides Default Categories so the user can begin tracking immediately, while allowing Custom Categories so the product can adapt to the user's life. Category management exists to support Expense entry and clear Spending Summaries; it is not an independent management surface. Category management remains simple and avoids nested categories, complex rules, or automation in the MVP.

**Functional Requirements:**

#### FR-9: Provide Default Categories

The product provides Default Categories that are available immediately for Expense recording.

**Consequences (testable):**
- A new user can select from Default Categories without creating any Custom Categories first.
- Default Categories include sensible everyday spending options such as Food, Transport, Shopping, Bills, Entertainment, Health, Education, and Other.
- Default Categories can be used when creating or editing an Expense.
- Downstream UX and design may refine the starter Default Category set for clear usability reasons without expanding the MVP into complex category systems.

#### FR-10: Create a Custom Category

The user can create a Custom Category for spending that does not fit the Default Categories.

**Consequences (testable):**
- The user can create a Custom Category with a user-provided name.
- The created Custom Category becomes available for creating and editing Expenses.
- The system prevents creating a Custom Category without a valid name.

#### FR-11: Edit a Custom Category

The user can edit an existing Custom Category.

**Consequences (testable):**
- The user can rename a Custom Category.
- Renaming a Custom Category preserves its association with existing Expenses.
- The system prevents saving a Custom Category without a valid name.

#### FR-12: Delete an Unused Custom Category

The user can delete a Custom Category only when it is not associated with any existing Expenses.

**Consequences (testable):**
- A Custom Category with no associated Expenses can be deleted.
- A Custom Category associated with one or more existing Expenses cannot be deleted.
- When deletion is blocked, the system explains that the Category is being used by existing Expenses and that those Expenses must be reassigned before deleting the Category.
- The product does not automatically reassign Expenses, create orphaned Expense records, or provide Category deletion recovery in the MVP.

#### FR-13: Protect Default Categories

The system protects Default Categories from inappropriate modification or deletion.

**Consequences (testable):**
- Default Categories cannot be deleted in the MVP.
- Default Categories cannot be modified in a way that breaks existing Expenses or removes immediately available starter Categories.
- Default Categories remain available for Expense creation and editing.

### 4.4 Current-Month Spending Summary

**Description:** The user can understand Current Month spending from the main experience through total spending, spending broken down by Category, and Recent Expenses for the Current Month. This feature realizes UJ-3.

**Functional Requirements:**

#### FR-14: Show Current Month Total Spending

The product shows total spending for the Current Month. Realizes UJ-3.

**Consequences (testable):**
- The user can see the total amount spent during the Current Month.
- The total includes Expenses dated within the Current Month.
- The total excludes Expenses dated outside the Current Month.

#### FR-15: Show Current Month Spending by Category

The product shows Current Month spending broken down by Category. Realizes UJ-3.

**Consequences (testable):**
- The user can see spending totals grouped by Category for the Current Month.
- Category totals include Expenses dated within the Current Month.
- Category totals exclude Expenses dated outside the Current Month.
- The summary helps the user answer where their money went this month without requiring advanced analytics.

#### FR-16: Show Current Month Recent Expenses

The product shows Recent Expenses from the Current Month as part of the main spending-awareness experience. Realizes UJ-3.

**Consequences (testable):**
- The user can see Recent Expenses dated within the Current Month.
- The displayed Recent Expenses include enough information to identify each Expense, including amount, Category, and date.
- Expenses outside the Current Month are not required to appear in the Current Month summary.

#### FR-17: Update Spending Summary After Expense Changes

The Spending Summary updates when relevant Expenses are added, edited, or deleted.

**Consequences (testable):**
- Adding an Expense dated within the Current Month updates total spending, Category spending, and Current Month Recent Expenses.
- Editing an Expense updates any affected total, Category, date, or Recent Expenses display.
- Deleting an Expense updates total spending, Category spending, and Recent Expenses when that Expense was included in the summary.
- The MVP does not need to show previous-month comparisons, percentage changes, trends, or month-over-month analytics.

## 5. Cross-Cutting Non-Functional Requirements

These requirements apply across the MVP and should stay lightweight for the learning/internal scope.

- **Usability:** The application should be approachable, mobile-friendly, low-friction, and understandable without requiring user instructions. The common Expense entry flow should remain simple and quick.
- **Performance:** Common screens and Expense save operations should feel responsive for the expected small personal dataset. The MVP does not require production-scale load or performance targets.
- **Data Integrity:** Expense and Category operations must maintain consistent associations and accurate Spending Summaries. Changes to Expenses should be reflected correctly in the relevant summaries. A Category that is associated with existing Expenses must not be deleted.
- **Accessibility:** The web interface should follow basic accessibility expectations, including semantic structure, keyboard accessibility where applicable, meaningful labels, appropriate form validation feedback, and sufficient usability for common assistive technologies. The MVP does not target a formal certification level.
- **Privacy/Security:** The MVP is a single-user learning application and does not require real authentication. However, the application should avoid unnecessarily exposing Expense data, validate inputs, and follow reasonable basic web security practices. Bank credentials, financial-account credentials, and other sensitive financial integrations are explicitly outside the MVP.

The MVP does not require enterprise availability targets, large-scale load testing, formal compliance requirements, or production-grade security architecture.

**Lightweight acceptance anchors:**
- Common form controls should be usable at common mobile widths.
- Expense and Category forms should have meaningful labels and understandable validation feedback.
- Save, edit, and delete actions should provide visible success or failure feedback.
- Keyboard access should work for applicable form fields, buttons, and confirmation actions.
- Expense and Category operations should not leave Spending Summaries stale or inconsistent after completion.

## 6. Non-Goals

These boundaries describe what `bmad-expense-tracker` is deliberately not trying to become.

- The product is not a full personal-finance platform.
- The product is not a budgeting or financial-goals application.
- The product is not bank-connected or based on automated transaction imports.
- The product is not a multi-user, household, or shared-expense product.
- The product is not a business expense, accounting, or reimbursement tool.
- The product is not an AI financial advisor.

## 7. MVP Scope

The MVP focuses on the Record -> Review -> Understand loop for a single-user expense-tracking web application.

The main MVP trade-off is intentional narrowness. The product gives up authentication, bank sync, budgets, advanced analytics, multi-currency handling, and broad personal-finance workflows so the first version can stay focused on fast manual Expense entry and understandable Current Month spending awareness.

### 7.1 In Scope

- Creating Expenses with amount, Category, date, and optional description. Covered by FR-1 through FR-4.
- Reviewing, viewing, editing, and deleting Expenses, including deletion confirmation. Covered by FR-5 through FR-8.
- Providing Default Categories and simple Custom Category management. Covered by FR-9 through FR-13.
- Showing Current Month total spending, spending by Category, and Current Month Recent Expenses. Covered by FR-14 through FR-17.
- Keeping the experience approachable, mobile-friendly, low-friction, and understandable for a user with basic-to-moderate software comfort.
- Treating the MVP as single-user without real authentication.
- Using INR (₹) as one implicit application-level currency for amount display, without per-Expense currency handling.

### 7.2 Out of Scope for MVP

- Real user authentication, accounts, roles, permissions, sharing, collaboration, or household workflows.
- Income tracking.
- Bank or credit-card integration.
- Automatic transaction imports.
- Investment tracking.
- Bill management.
- Complex budgeting.
- Savings or financial goals.
- Financial forecasting.
- Receipt scanning or OCR.
- Automatic Expense categorization.
- Recurring Expense automation.
- Advanced notifications.
- Advanced analytics, previous-month comparisons, percentage changes, trend analysis, or month-over-month reporting.
- AI-powered financial advice.
- Payments, transfers, or money movement.
- Multi-currency Expenses, exchange rates, currency conversion, or per-Expense currency selection.
- Business expense, accounting, reimbursement, tax, or export workflows.

## 8. Success Metrics

These product-focused metrics validate whether the MVP delivers the intended Record -> Review -> Understand experience.

**Primary**

- **SM-1:** A normal Expense can be recorded in under 30 seconds when using the default date and no description. Validates FR-1, FR-2, and FR-4.
- **SM-2:** The user can answer "How much did I spend this month?" from the main experience. Validates FR-14 and FR-17.
- **SM-3:** The user can answer "Where did most of my money go this month?" using the Category breakdown. Validates FR-15 and FR-17.

**Counter-metric**

- **SM-C1:** Do not optimize for feature count. Added features should not make Expense entry slower or make the MVP harder to understand. Counterbalances all MVP feature work, especially FR-1 through FR-4.

## 9. Open Questions

1. **Recent Expenses count:** Determine the appropriate number of Recent Expenses to show based on the main-screen UX and mobile usability. Resolve during UX before story slicing.
2. **Expense browsing:** Determine whether the MVP needs a dedicated way to browse all Expenses beyond the Recent Expenses view. The default MVP stance is Recent Expenses plus Current Month Recent Expenses unless UX determines all-Expense browsing is required for basic review. Resolve before epics and implementation stories are finalized.

## 10. Assumptions Index

There are no unresolved inline `[ASSUMPTION]` tags at this stage. Remaining downstream design questions are tracked in Section 9.
