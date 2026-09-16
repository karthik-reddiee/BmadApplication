namespace Backend.Features.Categories;

public sealed record CategoryDto(Guid Id, string Name, bool IsDefault, bool IsProtected);

public sealed record CreateCategoryRequest(string Name);

public sealed record UpdateCategoryRequest(string Name);
