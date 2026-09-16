# BMAD Expense Tracker

Local MVP scaffold for Story 1.1.

## Run

Backend:

```bash
dotnet run --project backend
```

Frontend:

```bash
npm --prefix frontend install
npm --prefix frontend run dev
```

By default the frontend reads categories from `http://localhost:5000/api/categories`.
Set `VITE_API_BASE_URL` to point at a different backend URL.

## Verify

```bash
dotnet build
dotnet test
npm --prefix frontend test
npm --prefix frontend run build
```

EF migrations are committed and must be applied explicitly by developers.

