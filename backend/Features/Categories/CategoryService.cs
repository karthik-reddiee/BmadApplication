using Backend.Data;
using Backend.Domain;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Backend.Features.Categories;

public sealed class CategoryService(AppDbContext dbContext)
{
    private const int MaxCategoryNameLength = 80;

    public async Task<IReadOnlyList<CategoryDto>> GetCategoriesAsync(CancellationToken cancellationToken)
    {
        return await dbContext.Categories
            .AsNoTracking()
            .OrderBy(category => category.Name == "Other")
            .ThenBy(category => category.Name)
            .Select(category => new CategoryDto(
                category.Id,
                category.Name,
                category.IsDefault,
                category.IsProtected))
            .ToListAsync(cancellationToken);
    }

    public async Task<CreateCategoryResult> CreateCategoryAsync(CreateCategoryRequest request, CancellationToken cancellationToken)
    {
        var errors = ValidateCreateRequest(request);
        if (errors.Count > 0)
        {
            return CreateCategoryResult.Invalid(errors);
        }

        var name = request.Name.Trim();
        var nameExists = await dbContext.Categories
            .AsNoTracking()
            .AnyAsync(category => category.Name == name, cancellationToken);

        if (nameExists)
        {
            return CreateCategoryResult.Invalid(new Dictionary<string, string[]>
            {
                [nameof(request.Name)] = ["Category name already exists."]
            });
        }

        var category = Category.CreateCustom(name);
        dbContext.Categories.Add(category);
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (IsUniqueCategoryNameViolation(exception))
        {
            return CreateCategoryResult.Invalid(new Dictionary<string, string[]>
            {
                [nameof(request.Name)] = ["Category name already exists."]
            });
        }

        return CreateCategoryResult.Created(ToDto(category));
    }

    public async Task<UpdateCategoryResult> UpdateCategoryAsync(
        Guid id,
        UpdateCategoryRequest request,
        CancellationToken cancellationToken)
    {
        var errors = ValidateName(request.Name);
        if (errors.Count > 0)
        {
            return UpdateCategoryResult.Invalid(errors);
        }

        var category = await dbContext.Categories.SingleOrDefaultAsync(category => category.Id == id, cancellationToken);
        if (category is null)
        {
            return UpdateCategoryResult.NotFound();
        }

        if (category.IsDefault || category.IsProtected)
        {
            return UpdateCategoryResult.Invalid(new Dictionary<string, string[]>
            {
                [nameof(request.Name)] = ["Default categories cannot be renamed."]
            });
        }

        var name = request.Name.Trim();
        var nameExists = await dbContext.Categories
            .AsNoTracking()
            .AnyAsync(existing => existing.Id != id && existing.Name == name, cancellationToken);

        if (nameExists)
        {
            return UpdateCategoryResult.Invalid(new Dictionary<string, string[]>
            {
                [nameof(request.Name)] = ["Category name already exists."]
            });
        }

        category.Rename(name);
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (IsUniqueCategoryNameViolation(exception))
        {
            return UpdateCategoryResult.Invalid(new Dictionary<string, string[]>
            {
                [nameof(request.Name)] = ["Category name already exists."]
            });
        }

        return UpdateCategoryResult.Updated(ToDto(category));
    }

    public async Task<DeleteCategoryResult> DeleteCategoryAsync(Guid id, CancellationToken cancellationToken)
    {
        var category = await dbContext.Categories.SingleOrDefaultAsync(category => category.Id == id, cancellationToken);
        if (category is null)
        {
            return DeleteCategoryResult.NotFound();
        }

        if (category.IsDefault || category.IsProtected)
        {
            return DeleteCategoryResult.Blocked("Default categories cannot be deleted.");
        }

        var isUsed = await dbContext.Expenses
            .AsNoTracking()
            .AnyAsync(expense => expense.CategoryId == id, cancellationToken);

        if (isUsed)
        {
            return DeleteCategoryResult.Blocked("This category is used by existing expenses. Reassign those expenses before deleting it.");
        }

        dbContext.Categories.Remove(category);
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            return DeleteCategoryResult.Blocked("This category is used by existing expenses. Reassign those expenses before deleting it.");
        }

        return DeleteCategoryResult.Deleted();
    }

    private static Dictionary<string, string[]> ValidateCreateRequest(CreateCategoryRequest request)
    {
        return ValidateName(request.Name);
    }

    private static Dictionary<string, string[]> ValidateName(string name)
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(name))
        {
            errors["Name"] = ["Enter a category name."];
        }
        else if (name.Trim().Length > MaxCategoryNameLength)
        {
            errors["Name"] = ["Keep category name under 80 characters."];
        }

        return errors;
    }

    private static CategoryDto ToDto(Category category)
    {
        return new CategoryDto(category.Id, category.Name, category.IsDefault, category.IsProtected);
    }

    private static bool IsUniqueCategoryNameViolation(DbUpdateException exception)
    {
        return exception.InnerException is PostgresException postgresException
            && postgresException.SqlState == PostgresErrorCodes.UniqueViolation;
    }
}

public sealed record CreateCategoryResult(CategoryDto? Category, Dictionary<string, string[]> Errors)
{
    public bool IsValid => Errors.Count == 0;

    public static CreateCategoryResult Created(CategoryDto category)
    {
        return new CreateCategoryResult(category, []);
    }

    public static CreateCategoryResult Invalid(Dictionary<string, string[]> errors)
    {
        return new CreateCategoryResult(null, errors);
    }
}

public sealed record UpdateCategoryResult(CategoryDto? Category, Dictionary<string, string[]> Errors, bool WasFound)
{
    public bool IsValid => Errors.Count == 0;

    public static UpdateCategoryResult Updated(CategoryDto category)
    {
        return new UpdateCategoryResult(category, [], true);
    }

    public static UpdateCategoryResult Invalid(Dictionary<string, string[]> errors)
    {
        return new UpdateCategoryResult(null, errors, true);
    }

    public static UpdateCategoryResult NotFound()
    {
        return new UpdateCategoryResult(null, [], false);
    }
}

public sealed record DeleteCategoryResult(bool WasDeleted, bool WasFound, string? Error)
{
    public static DeleteCategoryResult Deleted()
    {
        return new DeleteCategoryResult(true, true, null);
    }

    public static DeleteCategoryResult Blocked(string error)
    {
        return new DeleteCategoryResult(false, true, error);
    }

    public static DeleteCategoryResult NotFound()
    {
        return new DeleteCategoryResult(false, false, null);
    }
}
