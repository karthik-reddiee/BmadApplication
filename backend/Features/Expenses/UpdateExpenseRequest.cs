namespace Backend.Features.Expenses;

public sealed record UpdateExpenseRequest(
    decimal Amount,
    Guid CategoryId,
    DateOnly ExpenseDate,
    string? Description);
