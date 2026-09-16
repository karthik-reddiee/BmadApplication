# Epic 3 Context: Simple Category Management

<!-- Compiled from finalized SPEC, EXPERIENCE, DESIGN, ARCHITECTURE-SPINE, epics.md, and previous-story continuity. -->

## Goal

Epic 3 makes Categories manageable while preserving the safety guarantees already used by Expense capture/editing. Users can view protected Default Categories, create Custom Categories, later rename them safely, and delete only unused custom rows without orphaning Expenses.

## Stories

- Story 3.1: View Categories and Create a Custom Category
- Story 3.2: Rename a Custom Category Safely
- Story 3.3: Delete Only Unused Custom Categories

## Requirements & Constraints

Categories are first-class rows. Expenses store `CategoryId` and resolve names from Category rows; Expense must not snapshot Category name. Default Categories are seeded, protected, visible to the user, and unavailable for edit/delete controls in the MVP. Custom Categories can be created, renamed, and deleted only when unused.

The Categories surface has two sections: protected Default Categories and Custom Categories. Custom Categories support Add/Edit/Delete across the epic. Story 3.1 is limited to viewing the two sections and creating Custom Categories through a compact inline form. If no custom categories exist, the exact empty copy is `No custom categories yet. Add one to get started.` Successful create feedback is `Category added.`

Category names are required. Validation feedback stays near the name field and preserves context. Backend validation is authoritative and uses ASP.NET Core `ValidationProblemDetails`/`ProblemDetails`; frontend validation is immediate for UX.

Creating a Custom Category must make it available as a category chip in Add Expense and Edit Expense using the same selected-chip behavior as Default Categories. Story 3.1 must not add rename, delete, reassignment, grouping, search/filter/sort-heavy category management, authentication, or broader personal-finance scope.

## Technical Decisions

Keep the existing React/Vite TypeScript frontend, ASP.NET Core Web API backend, and PostgreSQL persistence. Preserve the single backend project with feature folders, Domain, Data, and explicit DTO contracts. Use resource-oriented REST endpoints for Categories; endpoints stay thin and delegate to `CategoryService`.

Use TanStack Query for Category server state. Category API DTOs/functions live in `frontend/src/shared/api/categories.ts`; UI components import typed API helpers instead of hand-shaping raw backend responses. Do not introduce Redux, Zustand, CQRS, MediatR, auth/user ownership, startup migrations, Docker changes, or summary denormalization.

Backend category persistence remains PostgreSQL/EF Core. Default rows are protected with stable seeded ids, unique category names, and flags. Story 3.1 adds custom creation without modifying default protection semantics.

Backend integration tests should cover PostgreSQL-sensitive category create/validation behavior when Docker/Testcontainers is available. In this local environment, if Docker is unavailable, compile the tests and record Testcontainers execution as an environment blocker without changing architecture.

## UX & Interaction Patterns

The Categories page is a simple management surface, not a dashboard. It follows the existing visual system: warm off-white base, white raised surfaces, teal primary action, semantic success/error feedback, practical spacing, modest radii, and no nested heavy card treatment.

Default Categories render as protected, readable items with no edit/delete controls. Custom Categories render separately. The add form is compact and inline on the Categories screen with a labeled name field and Add action.

Success feedback uses compact transient status copy. Errors are inline near the relevant field/action. Keyboard access must work for navigation, the category name input, Add button, and any category rows. Empty Custom Categories use the exact finalized copy.

## Cross-Story Dependencies

Story 3.1 depends on Epic 1's seeded Default Categories, `GET /api/categories`, category chips in Add Expense, and Story 2.2's Edit Expense category chip behavior.

Story 3.2 depends on Story 3.1's Categories surface and custom category list. It adds rename behavior while preserving Expense associations through unchanged `CategoryId`.

Story 3.3 depends on Story 3.1/3.2 category management and the Expense foreign key. It adds deletion only for unused custom categories, blocking in-use/default deletes through business rules and FK integrity.
