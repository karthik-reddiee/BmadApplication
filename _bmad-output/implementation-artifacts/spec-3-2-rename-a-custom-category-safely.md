---
title: 'Story 3.2: Rename a Custom Category Safely'
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

**Problem:** Custom Categories can be created but not renamed. Users need to correct category labels without losing existing Expense history.

**Approach:** Add custom-only category update support, expose inline rename controls on the Categories page for custom rows, preserve Expense `CategoryId` associations, refresh category/expense server state, and keep default categories protected.

## Boundaries & Constraints

**Always:** Rename only Custom Categories. Preserve existing Expense associations because Expenses store `CategoryId`, not category-name snapshots. Validate non-empty names on frontend/backend. Successful rename shows `Category updated.` and refreshed Expense/list/detail chips resolve the new name.

**Never:** Do not allow Default Category rename, delete categories, reassign expenses, add colors/icons/budgets, broaden category management, introduce auth, Docker, Redux/Zustand, CQRS/MediatR, or MVP scope expansion.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Rename custom | Custom category + valid name | Name updates; feedback says `Category updated.` | N/A |
| Existing expenses | Expenses reference renamed CategoryId | Expenses remain associated and display updated category name | No reassignment |
| Empty name | Blank/whitespace name | Save prevented with inline field feedback | Preserve context |
| Default category | Default row visible | No rename control is available | Backend blocks direct API attempt |
| Duplicate name | Existing category has target name | Backend returns validation feedback | Preserve edit state |

</frozen-after-approval>

## Code Map

- `_bmad-output/implementation-artifacts/epic-3-context.md` -- category management requirements and boundaries.
- `backend/Domain/Category.cs` -- add rename behavior for custom categories.
- `backend/Features/Categories/**` -- add `UpdateCategoryRequest`, service result, and `PUT /api/categories/{id}`.
- `frontend/src/shared/api/categories.ts` -- add typed update category API.
- `frontend/src/features/categories/CategoriesPage.tsx` -- add inline custom rename controls only.
- `frontend/src/features/categories/useUpdateCategory.ts` -- mutation refreshes categories, expenses, and summary state.
- `frontend/src/app/App.test.tsx`, `tests/backend-integration/CategoryApiTests.cs` -- cover rename success, validation, default protection, and association preservation.

## Tasks & Acceptance

**Execution:**
- [x] Backend -- add custom-only category rename endpoint/service with explicit DTOs and validation.
- [x] Backend -- block Default Category modification and preserve Expense associations by keeping CategoryId unchanged.
- [x] Frontend -- add inline edit/save/cancel controls for Custom Categories only.
- [x] Frontend -- refresh category-backed chips and expense/list/detail data after rename.
- [x] Tests -- cover rename success, empty/duplicate feedback, default protection, and updated expense category names.

**Acceptance Criteria:**
- Given a Custom Category exists, when renamed with a valid name, then the Category name updates and `Category updated.` appears.
- Given renamed category is associated with Expenses, when rename succeeds, then existing Expenses remain associated with the same CategoryId and display the updated name.
- Given Default Categories render, then no rename controls are available for defaults and backend prevents default modification.
- Given empty or duplicate names are submitted, then inline/backend validation prevents save.

## Implementation Notes

- Added `PUT /api/categories/{id}` with `UpdateCategoryRequest`, custom-only rename rules, empty/duplicate validation, unique-index race protection, and not-found handling.
- Added domain rename behavior that rejects protected/default categories while preserving existing Expense `CategoryId` associations.
- Added inline Custom Category edit/save/cancel controls; Default Categories remain view-only protected rows.
- Updated category rename mutation to refresh category data, cached expense lists, cached expense details matching the renamed `categoryId`, and current-month summary state.

## Spec Change Log

- Completed implementation and verification for Story 3.2.

## Review Triage Log

- Patched: cached Expense Detail category names could remain stale after rename because detail disables refetch-on-mount; mutation now updates cached matching details and lists by `categoryId`.
- Patched: duplicate rename coverage was missing; added frontend and backend coverage.
- Approved: no default-protection, association-preservation, architecture, dependency, or MVP-scope blockers remained after patches.

## Verification

**Commands:**
- `npm --prefix frontend test`
- `npm --prefix frontend run build`
- `dotnet build backend/backend.csproj --no-restore`
- `dotnet build tests/backend-integration/backend-integration.csproj --no-restore`
- `dotnet test tests/backend-integration/backend-integration.csproj --no-build` -- only when Docker is available.

**Results:**
- `npm --prefix frontend test` -- passed, 71 tests.
- `npm --prefix frontend run build` -- passed.
- `dotnet build backend/backend.csproj --no-restore` -- passed.
- `dotnet build tests/backend-integration/backend-integration.csproj --no-restore` -- passed with existing `SSH.NET` NU1903 advisory warning.
- `dotnet test tests/backend-integration/backend-integration.csproj --no-build` -- blocked by Docker/Testcontainers unavailable in this environment; Docker connection previously failed at `/var/run/docker.sock` and `/Users/wallstreet62/.docker/run/docker.sock`.
