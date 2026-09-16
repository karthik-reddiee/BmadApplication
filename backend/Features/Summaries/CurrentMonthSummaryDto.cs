namespace Backend.Features.Summaries;

public sealed record CurrentMonthSummaryDto(
    DateOnly MonthStart,
    DateOnly MonthEnd,
    decimal TotalAmount,
    IReadOnlyList<CurrentMonthCategoryBreakdownDto> CategoryBreakdown,
    IReadOnlyList<CurrentMonthRecentExpenseDto> RecentExpenses);

public sealed record CurrentMonthCategoryBreakdownDto(
    Guid CategoryId,
    string CategoryName,
    decimal Amount);

public sealed record CurrentMonthRecentExpenseDto(
    Guid Id,
    decimal Amount,
    Guid CategoryId,
    string CategoryName,
    DateOnly ExpenseDate,
    string? Description,
    DateTimeOffset CreatedAt);
