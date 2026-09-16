---
title: 'Story 1.1: Open the Home Experience with Starter Categories'
type: 'feature'
created: '2026-09-16'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '7acbffa7e5e6b98e5b49c3d56f88cbac0f0b13b7'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

## Intent

**Problem:** The repository has planning artifacts but no runnable app foundation, so a user cannot open Home or see starter categories. Story 1.1 must establish the local MVP shell and category foundation without drifting into expense creation, authentication, or advanced finance features.

**Approach:** Create the initial React/Vite TypeScript frontend, ASP.NET Core Web API backend, PostgreSQL EF Core data model, and focused tests needed for Home to render with Home/Review/Categories navigation and protected default categories. Keep the UI visually aligned with the adopted design tokens and keep backend data/API boundaries ready for later expense stories.

## Boundaries & Constraints

**Always:** Home is the default frontend landing surface; navigation exposes only Home, Review, and Categories. Default categories are protected seeded database rows: Food, Transport, Shopping, Bills, Entertainment, Health, Education, and Other. Add Expense category chips must be loaded from the backend Category API through `shared/api`, not from a hardcoded UI list. Seeded default categories use stable IDs chosen before the first migration, category names are unique, and default rows are protected through the default/protected flag. Frontend code is organized under `app`, `features/expenses`, `features/categories`, `shared/ui`, and `shared/api`; backend code is one ASP.NET Core Web API with feature folders, `Domain`, `Data`, and only necessary `Common`. API contracts use DTOs, not EF/domain entities. EF migrations are committed but never auto-run on startup.

**Never:** Do not add login, registration, sessions, roles, permissions, User tables, UserId columns, or a hardcoded current user. Do not implement expense save/edit/delete, custom category management, current-month summary calculations, analytics, search/filter-heavy review, Redux/Zustand, CQRS, MediatR, dropdown-based MVP category selection, broad gradients, dense dashboard styling, or nested heavy card treatment.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Home first render | Frontend opens locally with API available | Home renders first with Add Expense visible, backend-loaded category chips, INR 0 current-month total, no fake category bars, Recent Expenses copy `No expenses yet. Add your first one above.`, and Home/Review/Categories navigation | If categories fail to load, keep Home shell visible and show concise inline failure near the category area |
| Default category seed | Database migration is applied to an empty PostgreSQL database | Category rows exist for Food, Transport, Shopping, Bills, Entertainment, Health, Education, Other with stable IDs, unique names, and protected/default flag | Duplicate seeding should be prevented by migration/model seed behavior and category-name uniqueness |
| Category API | Client requests starter categories | Response returns explicit category DTOs with id, name, and default/protected status | API failures use appropriate ASP.NET Core problem response behavior; no custom envelope |
| Responsive shell | Mobile and desktop viewport widths | Mobile order is Add Expense, Current Month summary, Recent Expenses; desktop uses two columns with Add Expense/summary left and Recent Expenses right | Layout must remain readable without overlapping controls or text |

</frozen-after-approval>

## Code Map

- `_bmad-output/implementation-artifacts/epic-1-context.md` -- distilled Epic 1 requirements, architecture, UX constraints, and cross-story dependencies for implementation.
- `_bmad-output/planning-artifacts/epics.md` -- source Story 1.1 acceptance criteria and requirement IDs.
- `_bmad-output/planning-artifacts/architecture/architecture-bmad-expense-tracker-2026-09-15/ARCHITECTURE-SPINE.md` -- structural seed, stack choices, backend/frontend boundaries, no-auth rule, EF/PostgreSQL decisions.
- `_bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/DESIGN.md` -- visual tokens and constraints for surfaces, ink hierarchy, teal accent, spacing, radius, and anti-dashboard styling.
- `_bmad-output/planning-artifacts/ux-designs/ux-bmad-expense-tracker-2026-09-15/EXPERIENCE.md` -- Home IA, mobile/desktop layout order, category chip pattern, accessibility floor, and empty-state behavior.
- `frontend/` -- does not exist yet; create the Vite React TypeScript app here.
- `backend/` -- does not exist yet; create the ASP.NET Core Web API project here.
- `tests/` -- does not exist yet; create focused backend integration and frontend test scaffolding for this story.
- Do not change or remove existing untracked BMAD planning artifacts; they are approved context for this build run.

## Tasks & Acceptance

**Execution:**
- [x] `frontend/package.json`, `frontend/vite.config.ts`, `frontend/src/**` -- scaffold React/Vite TypeScript with app providers/routing and the required folder layout -- makes Home a runnable local surface.
- [x] `frontend/src/app/**`, `frontend/src/features/expenses/**`, `frontend/src/features/categories/**`, `frontend/src/shared/ui/**`, `frontend/src/shared/api/**` -- implement Home shell, responsive navigation, Add Expense placeholder form, finalized empty Home state (INR 0 total, no fake bars, `No expenses yet. Add your first one above.`), backend-loaded category chip display, API client/types, and accessible shared controls -- satisfies IA, layout, chip, and visual-token acceptance.
- [x] `backend/backend.csproj`, `backend/Program.cs`, `backend/Domain/**`, `backend/Data/**`, `backend/Features/Categories/**` -- scaffold the API, Category domain model, DbContext/configuration, explicit category DTO endpoint, and CORS/dev config as needed -- provides the category foundation without exposing entities.
- [x] `backend/Data/Migrations/**` -- add the initial EF Core migration that creates protected default categories as seeded rows with stable IDs, unique category names, and default/protected flags -- makes explicit developer-applied PostgreSQL initialization possible.
- [x] `tests/backend-integration/**` -- add PostgreSQL/Testcontainers-backed tests that apply migrations and assert the protected default category rows and category API contract -- verifies persistence-sensitive seed behavior.
- [x] `frontend/src/**/*.test.*` or colocated frontend tests -- cover Home default rendering, Home/Review/Categories navigation labels, category chip availability, and basic responsive/layout semantics where practical -- verifies user-visible shell behavior.
- [x] Root-level solution/config files as needed, such as `.gitignore`, `README.md`, or solution files -- add only minimal project-running and verification support -- keeps the new scaffold understandable.

**Acceptance Criteria:**
- Given the frontend dev server is run locally, when the user opens the app, then Home is the default landing surface and Home, Review, and Categories navigation are present without auth/user concepts.
- Given the backend migration is applied to PostgreSQL, when categories are queried, then the eight protected default categories are present as database rows with stable IDs, unique names, protected/default flags, and returned through explicit DTOs.
- Given Home renders on mobile width, when layout is inspected, then Add Expense appears before Current Month summary and Recent Expenses.
- Given Home renders on desktop width, when layout is inspected, then Add Expense and Current Month summary are in the left/main column and Recent Expenses is in the right column.
- Given category choices render in Add Expense, when the user views them, then they are loaded from the backend Category API and appear as wrapping selectable chips with a clear selected state and no dropdown.
- Given the UI is inspected, when styles are reviewed, then DESIGN tokens and constraints are followed without broad gradients, dense dashboard styling, or nested heavy card treatment.
- Given tests are run, when verification completes, then frontend Home/category shell tests and backend PostgreSQL-backed default category seed tests pass.

## Implementation Notes

- Implemented initial React/Vite frontend, ASP.NET Core backend, EF Core category seed model/migration, frontend tests, and backend Testcontainers integration tests for Story 1.1.
- Verified `npm --prefix frontend test`, `npm --prefix frontend run build`, `dotnet build backend/backend.csproj --no-restore`, and `dotnet build tests/backend-integration/backend-integration.csproj --no-restore`.
- `dotnet test tests/backend-integration/backend-integration.csproj --no-build` is blocked in this environment because Docker is not running or reachable for Testcontainers. The first sandboxed attempt also could not open the test runner socket; the escalated attempt reached the test runner but failed on Docker endpoint discovery.
- `dotnet build bmad-expense-tracker.sln --no-restore` hung after compiling the backend project and was stopped; project-level builds succeeded.
- Finalized after rerunning all non-Docker local verification successfully: frontend tests, frontend build, backend project build, and backend integration project build. Testcontainers execution remains an environment verification blocker only; implementation and architecture were kept intact.

## Spec Change Log

## Review Triage Log

## Design Notes

Create only enough Add Expense UI for Story 1.1: a visible, accessible shell with disabled or non-submitting save behavior is acceptable until Story 1.2 implements create. Category chips must use real data from the backend Category API so later stories can reuse the same selection foundation.

## Verification

**Commands:**
- `dotnet test` -- expected: backend integration tests pass, including PostgreSQL/Testcontainers category seed checks.
- `npm --prefix frontend test` -- expected: frontend Home shell and category chip tests pass.
- `npm --prefix frontend run build` -- expected: TypeScript/Vite production build succeeds.
- `dotnet build` -- expected: backend compiles without warnings that indicate broken contracts or missing references.
