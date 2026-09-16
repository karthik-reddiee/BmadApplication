namespace Backend.Features.Expenses;

public static class ExpenseEndpoints
{
    public static IEndpointRouteBuilder MapExpenseEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/expenses", async (
            ExpenseService expenseService,
            CancellationToken cancellationToken) =>
        {
            var expenses = await expenseService.GetExpensesAsync(cancellationToken);

            return Results.Ok(expenses);
        });

        endpoints.MapPost("/api/expenses", async (
            CreateExpenseRequest request,
            ExpenseService expenseService,
            CancellationToken cancellationToken) =>
        {
            var result = await expenseService.CreateExpenseAsync(request, cancellationToken);

            if (!result.IsValid)
            {
                return Results.ValidationProblem(result.Errors);
            }

            return Results.Created($"/api/expenses/{result.Expense!.Id}", result.Expense);
        });

        endpoints.MapGet("/api/expenses/{id:guid}", async (
            Guid id,
            ExpenseService expenseService,
            CancellationToken cancellationToken) =>
        {
            var expense = await expenseService.GetExpenseAsync(id, cancellationToken);

            return expense is null ? Results.NotFound() : Results.Ok(expense);
        });

        endpoints.MapPut("/api/expenses/{id:guid}", async (
            Guid id,
            UpdateExpenseRequest request,
            ExpenseService expenseService,
            CancellationToken cancellationToken) =>
        {
            var result = await expenseService.UpdateExpenseAsync(id, request, cancellationToken);

            if (!result.WasFound)
            {
                return Results.NotFound();
            }

            if (!result.IsValid)
            {
                return Results.ValidationProblem(result.Errors);
            }

            return Results.Ok(result.Expense);
        });

        endpoints.MapDelete("/api/expenses/{id:guid}", async (
            Guid id,
            ExpenseService expenseService,
            CancellationToken cancellationToken) =>
        {
            var wasDeleted = await expenseService.DeleteExpenseAsync(id, cancellationToken);

            return wasDeleted ? Results.NoContent() : Results.NotFound();
        });

        return endpoints;
    }
}
