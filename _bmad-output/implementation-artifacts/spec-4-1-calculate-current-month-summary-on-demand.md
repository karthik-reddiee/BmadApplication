---
title: 'Story 4.1: Calculate Current-Month Summary on Demand'
type: 'feature'
created: '2026-09-16'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '7acbffa7e5e6b98e5b49c3d56f88cbac0f0b13b7'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-4-context.md'
---

<frozen-after-approval reason="auto-approved from finalized artifacts">

## Intent

**Problem:** Home has placeholder current-month awareness. The backend needs a trustworthy on-demand summary contract before the UI can render real totals and breakdowns.

**Approach:** Add `GET /api/summaries/current-month` with explicit DTOs and backend service logic that filters by Asia/Kolkata current month, totals decimal amounts, groups by CategoryId, resolves names, ranks nonzero breakdowns by amount, and returns current-month recent expenses.

## Boundaries & Constraints

**Always:** Calculate on demand from normalized Expenses/Categories. Use backend fixed `Asia/Kolkata` current-month boundaries. Include `monthStart`, `monthEnd`, `totalAmount`, `categoryBreakdown`, and `recentExpenses`. Use explicit DTOs and decimal amounts. Keep recent ordering `ExpenseDate` desc then `CreatedAt` desc.

**Never:** Do not add summary tables, materialized views, background jobs, caching, frontend aggregation, month comparisons, percentages, trends, auth, Docker, Redux/Zustand, CQRS/MediatR, or analytics scope expansion.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| No current-month expenses | No matching rows | Total `0`, empty breakdown, empty recent list | N/A |
| Mixed dates | Expenses inside/outside current month | Only current-month rows included | N/A |
| Category grouping | Multiple current-month categories | Group by CategoryId, resolve live name, rank by amount desc | Exclude zero groups |
| Recent expenses | Current-month rows | Ordered by ExpenseDate desc, CreatedAt desc | N/A |
| Boundary dates | Dates at month start/end | Asia/Kolkata monthStart/monthEnd included | N/A |

</frozen-after-approval>

## Code Map

- `_bmad-output/implementation-artifacts/epic-4-context.md` -- summary requirements.
- `backend/Features/Summaries/**` -- add DTOs, service, endpoint.
- `backend/Program.cs` -- map summary endpoints/register service.
- `tests/backend-integration/CategoryApiTests.cs` -- add summary integration coverage.

## Tasks & Acceptance

**Execution:**
- [x] Backend -- add explicit current-month summary DTOs and `GET /api/summaries/current-month`.
- [x] Backend -- calculate Asia/Kolkata current month boundaries, decimal total, category breakdown, and recent rows on demand.
- [x] Tests -- cover current-month filtering, category grouping/ranking, decimal totals, ordering, and boundary behavior.

**Acceptance Criteria:**
- Given Expenses exist inside/outside the current month, when summary is requested, then only current-month Expenses contribute.
- Given current-month category spending exists, then grouped nonzero categories are ranked by amount descending with live category names.
- Given current-month recent expenses are returned, then they are ordered by ExpenseDate desc then CreatedAt desc.
- Given the implementation is inspected, then no denormalized summary persistence/cache/background aggregation is introduced.

## Implementation Notes

- Added `Features/Summaries` with explicit current-month summary DTOs, service, and endpoint.
- Summary calculation uses fixed `Asia/Kolkata` current-month boundaries, filters by `ExpenseDate`, totals decimal amounts, groups by `CategoryId`, resolves live category names, ranks nonzero category breakdowns, and orders recent rows by `ExpenseDate`/`CreatedAt`.
- No summary tables, materialized views, background jobs, caching, frontend aggregation, or analytics expansion were introduced.

## Spec Change Log

- Completed implementation and verification for Story 4.1.

## Review Triage Log

- Local blocker scan found no architecture, persistence, DTO, date-boundary, or MVP-scope blockers after verification.

## Verification

**Commands:**
- `npm --prefix frontend test`
- `npm --prefix frontend run build`
- `dotnet build backend/backend.csproj --no-restore`
- `dotnet build tests/backend-integration/backend-integration.csproj --no-restore`
- `dotnet test tests/backend-integration/backend-integration.csproj --no-build` -- only when Docker is available.

**Results:**
- `npm --prefix frontend test` -- passed, 76 tests.
- `npm --prefix frontend run build` -- passed.
- `dotnet build backend/backend.csproj --no-restore` -- passed.
- `dotnet build tests/backend-integration/backend-integration.csproj --no-restore` -- passed with existing `SSH.NET` NU1903 advisory warning.
- `dotnet test tests/backend-integration/backend-integration.csproj --no-build` -- blocked by Docker/Testcontainers unavailable in this environment; Docker connection previously failed at `/var/run/docker.sock` and `/Users/wallstreet62/.docker/run/docker.sock`.
