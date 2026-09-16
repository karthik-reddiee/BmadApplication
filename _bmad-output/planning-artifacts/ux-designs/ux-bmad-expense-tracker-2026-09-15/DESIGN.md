---
name: bmad-expense-tracker
description: Clean, dependable personal expense tracking utility focused on fast capture and current-month awareness.
title: DESIGN: bmad-expense-tracker
status: final
created: 2026-09-15
updated: 2026-09-15
sources:
  - ../../prds/prd-bmad-expense-tracker-2026-09-15/prd.md
colors:
  surface-base: '#FAFAF8'
  surface-raised: '#FFFFFF'
  ink-primary: '#1F2933'
  ink-secondary: '#5B6673'
  ink-muted: '#8A94A3'
  border-subtle: '#E2E8ED'
  accent: '#0F766E'
  accent-strong: '#0B5F59'
  success: '#15803D'
  warning: '#B45309'
  danger: '#B42318'
typography:
  title:
    fontFamily: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: 0
  section:
    fontFamily: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
    fontSize: 18px
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: 0
  body:
    fontFamily: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  meta:
    fontFamily: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
rounded:
  sm: 6px
  md: 8px
  lg: 12px
  full: 9999px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 20px
  '6': 24px
  '8': 32px
  mobile-margin: 16px
  desktop-gutter: 24px
components:
  button-primary:
    background: '{colors.accent}'
    foreground: '#FFFFFF'
    radius: '{rounded.md}'
  button-danger:
    background: '{colors.danger}'
    foreground: '#FFFFFF'
    radius: '{rounded.md}'
  input:
    background: '{colors.surface-raised}'
    border: '{colors.border-subtle}'
    radius: '{rounded.md}'
  amount-input:
    background: '{colors.surface-raised}'
    border: '{colors.border-subtle}'
    prefix-color: '{colors.ink-secondary}'
    radius: '{rounded.md}'
  category-chip:
    background: '{colors.surface-raised}'
    selected-background: '{colors.accent}'
    selected-foreground: '#FFFFFF'
    radius: '{rounded.full}'
---

## Brand & Style

bmad-expense-tracker should feel like a simple, dependable personal utility. The visual system is clean, crisp, and trustworthy, with subtle warmth in the base surface and enough spacing to make capture and review feel calm rather than dense.

The interface prioritizes readability, fast scanning, and clear hierarchy over visual effects. Primary actions such as Add Expense and Save use restrained emphasis. The Current Month total may receive stronger type treatment, but the product should not drift into a heavy fintech or analytics-dashboard aesthetic.

## Colors

- **Warm off-white (`{colors.surface-base}`)** is the default page background. It keeps the utility from feeling clinical while staying neutral.
- **White (`{colors.surface-raised}`)** is used for form surfaces, list rows, and compact content groups.
- **Ink (`{colors.ink-primary}` / `{colors.ink-secondary}` / `{colors.ink-muted}`)** carries hierarchy for labels, values, and secondary metadata.
- **Teal (`{colors.accent}` / `{colors.accent-strong}`)** is the primary accent for important actions, selected navigation states, selected Category chips, and key emphasis.
- **Semantic colors (`{colors.success}`, `{colors.warning}`, `{colors.danger}`)** are used only when the meaning requires success, warning, or destructive emphasis.

Avoid decorative accent use, broad gradients, finance-app green as the default brand signal, and chart palettes that make the MVP feel like an analytics dashboard.

## Typography

Use system UI typography for a crisp, familiar web-app feel across mobile and desktop. The type scale stays practical: one title level for the main Current Month total or page title, section headings for compact groups, body text for controls and rows, and meta text for dates, helper text, and secondary descriptions.

Typography must maintain strong contrast and readable sizing on mobile. Do not use display type, negative letter spacing, all-caps section labels, or tiny metadata that makes Expense review harder.

## Layout & Spacing

The layout is mobile-first and responsive. Mobile uses a single-column flow with the Add Expense form first, followed by Current Month context and Recent Expenses. Desktop uses a two-column Home layout: Add Expense and Current Month summary in the left/main column, Recent Expenses in the right column. The layout uses desktop space without becoming a three-column dashboard or creating separate destinations.

Visual references: [Home mobile](mockups/home-mobile.html), [Expense Review mobile](mockups/review-mobile.html), [Categories mobile](mockups/categories-mobile.html), and [Home desktop](mockups/home-desktop.html). The spines win on conflict with mockups.

Spacing should make the Home screen feel calm but efficient. Major groups use generous vertical separation; tightly related fields and list metadata use smaller gaps. Avoid nested cards and avoid turning every section into a heavy standalone panel.

## Elevation & Depth

Depth is minimal. Use borders, surface tone, spacing, and typography for hierarchy before shadows. If elevation is used, keep it subtle and functional for overlays or confirmation surfaces only.

## Shapes

Use modest rounded corners: `{rounded.md}` for inputs, buttons, list rows, and compact surfaces; `{rounded.full}` only for Category chips or small pill-like controls where the shape improves selection scanning.

## Components

- **Primary button** — Teal background, white text, used for Save and other primary actions. Should be easy to reach and visually clear without oversized styling.
- **Destructive button** — Red semantic color, used only for confirmed delete actions. Pair with a clear Cancel action in confirmation dialogs.
- **Input** — White surface, subtle border, clear label, readable validation text. Amount receives primary visual focus in Add Expense.
- **Amount input** — Most visually prominent form field. Shows INR prefix/symbol (`₹`) clearly in or beside the field without competing with the entered number.
- **Category chip** — Compact tappable chip with clear selected state. Default and Custom Categories share the same selection behavior in Add/Edit Expense.
- **Expense row** — Clean row with amount, Category, date, and optional description as secondary text. No inline edit/delete actions.
- **Bottom navigation item** — Teal selected state, neutral inactive state. Mobile destinations are Home, Review, and Categories.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Keep the interface clean, readable, and fast to scan. | Make the UI feel like a dense financial dashboard. |
| Use teal for primary actions and selected states. | Use accent color decoratively or excessively. |
| Keep the Add Expense form visually primary on Home. | Bury expense entry below summary content on mobile. |
| Use simple horizontal bars for Category spending. | Use donut/pie charts or multiple chart types in MVP. |
| Keep lists clean and mobile-scannable. | Put Edit/Delete controls directly on every Expense row. |
