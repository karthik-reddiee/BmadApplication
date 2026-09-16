---
title: EXPERIENCE: bmad-expense-tracker
status: final
created: 2026-09-15
updated: 2026-09-15
sources:
  - ../../prds/prd-bmad-expense-tracker-2026-09-15/prd.md
---

# bmad-expense-tracker — Experience Spine

## Foundation

bmad-expense-tracker is a mobile-first responsive web app. The primary usage moment is immediately after a purchase, so the experience optimizes for fast Expense capture on a phone while supporting the same IA on desktop. Desktop adapts the layout and navigation to the wider viewport; it does not introduce separate destinations or a different experience.

`DESIGN.md` owns the visual identity and design tokens. This spine owns information architecture, behavior, states, interactions, accessibility, and key flows.

## Information Architecture

| Surface | Reached from | Purpose |
|---|---|---|
| Home | App open, Home navigation | Fast Expense capture, complete Current Month nonzero Category awareness, and 5 Recent Expenses |
| Expense Review | Review navigation, Home link/action | Browse all recorded Expenses in one simple scrollable list and open Expense Detail |
| Expense Detail | Recent Expense row, Expense Review row | Read one Expense and access Edit/Delete |
| Edit Expense | Expense Detail → Edit | Update amount, Category, date, or optional description |
| Category Management | Categories navigation | View Default Categories and manage Custom Categories |

Mobile navigation uses a bottom navigation bar with Home, Review, and Categories. Home is the default landing screen. Add Expense is not a separate navigation destination; it remains the primary interaction on Home.

Desktop uses the same Home, Review, and Categories IA in a compact header or side navigation as appropriate for the layout.

Home uses a two-column layout on desktop: Add Expense and Current Month summary in the left/main column, Recent Expenses in the right column. Add Expense remains the strongest visual priority. Smaller screens collapse naturally to the mobile single-column order: Add Expense, Current Month summary, Recent Expenses.

Mockup references: [Home mobile](mockups/home-mobile.html), [Expense Review mobile](mockups/review-mobile.html), [Categories mobile](mockups/categories-mobile.html), and [Home desktop](mockups/home-desktop.html). These illustrate hierarchy and layout; this spine and `DESIGN.md` win on conflict.

## Voice and Tone

Microcopy is friendly but restrained: clear, approachable, concise, and actionable. Avoid jokes, excessive personality, and overly casual financial language.

| Situation | Preferred copy |
|---|---|
| Expense saved | `Expense saved.` |
| Expense updated | `Expense updated.` |
| Expense deleted | `Expense deleted.` |
| Category added | `Category added.` |
| Category updated | `Category updated.` |
| Category deleted | `Category deleted.` |
| Missing amount | `Enter an amount to save this expense.` |
| Empty Home | `No expenses yet. Add your first one above.` |
| Empty Review | `No expenses recorded yet.` |
| Empty Custom Categories | `No custom categories yet. Add one to get started.` |
| Category deletion blocked | `This category is used by existing expenses. Reassign those expenses before deleting it.` |

## Component Patterns

Behavioral rules live here; visual specifications live in `DESIGN.md`.

| Component | Use | Behavioral rules |
|---|---|---|
| Add Expense form | Top of Home | Inline, compact, immediately visible. Amount is first and visually primary, shows `₹` in or beside the field, uses mobile-optimized numeric input where supported, accepts positive amounts only, rejects zero/negative values, and allows up to 2 decimal places. Category is required. Date is a visible compact field that defaults to today, remains easy to change, and clearly displays the selected date. Description is visible after the required fields, clearly optional, compact, and visually secondary. Save is prominent. After save, reset the form for quick additional entry. |
| Category chips | Add/Edit Expense | Show available Default and Custom Categories directly in the form. Chips wrap on mobile, have a clear selected state, and replace a dropdown for MVP. |
| Current Month total | Home | Shows total Expense amount for the Current Month using INR (₹). Updates after Expense add/edit/delete. |
| Category breakdown | Home | Ranked by Current Month spending amount, highest first. Shows every Category with nonzero Current Month spending using Category name, amount, and a simple horizontal bar. Do not hide lower-ranked Categories behind expand/collapse in MVP. |
| Recent Expenses | Home | Shows 5 Expenses ordered by Expense date descending, with recorded time descending as the stable same-date tie-breaker. Rows show amount, Category, date, and optional description as secondary text. Row opens Expense Detail. |
| Expense Review list | Review | Shows all recorded Expenses in one simple scrollable list ordered by Expense date descending, with recorded time descending as the stable same-date tie-breaker, using the same row structure as Home. Tapping a row opens Expense Detail. No grouping by month/date, pagination, infinite scroll, search, filtering, sorting, or analytics in MVP. |
| Expense row | Home, Review | Opens Expense Detail. Does not show Edit/Delete controls directly. |
| Expense Detail | Detail | Read-only view of amount, Category, date, and optional description. Provides Edit and Delete actions. |
| Edit Expense form | Edit | Uses the same Expense form pattern as Add Expense, including visible date field, Category chips, and optional Description, pre-populated with existing values. Save returns to Expense Detail. Cancel or Back discards unsaved changes and returns to Expense Detail without changing the Expense. |
| Delete confirmation | Expense Detail, Categories | Simple accessible confirmation dialog with concise title and explanation, Cancel action, and visually destructive Delete action. Expense deletion copy indicates permanent removal. Eligible Custom Category deletion uses the same pattern; in-use Custom Categories are blocked before confirmation. Cancel leaves the item unchanged. No undo/recovery in MVP. |
| Category Management | Categories | Two sections: Default Categories and Custom Categories. Default Categories are shown as protected with no edit/delete. Custom Categories support Add/Edit/Delete. Add/Edit uses a compact inline form on the Categories screen with category name and clear Add/Save action. Renaming a Custom Category preserves its association with existing Expenses. |

## State Patterns

| State | Surface | Treatment |
|---|---|---|
| Empty Home | Home | Keep the inline Add Expense form fully visible and usable. Do not show onboarding, intro screens, or sample/demo Expenses. Current Month summary shows a visible INR 0 total when there are no Current Month Expenses; Category breakdown uses empty copy instead of fake bars. Recent Expenses uses `No expenses yet. Add your first one above.` |
| Empty Review | Review | `No expenses recorded yet.` Provide a clear route back to Home. |
| Empty Custom Categories | Categories | `No custom categories yet. Add one to get started.` |
| Success toast | Global | Successful create/update/delete actions use compact transient feedback that does not interrupt flow: `Expense saved.`, `Expense updated.`, `Expense deleted.`, `Category added.`, `Category updated.`, or `Category deleted.` |
| Validation error | Add/Edit Expense, Categories | Keep the user in context and show concise inline feedback near the relevant field/action, such as `Enter an amount to save this expense.` Do not rely on toast messages for errors that require user action. |
| Operation failure | Global | If a valid save, update, or delete action fails, keep the user in context, preserve entered data where applicable, and show concise actionable failure feedback near the relevant action or form area. |
| Amount validation | Add/Edit Expense | Validate before save. Amount must be positive and may include up to 2 decimal places. Show inline actionable feedback when missing or invalid. |
| Category name validation | Categories | Category name cannot be empty. Show inline feedback near the name field. |
| Delete confirmation | Expense Detail, Categories | Confirmation appears before Expense deletion or eligible Custom Category deletion. Confirm removes the item; cancel leaves it unchanged. |
| Category deletion blocked | Categories | Explain that the Category is used by existing Expenses and those Expenses must be reassigned before deletion. Do not show the delete confirmation until the Category is eligible. |

## Interaction Primitives

- Tap/click primary actions directly; avoid extra steps for normal Expense entry.
- Tap/click an Expense row to open Expense Detail.
- Keep Edit/Delete actions inside Expense Detail, not on list rows.
- Bottom navigation switches between Home, Review, and Categories on mobile.
- Use confirmation for destructive deletion.
- Avoid advanced table interactions, chart exploration, drag/drop, swipe-only actions, and hidden gestures in MVP.

## Accessibility Floor

- Form fields and controls need meaningful labels.
- Validation feedback must be understandable and associated with the relevant field.
- Keyboard access should work for applicable fields, buttons, navigation items, Category chips, and confirmation actions.
- Focus order follows reading order on every surface.
- Interactive targets should be comfortable on touch screens.
- Visual contrast requirements are owned by `DESIGN.md`; the experience must not rely on color alone to convey selected, error, or destructive states.

## Key Flows

### Flow 1 — Record a purchase immediately

1. User opens the app to Home.
2. The Add Expense form is already visible at the top.
3. User enters amount.
4. User selects a Category chip.
5. Date remains today's date unless changed.
6. User optionally adds a description.
7. User taps Save.
8. **Climax:** `Expense saved.` appears, the form resets, and Current Month summary/Recent Expenses update.

### Flow 2 — Review and correct a recent Expense

1. User opens Home or Review.
2. User scans Recent Expenses or the Expense Review list, both ordered by Expense date descending with recorded time as the same-date tie-breaker.
3. User taps an Expense row.
4. Expense Detail opens in read-only mode.
5. User taps Edit.
6. Pre-populated Expense form opens.
7. User saves changes.
8. **Climax:** Updated Expense appears in detail/list context and affected summaries update.

### Flow 3 — Understand Current Month spending

1. User opens Home.
2. User sees Add Expense first, then Current Month total.
3. User scans all nonzero Current Month Categories ranked by spending with simple bars.
4. User checks 5 Recent Expenses below the summary for context.
5. **Climax:** User can answer how much they spent this month and where most of the money went without opening a complex analytics view.

### Flow 4 — Manage Custom Categories

1. User opens Categories.
2. User sees protected Default Categories and manageable Custom Categories.
3. User adds or renames a Custom Category through the compact inline form.
4. Saving updates the Custom Categories section and shows a success toast; renaming preserves existing Expense associations.
5. User deletes an unused Custom Category through confirmation.
6. If a Custom Category is used by Expenses, deletion is blocked with an explanation.
7. **Climax:** Category choices stay useful for Expense entry without adding complexity to the Add Expense flow.
