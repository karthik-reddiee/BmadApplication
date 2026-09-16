namespace Backend.Features.Expenses;

public sealed record ExpenseDto(
    Guid Id,
    decimal Amount,
    Guid CategoryId,
    DateOnly ExpenseDate,
    string? Description,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record ExpenseListItemDto(
    Guid Id,
    decimal Amount,
    Guid CategoryId,
    string CategoryName,
    DateOnly ExpenseDate,
    string? Description,
    DateTimeOffset CreatedAt);

public sealed record ExpenseDetailDto(
    Guid Id,
    decimal Amount,
    Guid CategoryId,
    string CategoryName,
    DateOnly ExpenseDate,
    string? Description,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
