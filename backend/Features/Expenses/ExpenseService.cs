using Backend.Data;
using Backend.Domain;
using Microsoft.EntityFrameworkCore;

namespace Backend.Features.Expenses;

public sealed class ExpenseService(AppDbContext dbContext)
{
    private const decimal MaxAmount = 9999999999.99m;
    private const int MaxDescriptionLength = 240;

    public async Task<IReadOnlyList<ExpenseListItemDto>> GetExpensesAsync(CancellationToken cancellationToken)
    {
        return await (
            from expense in dbContext.Expenses.AsNoTracking()
            join category in dbContext.Categories.AsNoTracking()
                on expense.CategoryId equals category.Id
            orderby expense.ExpenseDate descending, expense.CreatedAt descending, expense.Id descending
            select new ExpenseListItemDto(
                expense.Id,
                expense.Amount,
                expense.CategoryId,
                category.Name,
                expense.ExpenseDate,
                expense.Description,
                expense.CreatedAt))
            .ToListAsync(cancellationToken);
    }

    public async Task<ExpenseDetailDto?> GetExpenseAsync(Guid id, CancellationToken cancellationToken)
    {
        return await (
            from expense in dbContext.Expenses.AsNoTracking()
            join category in dbContext.Categories.AsNoTracking()
                on expense.CategoryId equals category.Id
            where expense.Id == id
            select new ExpenseDetailDto(
                expense.Id,
                expense.Amount,
                expense.CategoryId,
                category.Name,
                expense.ExpenseDate,
                expense.Description,
                expense.CreatedAt,
                expense.UpdatedAt))
            .SingleOrDefaultAsync(cancellationToken);
    }

    public async Task<CreateExpenseResult> CreateExpenseAsync(CreateExpenseRequest request, CancellationToken cancellationToken)
    {
        var errors = ValidateRequest(request);
        if (errors.Count > 0)
        {
            return CreateExpenseResult.Invalid(errors);
        }

        var categoryExists = await dbContext.Categories
            .AsNoTracking()
            .AnyAsync(category => category.Id == request.CategoryId, cancellationToken);

        if (!categoryExists)
        {
            return CreateExpenseResult.Invalid(new Dictionary<string, string[]>
            {
                [nameof(request.CategoryId)] = ["Choose an existing category."]
            });
        }

        var expense = Expense.Create(
            request.Amount,
            request.CategoryId,
            request.ExpenseDate,
            request.Description,
            DateTimeOffset.UtcNow);

        dbContext.Expenses.Add(expense);
        await dbContext.SaveChangesAsync(cancellationToken);

        return CreateExpenseResult.Created(ToDto(expense));
    }

    public async Task<UpdateExpenseResult> UpdateExpenseAsync(
        Guid id,
        UpdateExpenseRequest request,
        CancellationToken cancellationToken)
    {
        var errors = ValidateRequest(request.Amount, request.CategoryId, request.ExpenseDate, request.Description);
        if (errors.Count > 0)
        {
            return UpdateExpenseResult.Invalid(errors);
        }

        var expense = await dbContext.Expenses.SingleOrDefaultAsync(expense => expense.Id == id, cancellationToken);
        if (expense is null)
        {
            return UpdateExpenseResult.NotFound();
        }

        var categoryExists = await dbContext.Categories
            .AsNoTracking()
            .AnyAsync(category => category.Id == request.CategoryId, cancellationToken);

        if (!categoryExists)
        {
            return UpdateExpenseResult.Invalid(new Dictionary<string, string[]>
            {
                [nameof(request.CategoryId)] = ["Choose an existing category."]
            });
        }

        expense.Update(
            request.Amount,
            request.CategoryId,
            request.ExpenseDate,
            request.Description,
            DateTimeOffset.UtcNow);

        await dbContext.SaveChangesAsync(cancellationToken);

        var detail = await GetExpenseAsync(expense.Id, cancellationToken);
        return detail is null ? UpdateExpenseResult.NotFound() : UpdateExpenseResult.Updated(detail);
    }

    public async Task<bool> DeleteExpenseAsync(Guid id, CancellationToken cancellationToken)
    {
        var expense = await dbContext.Expenses.SingleOrDefaultAsync(expense => expense.Id == id, cancellationToken);
        if (expense is null)
        {
            return false;
        }

        dbContext.Expenses.Remove(expense);
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return false;
        }

        return true;
    }

    private static Dictionary<string, string[]> ValidateRequest(CreateExpenseRequest request)
    {
        return ValidateRequest(request.Amount, request.CategoryId, request.ExpenseDate, request.Description);
    }

    private static Dictionary<string, string[]> ValidateRequest(
        decimal amount,
        Guid categoryId,
        DateOnly expenseDate,
        string? description)
    {
        var errors = new Dictionary<string, string[]>();

        if (amount <= 0)
        {
            errors[nameof(CreateExpenseRequest.Amount)] = ["Enter a positive amount."];
        }
        else if (amount > MaxAmount)
        {
            errors[nameof(CreateExpenseRequest.Amount)] = ["Enter a smaller amount."];
        }
        else if (decimal.Round(amount, 2) != amount)
        {
            errors[nameof(CreateExpenseRequest.Amount)] = ["Enter an amount with no more than two decimal places."];
        }

        if (categoryId == Guid.Empty)
        {
            errors[nameof(CreateExpenseRequest.CategoryId)] = ["Choose a category."];
        }

        if (expenseDate == default)
        {
            errors[nameof(CreateExpenseRequest.ExpenseDate)] = ["Choose a date."];
        }

        if (description?.Trim().Length > MaxDescriptionLength)
        {
            errors[nameof(CreateExpenseRequest.Description)] = ["Keep description under 240 characters."];
        }

        return errors;
    }

    private static ExpenseDto ToDto(Expense expense)
    {
        return new ExpenseDto(
            expense.Id,
            expense.Amount,
            expense.CategoryId,
            expense.ExpenseDate,
            expense.Description,
            expense.CreatedAt,
            expense.UpdatedAt);
    }
}

public sealed record CreateExpenseResult(ExpenseDto? Expense, Dictionary<string, string[]> Errors)
{
    public bool IsValid => Errors.Count == 0;

    public static CreateExpenseResult Created(ExpenseDto expense)
    {
        return new CreateExpenseResult(expense, []);
    }

    public static CreateExpenseResult Invalid(Dictionary<string, string[]> errors)
    {
        return new CreateExpenseResult(null, errors);
    }
}

public sealed record UpdateExpenseResult(ExpenseDetailDto? Expense, Dictionary<string, string[]> Errors, bool WasFound)
{
    public bool IsValid => Errors.Count == 0;

    public static UpdateExpenseResult Updated(ExpenseDetailDto expense)
    {
        return new UpdateExpenseResult(expense, [], true);
    }

    public static UpdateExpenseResult Invalid(Dictionary<string, string[]> errors)
    {
        return new UpdateExpenseResult(null, errors, true);
    }

    public static UpdateExpenseResult NotFound()
    {
        return new UpdateExpenseResult(null, [], false);
    }
}
