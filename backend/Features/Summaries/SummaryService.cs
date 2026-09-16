using Backend.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Features.Summaries;

public sealed class SummaryService(AppDbContext dbContext)
{
    private static readonly TimeZoneInfo KolkataTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Kolkata");

    public async Task<CurrentMonthSummaryDto> GetCurrentMonthSummaryAsync(CancellationToken cancellationToken)
    {
        var nowInKolkata = TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, KolkataTimeZone);
        var monthStart = new DateOnly(nowInKolkata.Year, nowInKolkata.Month, 1);
        var monthEnd = monthStart.AddMonths(1).AddDays(-1);

        var currentMonthExpenses = await (
            from expense in dbContext.Expenses.AsNoTracking()
            join category in dbContext.Categories.AsNoTracking()
                on expense.CategoryId equals category.Id
            where expense.ExpenseDate >= monthStart && expense.ExpenseDate <= monthEnd
            select new
            {
                expense.Id,
                expense.Amount,
                expense.CategoryId,
                CategoryName = category.Name,
                expense.ExpenseDate,
                expense.Description,
                expense.CreatedAt
            })
            .ToListAsync(cancellationToken);

        var totalAmount = currentMonthExpenses.Sum(expense => expense.Amount);
        var categoryBreakdown = currentMonthExpenses
            .GroupBy(expense => new { expense.CategoryId, expense.CategoryName })
            .Select(group => new CurrentMonthCategoryBreakdownDto(
                group.Key.CategoryId,
                group.Key.CategoryName,
                group.Sum(expense => expense.Amount)))
            .Where(item => item.Amount > 0)
            .OrderByDescending(item => item.Amount)
            .ThenBy(item => item.CategoryName)
            .ToList();

        var recentExpenses = currentMonthExpenses
            .OrderByDescending(expense => expense.ExpenseDate)
            .ThenByDescending(expense => expense.CreatedAt)
            .ThenByDescending(expense => expense.Id)
            .Select(expense => new CurrentMonthRecentExpenseDto(
                expense.Id,
                expense.Amount,
                expense.CategoryId,
                expense.CategoryName,
                expense.ExpenseDate,
                expense.Description,
                expense.CreatedAt))
            .ToList();

        return new CurrentMonthSummaryDto(
            monthStart,
            monthEnd,
            totalAmount,
            categoryBreakdown,
            recentExpenses);
    }
}
