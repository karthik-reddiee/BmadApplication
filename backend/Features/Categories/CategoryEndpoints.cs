namespace Backend.Features.Categories;

public static class CategoryEndpoints
{
    public static IEndpointRouteBuilder MapCategoryEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/categories", async (CategoryService categoryService, CancellationToken cancellationToken) =>
        {
            var categories = await categoryService.GetCategoriesAsync(cancellationToken);
            return Results.Ok(categories);
        });

        endpoints.MapPost("/api/categories", async (
            CreateCategoryRequest request,
            CategoryService categoryService,
            CancellationToken cancellationToken) =>
        {
            var result = await categoryService.CreateCategoryAsync(request, cancellationToken);

            if (!result.IsValid)
            {
                return Results.ValidationProblem(result.Errors);
            }

            return Results.Created($"/api/categories/{result.Category!.Id}", result.Category);
        });

        endpoints.MapPut("/api/categories/{id:guid}", async (
            Guid id,
            UpdateCategoryRequest request,
            CategoryService categoryService,
            CancellationToken cancellationToken) =>
        {
            var result = await categoryService.UpdateCategoryAsync(id, request, cancellationToken);

            if (!result.WasFound)
            {
                return Results.NotFound();
            }

            if (!result.IsValid)
            {
                return Results.ValidationProblem(result.Errors);
            }

            return Results.Ok(result.Category);
        });

        endpoints.MapDelete("/api/categories/{id:guid}", async (
            Guid id,
            CategoryService categoryService,
            CancellationToken cancellationToken) =>
        {
            var result = await categoryService.DeleteCategoryAsync(id, cancellationToken);

            if (!result.WasFound)
            {
                return Results.NotFound();
            }

            if (!result.WasDeleted)
            {
                return Results.Problem(
                    detail: result.Error,
                    statusCode: StatusCodes.Status409Conflict,
                    title: "Category could not be deleted.");
            }

            return Results.NoContent();
        });

        return endpoints;
    }
}
