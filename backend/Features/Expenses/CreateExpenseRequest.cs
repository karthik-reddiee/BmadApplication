namespace Backend.Features.Expenses;

public sealed record CreateExpenseRequest(
    decimal Amount,
    Guid CategoryId,
    DateOnly ExpenseDate,
    string? Description);
