namespace Backend.Domain;

public sealed class Expense
{
    public Guid Id { get; private set; }
    public decimal Amount { get; private set; }
    public Guid CategoryId { get; private set; }
    public DateOnly ExpenseDate { get; private set; }
    public string? Description { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private Expense()
    {
    }

    public Expense(
        Guid id,
        decimal amount,
        Guid categoryId,
        DateOnly expenseDate,
        string? description,
        DateTimeOffset createdAt,
        DateTimeOffset updatedAt)
    {
        Validate(id, amount, categoryId, expenseDate);

        Id = id;
        Amount = amount;
        CategoryId = categoryId;
        ExpenseDate = expenseDate;
        Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        CreatedAt = createdAt.ToUniversalTime();
        UpdatedAt = updatedAt.ToUniversalTime();
    }

    public static Expense Create(decimal amount, Guid categoryId, DateOnly expenseDate, string? description, DateTimeOffset now)
    {
        var utcNow = now.ToUniversalTime();
        return new Expense(Guid.NewGuid(), amount, categoryId, expenseDate, description, utcNow, utcNow);
    }

    public void Update(decimal amount, Guid categoryId, DateOnly expenseDate, string? description, DateTimeOffset now)
    {
        Validate(Id, amount, categoryId, expenseDate);

        Amount = amount;
        CategoryId = categoryId;
        ExpenseDate = expenseDate;
        Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        UpdatedAt = now.ToUniversalTime();
    }

    private static void Validate(Guid id, decimal amount, Guid categoryId, DateOnly expenseDate)
    {
        if (id == Guid.Empty)
        {
            throw new ArgumentException("Expense id is required.", nameof(id));
        }

        if (amount <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(amount), "Expense amount must be positive.");
        }

        if (decimal.Round(amount, 2) != amount)
        {
            throw new ArgumentOutOfRangeException(nameof(amount), "Expense amount must use at most two decimal places.");
        }

        if (categoryId == Guid.Empty)
        {
            throw new ArgumentException("Category id is required.", nameof(categoryId));
        }

        if (expenseDate == default)
        {
            throw new ArgumentException("Expense date is required.", nameof(expenseDate));
        }
    }
}
