---
title: Product Brief: bmad-expense-tracker
status: final
created: 2026-09-15
updated: 2026-09-15
---

# Product Brief: bmad-expense-tracker

## Executive Summary

bmad-expense-tracker is a small web application for individuals who want to quickly record everyday expenses and clearly understand where their money goes. It focuses on fast manual entry, simple categories, recent expense review, and current-month spending summaries, without bank integrations or complex personal-finance features.

The MVP primarily serves working professionals who make regular day-to-day purchases and want better financial awareness without maintaining spreadsheets or learning a complex budgeting system. Its core experience is built around a simple loop: Record, Review, Understand.

This project is also intentionally scoped as a BMAD learning project, allowing the product to be taken through the complete journey from product discovery and planning to architecture, stories, implementation, testing, and review while keeping the resulting decisions understandable.

## Product Frame

bmad-expense-tracker is a small personal expense tracking web application for individuals who want a simple way to record day-to-day spending and understand where their money goes.

The product is intentionally not a full personal finance platform. The MVP prioritizes fast manual expense entry, clear review of recent spending, and category-based understanding. It avoids bank-account integration, account aggregation, investment tracking, complex financial automation, and heavy budgeting workflows in the first version.

This is also a learning project. The product should stay small enough to implement fully, reason about clearly, and carry through the BMAD Method from discovery through implementation.

## The Problem

People make many small everyday purchases such as food, coffee, transport, shopping, and subscriptions. These transactions are easy to forget, and many individuals do not have a simple, structured place to capture them quickly.

The most important usage moment is immediately after a purchase, when the user wants to record the expense before the detail disappears from memory. A secondary usage moment is at the end of a day or week, when the user wants to review spending and understand where their money went.

Current alternatives are imperfect. Memory is unreliable. Notes apps are fast but unstructured, making analysis difficult. Spreadsheets provide structure but often feel too heavy for quickly recording small purchases. Full financial apps can add even more friction through bank linking, lengthy onboarding, advanced budgeting rules, investment features, dense dashboards, or too many required fields.

The MVP should be guided by a simple principle: record an expense quickly, then understand the spending clearly.

After one week of use, a successful user has a reliable record of everyday expenses without feeling that tracking them was a chore. They can look back at the week, see total spending, understand which categories consumed the most money, and spot spending patterns or unnecessary expenses.

## The Solution

bmad-expense-tracker gives an individual a focused web application for manually recording everyday expenses and reviewing recent spending.

The main experience centers on fast expense entry. A normal expense should be captured in a few interactions: enter the amount, choose a category, accept or adjust the date, optionally add a description, and save. The amount field comes first, the date defaults to today, and common categories are immediately available so the user does not navigate through multiple screens to log a purchase.

The MVP expense model is intentionally small. Each expense requires only amount, category, and date. Description is optional. The first version should not require payment method, merchant, location, receipt, account, tags, or similar details.

The main screen should make quick entry the primary action while still giving enough context to review spending. It should show a prominent quick-add expense form or action, a concise current-month spending summary, and a recent expense list.

Categories should help users start immediately but still adapt to their lives. The MVP should include sensible defaults such as Food, Transport, Shopping, Bills, Entertainment, Health, Education, and Other, while allowing users to create their own categories. Category management should remain simple, with no nested categories or complex categorization rules in the MVP.

The primary overview period should be the current month. The product should show total spending, spending by category, and recent expenses for that period. Other periods or custom date ranges can be considered later if they provide clear value without complicating the MVP.

## Who This Serves

The primary MVP user is a working professional with regular day-to-day expenses who wants a simple way to understand personal spending. The product should remain usable by students, freelancers, and other individuals, but the working professional persona should anchor product decisions for the first version.

This user is primarily motivated by financial awareness rather than a specific savings target or strict budget. They want to answer practical questions: how much they spent this month, where most of the money went, how much went to categories such as food or transport, and whether any spending patterns stand out.

The product should assume basic-to-moderate software familiarity. The user should not need to enjoy spreadsheets, complex dashboards, or personal-finance software to succeed. The experience should be simple, clear, mobile-friendly, understandable without instructions, and centered on a small number of actions.

The MVP is single-user: one person, their expenses, their spending insights. The brief may leave room for future household sharing or multi-user support, but the first version should not include sharing, collaboration, roles, permissions, or multi-user workflows.

## Success Criteria

### User Success

A user should be able to record a normal expense in under 30 seconds. The fastest path is amount, category, and save, with the date defaulted to today and description remaining optional.

The user should also be able to quickly see current-month total spending and recent expenses without digging through navigation.

After a month of use, the user should have a clearer understanding of personal spending habits. They can answer how much they spent this month, which categories consumed the most money, which expense types occur frequently, and how spending differs across weeks or periods.

The product makes existing spending visible and understandable. It does not prescribe how the user should spend money in the MVP.

### Project Success

The project succeeds as a BMAD learning project if it moves from product idea to working application through the intended BMAD lifecycle, with each artifact showing how product thinking becomes implementation work.

The expected project outcomes are a completed Product Brief, a clear and reviewed PRD, documented architecture, defined epics and implementation-ready stories, sprint planning artifacts, a working expense-tracking application, frontend/API/PostgreSQL integration, clear separation between frontend, API, business logic, and data-access responsibilities, basic automated tests where appropriate, and BMAD-guided code review.

Deployment is not required for the learning MVP. The focus is understanding and successfully executing the BMAD development lifecycle.

### Guardrail

If a feature makes expense recording or basic spending awareness more complicated without being essential to the core experience, it belongs outside the MVP.

## Scope

The MVP focuses on a simple product loop: Record, Review, Understand.

### In Scope

The MVP must allow the user to add an expense with amount, category, date, and optional description; view a list of recorded expenses; view an individual expense's details; edit an existing expense; and delete an expense.

The MVP must support expense categories through a small set of default categories and simple custom category management. Users should be able to select a category when recording an expense, create custom categories, and edit or delete custom categories where appropriate. Default or system categories may be protected from destructive operations.

The MVP must provide a clear current-month overview, including total spending, spending broken down by category, and recent expenses from the main screen. Filtering or reviewing expenses for a selected period may be included only if it remains simple and does not distract from the core MVP.

The MVP is expenses-only. Income tracking is outside the first version because the core product problem is understanding spending behavior.

The MVP does not require real authentication. It is treated as a single-user application for the learning version, while avoiding product and architecture decisions that would make future multi-user support impossible.

### Out of Scope

The MVP will not include bank or credit-card integration, automatic transaction imports, investment tracking, bill management, complex budgeting, savings or financial goals, financial forecasting, receipt scanning or OCR, automatic expense categorization, recurring expense automation, social features, household or shared expenses, multi-user collaboration, advanced notifications, complex financial analytics, AI-powered financial advice, payments, or money transfers.

These ideas can be reconsidered later, but they should not influence the MVP requirements unless a later BMAD workflow shows that one is necessary for the core experience.

## What Makes This Different

bmad-expense-tracker differentiates through focus and simplicity rather than feature breadth.

The product should feel fast to use, simple to understand, free from unnecessary setup, and focused on basic spending awareness. It should not ask the user to connect accounts, learn a budgeting system, or manage every aspect of personal finance before delivering value.

The user-facing principle is: know where your money went without turning expense tracking into a second job.

The BMAD and learning goals are important to the project, but they are not user-facing product differentiators. To the user, the product should stand on the experience itself: simplicity, speed, and focused awareness.

## Vision

If the MVP proves useful, bmad-expense-tracker could evolve into a lightweight personal finance companion for individuals who want to understand and improve spending habits without adopting a complex finance system.

The product could grow gradually from expense tracking to spending insights, then to lightweight budgeting, and eventually to broader personal financial awareness. Growth should not automatically mean complexity. The long-term principle should be: more useful without becoming more complicated.

Future capabilities may include user authentication and personal accounts, income tracking, monthly and category-based budgets, recurring expenses, more advanced charts and spending trends, custom date-range analysis, expense and data export, file-based imports, a mobile application, multi-user or household sharing, reminders, receipt capture and OCR, automatic expense categorization, bank or account integration, automatic transaction synchronization, and AI-assisted spending insights.

These are future possibilities, not MVP requirements.
