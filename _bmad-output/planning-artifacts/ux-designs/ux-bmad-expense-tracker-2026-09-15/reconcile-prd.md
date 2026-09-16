---
title: PRD Reconciliation for UX Spines
input: source-extract-prd.md
compared:
  - DESIGN.md
  - EXPERIENCE.md
created: 2026-09-15
updated: 2026-09-15
status: complete
---

# PRD Reconciliation for UX Spines

## Inputs

- PRD source extract: `source-extract-prd.md`
- Design spine: `DESIGN.md`
- Experience spine: `EXPERIENCE.md`

## Overall Assessment

The UX spines are broadly aligned with the PRD source extract. They preserve the lightweight single-user scope, keep Expense entry primary, avoid full personal-finance platform patterns, and translate the PRD's Record -> Review -> Understand loop into a compact Home / Review / Categories IA.

The major UX choices are supportable from the PRD: Home emphasizes Add Expense, Current Month awareness, and Recent Expenses; Category management exists only to support Expense entry and summaries; visual direction avoids dense analytics and complex finance-app affordances. Two PRD open questions are resolved by the UX spines: Home Recent Expenses shows 5 items, and the MVP includes a simple all-Expense Review surface.

The main reconciliation gaps are small but important implementation-facing details: expense ordering should use Expense date descending with a stable same-date tie-breaker, not only "most recently recorded"; Current Month summary empty-state wording should not weaken the requirement that the main experience shows the Current Month total and Category breakdown; cancel behavior for Edit should be stated explicitly; and success/failure feedback should include failure feedback for operations, not only form validation and success toasts.

## Confirmed Alignments

### Product focus and scope

The PRD defines a focused, lightweight, single-user expense tracker rather than a full personal-finance platform (`source-extract-prd.md` lines 14-22, 46-53, 313-336). DESIGN matches this with a simple, dependable utility style, restrained hierarchy, and an explicit warning against heavy fintech or analytics-dashboard aesthetics (`DESIGN.md` lines 87-101, 139-143). EXPERIENCE matches this with a mobile-first responsive web app, limited destinations, no advanced list interactions, and no analytics-style exploration (`EXPERIENCE.md` lines 14-34, 64-65, 86-93).

Status: aligned.

### Record flow

The PRD requires the common Expense entry path to be fast, with amount first, Category selection, date defaulted to today, optional description, and Save available from the main experience (`source-extract-prd.md` lines 65-77, 133-152, 268-275). EXPERIENCE makes Add Expense inline at the top of Home, places amount first, uses Category chips, defaults date to today, keeps description optional, and resets after save for repeated entry (`EXPERIENCE.md` lines 22, 28, 32, 60, 106-115). DESIGN supports this by making the amount input prominent and keeping Add Expense visually primary (`DESIGN.md` lines 111, 127-131, 141).

Status: aligned.

### Current Month understanding

The PRD requires Current Month total spending, Current Month Category breakdown, and Current Month Recent Expenses on the main experience, with summaries updating after Expense changes (`source-extract-prd.md` lines 98-112, 116-131). EXPERIENCE provides Current Month total, ranked Category breakdown, Recent Expenses, and summary/list updates after add/edit/delete (`EXPERIENCE.md` lines 22, 62-64, 76, 115, 126, 128-134). DESIGN supports this with readable hierarchy and simple horizontal bars rather than heavier charting (`DESIGN.md` lines 91, 105, 111, 142).

Status: aligned with one empty-state wording caveat below.

### Expense review, detail, edit, and delete

The PRD requires identifiable Recent Expenses, access to detail from list/summary context, detail fields, edit/delete actions, delete confirmation, and no undo/recovery (`source-extract-prd.md` lines 79-96, 154-197). EXPERIENCE provides Expense rows that show amount, Category, date, and optional description; rows open detail; detail exposes Edit/Delete; edit uses the Expense form pattern; delete confirmation is required and no undo/recovery is included (`EXPERIENCE.md` lines 64-69, 83, 88-92, 117-126). DESIGN reinforces clean rows without inline edit/delete actions (`DESIGN.md` lines 132, 143).

Status: mostly aligned; explicit edit-cancel behavior should be added.

### Category selection and management

The PRD requires Default Categories available immediately, Custom Category add/rename/delete rules, in-use deletion blocking, Default Category protection, and a non-heavy category-management surface (`source-extract-prd.md` lines 199-232, 254-258, 282-286). EXPERIENCE defines Default and Custom Category chips in Add/Edit, a Categories surface with protected Default Categories, Custom Category Add/Edit/Delete, confirmation for eligible deletion, and blocked deletion copy for in-use categories (`EXPERIENCE.md` lines 61, 69-70, 82-84, 136-144). DESIGN uses compact Category chips with clear selected state (`DESIGN.md` lines 80-84, 131).

Status: aligned.

### Currency and visual treatment

The PRD requires INR as the single application-level currency and excludes per-Expense currency selection, conversion, and exchange rates (`source-extract-prd.md` lines 141-144, 307-311). EXPERIENCE specifies INR display for amount entry and Current Month total (`EXPERIENCE.md` lines 60, 62). DESIGN specifies INR symbol treatment in the amount input (`DESIGN.md` line 130).

Status: aligned.

### Accessibility and validation

The PRD requires meaningful labels, keyboard access, understandable validation feedback, mobile-usable controls, and basic assistive-technology support (`source-extract-prd.md` lines 240-246, 288-296). EXPERIENCE captures labeled controls, associated validation feedback, keyboard access, reading-order focus, comfortable touch targets, and non-color-only states (`EXPERIENCE.md` lines 80-81, 95-102). DESIGN reinforces contrast, readable sizing, and clear validation text (`DESIGN.md` lines 103-107, 127-130).

Status: aligned.

## Resolved PRD Open Questions

### Recent Expenses count

The PRD leaves the number of Recent Expenses open (`source-extract-prd.md` lines 165-167, 349-352). EXPERIENCE resolves this as 5 Recent Expenses on Home (`EXPERIENCE.md` lines 22, 64, 133).

Assessment: acceptable. Five is a reasonable mobile-first default because it keeps Recent Expenses visible without pushing the Add Expense and Current Month summary too far down the Home screen.

### All-Expense browsing

The PRD leaves open whether the MVP needs all-Expense browsing beyond Recent Expenses, with a default stance of Recent Expenses plus Current Month Recent Expenses unless UX determines browsing is required (`source-extract-prd.md` lines 234-236, 349-352). EXPERIENCE adds an Expense Review surface with a simple scrollable all-Expenses list (`EXPERIENCE.md` lines 23, 64-65, 117-126).

Assessment: acceptable with scope guard. The Review surface supports PRD UJ-2 by making later review and correction easier, but it must remain simple: no search, filters, sorting, pagination, analytics, grouping, or dense table behavior in MVP, as EXPERIENCE already states (`EXPERIENCE.md` line 65).

## Gaps and Reconciliation Notes

### Ordering semantics are slightly inconsistent

The PRD says Recent Expenses are ordered by Expense date descending and need a stable same-date tie-breaker (`source-extract-prd.md` lines 87-88, 161-162). EXPERIENCE says Home Recent Expenses are ordered by "most recently recorded first" and Review is "most recently recorded/dated first" (`EXPERIENCE.md` lines 64-65).

Risk: This can produce behavior that violates the PRD when a user records an older Expense today. The older Expense could appear above a newer Expense if ordered by creation time instead of Expense date.

Reconciliation: Treat the PRD as authoritative. UX should specify: sort by Expense date descending; for Expenses with the same Expense date, use a stable tie-breaker such as created-at descending or internal id descending. If the desired tie-breaker is "most recently recorded," state it only as the same-date tie-breaker.

### Current Month empty-state wording may obscure required totals

The PRD requires the main experience to show Current Month total spending and Category breakdown, and summaries must correctly handle Current Month calculations (`source-extract-prd.md` lines 104-112, 120-125, 262-264). EXPERIENCE says the Current Month summary uses an empty state rather than misleading zeros (`EXPERIENCE.md` line 76).

Risk: If interpreted literally, the UI may omit a visible Current Month total when there are no Current Month Expenses, weakening the PRD requirement that the main experience shows the total.

Reconciliation: Keep the empty-state intent but make it compatible with the PRD. The Home summary should still show a Current Month total of INR 0 when there are no Current Month Expenses, with supportive empty copy for the Category breakdown and Recent Expenses. Avoid fake Category bars or sample data.

### Edit cancel behavior is not explicit

The PRD requires canceling an edit to leave the Expense unchanged (`source-extract-prd.md` lines 92-93, 184-187). EXPERIENCE describes the Edit form and Save behavior but does not explicitly state Cancel behavior (`EXPERIENCE.md` lines 68, 117-126).

Risk: Implementers may omit a Cancel action or route cancellation inconsistently.

Reconciliation: Add an explicit behavioral rule: Edit Expense includes Cancel/Back behavior that discards unsaved changes and returns to Expense Detail without mutating the Expense.

### Operation failure feedback is underspecified

The PRD requires save, edit, and delete actions to provide visible success or failure feedback (`source-extract-prd.md` lines 248-252). EXPERIENCE specifies success toasts and inline validation errors (`EXPERIENCE.md` lines 79-81), but it does not clearly cover operation-level failures such as failed save/delete after valid input.

Risk: Implementers may handle validation errors but not failed persistence or failed mutation states.

Reconciliation: Add a concise failure-feedback pattern for Expense and Category operations. Failure feedback should keep the user in context, identify that the action did not complete, and preserve entered data where applicable.

### Category renaming association preservation is implicit

The PRD requires renaming a Custom Category to preserve association with existing Expenses (`source-extract-prd.md` lines 212-219, 282-286). EXPERIENCE says Custom Categories support Add/Edit/Delete and saving updates the section (`EXPERIENCE.md` lines 70, 136-144), but it does not explicitly state that renaming preserves existing Expense associations.

Risk: Implementation could treat rename as delete/recreate and accidentally break historical Expense associations.

Reconciliation: Add an explicit Category Management rule: renaming a Custom Category updates its name in all existing Expense references without orphaning or reassigning Expenses.

## Source Fact Coverage Matrix

| PRD requirement area | UX spine coverage | Status |
|---|---|---|
| Lightweight single-user utility | DESIGN utility style; EXPERIENCE limited IA | Covered |
| Amount, Category, Date, optional Description | Add/Edit Expense form pattern | Covered |
| Amount first and fast common entry | Home inline form; amount first; Save prominent | Covered |
| Date defaults to today and editable | Add/Edit form pattern and Flow 1 | Covered |
| INR only | Amount input and Current Month total | Covered |
| Recent Expenses identity info | Rows show amount, Category, date, optional description | Covered |
| Recent Expenses date-desc ordering | EXPERIENCE wording conflicts with PRD ordering | Needs adjustment |
| Expense detail with edit/delete | Detail surface and row navigation | Covered |
| Edit supports all fields | Edit form pattern | Covered |
| Edit cancel leaves unchanged | Not explicit | Needs adjustment |
| Delete confirmation and no recovery | Confirmation pattern; no undo/recovery | Covered |
| Current Month total and Category breakdown | Home total and ranked nonzero Category bars | Covered |
| Summary updates after mutations | Flow and component rules | Covered |
| Default Categories available/protected | Category chips and protected Default Categories | Covered |
| Custom Category add/rename/delete rules | Category Management mostly covers | Minor clarification needed |
| In-use Custom Category deletion blocked | State pattern and copy | Covered |
| Accessibility basics | Accessibility Floor and visual readability | Covered |
| Operation success/failure feedback | Success covered; failure partial | Needs adjustment |
| Scope exclusions | IA and interaction primitives avoid advanced finance features | Covered |

## Recommended Spine Updates

1. In `EXPERIENCE.md`, revise Recent Expenses and Expense Review ordering to "Expense date descending, with a stable same-date tie-breaker such as recorded time descending."
2. In `EXPERIENCE.md`, clarify that the empty Current Month summary still shows INR 0 total while Category breakdown uses empty copy when no Current Month Expenses exist.
3. In `EXPERIENCE.md`, add explicit Cancel behavior for Edit Expense.
4. In `EXPERIENCE.md`, add operation-level failure feedback for failed save/update/delete actions.
5. In `EXPERIENCE.md`, state that Custom Category rename preserves existing Expense associations.

## Reconciliation Decision

The UX spines are acceptable as draft spines against the PRD, with the above adjustments recommended before finalization or implementation handoff. No major PRD requirements are missing, and the UX-added Review surface is justified as a simple support surface for review/correction rather than scope expansion.
