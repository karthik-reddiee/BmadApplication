---
title: 'Story 3.1: View Categories and Create a Custom Category'
type: 'feature'
created: '2026-09-16'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '7acbffa7e5e6b98e5b49c3d56f88cbac0f0b13b7'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
---

<frozen-after-approval reason="auto-approved from finalized artifacts">

## Intent

**Problem:** Categories currently load for expense forms, but the Categories destination is still a placeholder. Users need to view protected Default Categories and add Custom Categories that become available for expense creation/editing.

**Approach:** Build the Categories page with Default and Custom sections, add a compact inline custom-category creation form, implement `POST /api/categories`, invalidate category-backed server state, and verify empty/validation/success behavior.

## Boundaries & Constraints

**Always:** Show Default Categories as protected with no edit/delete controls. Show Custom Categories separately. Use exact empty copy `No custom categories yet. Add one to get started.` Validate non-empty category names on frontend and backend. Successful creation persists a custom, non-default row, shows `Category added.`, and makes the category available to Add/Edit Expense chips.

**Never:** Do not add rename, delete, category reassignment, category colors/icons/budgets, search/filter/sort, auth/user ownership, Docker, Redux/Zustand, CQRS/MediatR, or any MVP scope expansion.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| View defaults | Seeded default categories exist | Categories page shows Default Categories as protected | No edit/delete controls |
| Empty custom list | No custom categories | Custom section shows exact empty copy | N/A |
| Create custom | Valid trimmed name | API creates custom category; list updates; feedback says `Category added.` | N/A |
| Empty name | Blank/whitespace name | Save prevented and inline feedback appears near name field | Preserve input context |
| Backend validation | Invalid API request reaches backend | Returns validation problem details | Frontend maps feedback inline |
| Expense form availability | Custom category created | Add/Edit Expense category chips include the new category after category query refresh | Same chip behavior as defaults |

</frozen-after-approval>

## Code Map

- `_bmad-output/implementation-artifacts/epic-3-context.md` -- category management requirements and boundaries.
- `backend/Domain/Category.cs` -- category entity/default protection semantics.
- `backend/Features/Categories/CategoryService.cs`, `CategoryEndpoints.cs`, `CategoryDto.cs` -- add create request/result/service/endpoint.
- `backend/Data/AppDbContext.cs` and migrations -- existing unique/default/protected category setup must remain intact.
- `frontend/src/shared/api/categories.ts` -- add typed create DTO/API and category query keys if needed.
- `frontend/src/features/categories/**` -- Categories page/hooks/form UI.
- `frontend/src/app/App.tsx` -- route Categories to the implemented page instead of placeholder.
- `frontend/src/app/App.test.tsx`, `frontend/src/shared/api/**.test.ts`, `tests/backend-integration/**` -- cover page rendering, validation, creation, chip availability, and backend create validation.

## Tasks & Acceptance

**Execution:**
- [x] Backend -- add explicit `CreateCategoryRequest`/result and `POST /api/categories` for custom category creation with trimmed non-empty names.
- [x] Backend -- preserve default protection and unique-name integrity; created categories must be custom/non-protected.
- [x] Frontend API/query -- add typed create category API and mutation invalidating category queries.
- [x] Categories UI -- replace placeholder with Default and Custom sections, protected labeling, empty custom copy, compact inline add form, success/error feedback.
- [x] Expense form continuity -- ensure newly created categories appear in Add/Edit Expense chips after query refresh.
- [x] Tests -- add focused frontend/API/backend coverage for rendering, validation, creation, and chip availability.

**Acceptance Criteria:**
- Given the user opens Categories, when the page renders, then Default and Custom sections are shown and Default Categories have no edit/delete controls.
- Given no Custom Categories exist, when the Custom section renders, then it shows `No custom categories yet. Add one to get started.`
- Given a valid Custom Category name is saved, when creation succeeds, then it persists as custom, shows `Category added.`, and appears in Add/Edit Expense chips.
- Given an empty name is submitted, when validation runs, then saving is prevented with inline feedback near the name field.

## Implementation Notes

- Added custom category creation through `POST /api/categories` using explicit request/response DTOs, trimmed non-empty names, custom/default flags, and duplicate-name validation.
- Built the Categories page with protected Default Categories, Custom Categories, exact empty-state copy, compact inline add form, inline validation, and `Category added.` feedback.
- Added category API parsing and a TanStack Query mutation that immediately updates cached category lists and invalidates server state so Add/Edit Expense chips can include the new custom category.
- Preserved default-category protection, unique category-name constraints, no auth/user ownership, no Docker changes, and no rename/delete behavior in Story 3.1.

## Spec Change Log

- Completed implementation and verification for Story 3.1.

## Review Triage Log

- Patched: Edit Expense custom-category chip availability was not verified; added focused frontend coverage.
- Patched: Custom Categories empty state could appear during loading/error because the query defaulted to an empty array; gated the empty state behind successful non-loading data.
- Patched: duplicate category race could surface a database unique-index exception; caught PostgreSQL unique violations and mapped them to category-name validation feedback.
- Approved: no architecture, dependency, or MVP-scope blockers found after review patches.

## Verification

**Commands:**
- `npm --prefix frontend test` -- expected: frontend category/API tests pass.
- `npm --prefix frontend run build` -- expected: TypeScript/Vite build succeeds.
- `dotnet build backend/backend.csproj --no-restore` -- expected: backend compiles.
- `dotnet build tests/backend-integration/backend-integration.csproj --no-restore` -- expected: backend integration test project compiles.
- `dotnet test tests/backend-integration/backend-integration.csproj --no-build` -- expected: run only when Docker is available; otherwise record Docker/Testcontainers unavailability as an environment blocker.

**Results:**
- `npm --prefix frontend test` -- passed, 65 tests.
- `npm --prefix frontend run build` -- passed.
- `dotnet build backend/backend.csproj --no-restore` -- passed.
- `dotnet build tests/backend-integration/backend-integration.csproj --no-restore` -- passed with existing `SSH.NET` NU1903 advisory warning.
- `dotnet test tests/backend-integration/backend-integration.csproj --no-build` -- blocked by Docker/Testcontainers unavailable in this environment; Docker connection previously failed at `/var/run/docker.sock` and `/Users/wallstreet62/.docker/run/docker.sock`.
