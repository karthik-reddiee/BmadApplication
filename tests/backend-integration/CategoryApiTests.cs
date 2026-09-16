using System.Net.Http.Json;
using Backend.Data;
using Backend.Domain;
using Backend.Features.Categories;
using Backend.Features.Expenses;
using Backend.Features.Summaries;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Data;
using System.Net;
using System.Text.Json;
using Testcontainers.PostgreSql;
using Xunit;

namespace Backend.IntegrationTests;

public sealed class CategoryApiTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:17-alpine")
        .WithDatabase("expense_tracker_tests")
        .WithUsername("postgres")
        .WithPassword("postgres")
        .Build();

    private WebApplicationFactory<Program>? _factory;

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();

        _factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.UseEnvironment("Testing");
                builder.ConfigureServices(services =>
                {
                    var descriptor = services.SingleOrDefault(service => service.ServiceType == typeof(DbContextOptions<AppDbContext>));
                    if (descriptor is not null)
                    {
                        services.Remove(descriptor);
                    }

                    services.AddDbContext<AppDbContext>(options => options.UseNpgsql(_postgres.GetConnectionString()));
                });
            });

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Database.MigrateAsync();
    }

    public async Task DisposeAsync()
    {
        if (_factory is not null)
        {
            await _factory.DisposeAsync();
        }

        await _postgres.DisposeAsync();
    }

    [Fact]
    public async Task Migrations_seed_protected_default_categories()
    {
        using var scope = _factory!.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var categories = await dbContext.Categories.AsNoTracking().OrderBy(category => category.Name).ToListAsync();

        categories.Select(category => category.Name).Should().BeEquivalentTo(
        [
            "Food",
            "Transport",
            "Shopping",
            "Bills",
            "Entertainment",
            "Health",
            "Education",
            "Other"
        ]);
        categories.Should().OnlyContain(category => category.Id != Guid.Empty);
        categories.Should().OnlyContain(category => category.IsDefault);
        categories.Should().OnlyContain(category => category.IsProtected);
        categories.Select(category => category.Name).Should().OnlyHaveUniqueItems();
    }

    [Fact]
    public async Task Categories_endpoint_returns_explicit_dtos()
    {
        var client = _factory!.CreateClient();

        var response = await client.GetAsync("/api/categories");

        response.EnsureSuccessStatusCode();
        var categories = await response.Content.ReadFromJsonAsync<List<CategoryDto>>();

        categories.Should().NotBeNull();
        categories!.Should().HaveCount(8);
        categories.Should().ContainEquivalentOf(new
        {
            Id = new Guid("10000000-0000-0000-0000-000000000001"),
            Name = "Food",
            IsDefault = true,
            IsProtected = true
        });
    }

    [Fact]
    public async Task Categories_endpoint_creates_custom_category()
    {
        var client = _factory!.CreateClient();
        var request = new CreateCategoryRequest(" Coffee ");

        var response = await client.PostAsJsonAsync("/api/categories", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var category = await response.Content.ReadFromJsonAsync<CategoryDto>();
        category.Should().NotBeNull();
        category!.Name.Should().Be("Coffee");
        category.IsDefault.Should().BeFalse();
        category.IsProtected.Should().BeFalse();

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var storedCategory = await dbContext.Categories.AsNoTracking().SingleAsync(item => item.Id == category.Id);
        storedCategory.Name.Should().Be("Coffee");
        storedCategory.IsDefault.Should().BeFalse();
        storedCategory.IsProtected.Should().BeFalse();
    }

    [Fact]
    public async Task Categories_endpoint_rejects_empty_custom_category_name_without_saving()
    {
        var client = _factory!.CreateClient();
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var countBefore = await dbContext.Categories.CountAsync();

        var response = await client.PostAsJsonAsync("/api/categories", new CreateCategoryRequest(" "));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        await AssertValidationProblemAsync(response, "Name");

        var countAfter = await dbContext.Categories.CountAsync();
        countAfter.Should().Be(countBefore);
    }

    [Fact]
    public async Task Categories_endpoint_rejects_duplicate_category_name_without_saving()
    {
        var client = _factory!.CreateClient();
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        dbContext.Categories.Add(Category.CreateCustom("Coffee"));
        await dbContext.SaveChangesAsync();
        var countBefore = await dbContext.Categories.CountAsync();

        var response = await client.PostAsJsonAsync("/api/categories", new CreateCategoryRequest(" Coffee "));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        await AssertValidationProblemAsync(response, "Name");

        var countAfter = await dbContext.Categories.CountAsync();
        countAfter.Should().Be(countBefore);
    }

    [Fact]
    public async Task Categories_endpoint_renames_custom_category_and_preserves_expense_associations()
    {
        var client = _factory!.CreateClient();
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var category = Category.CreateCustom("Coffee");
        var expenseId = Guid.NewGuid();
        dbContext.Categories.Add(category);
        dbContext.Expenses.Add(new Expense(
            expenseId,
            120.00m,
            category.Id,
            new DateOnly(2037, 8, 9),
            "Latte",
            new DateTimeOffset(2037, 8, 9, 8, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2037, 8, 9, 8, 0, 0, TimeSpan.Zero)));
        await dbContext.SaveChangesAsync();

        var response = await client.PutAsJsonAsync($"/api/categories/{category.Id}", new UpdateCategoryRequest(" Tea "));

        response.EnsureSuccessStatusCode();
        var renamed = await response.Content.ReadFromJsonAsync<CategoryDto>();
        renamed.Should().NotBeNull();
        renamed!.Id.Should().Be(category.Id);
        renamed.Name.Should().Be("Tea");
        renamed.IsDefault.Should().BeFalse();

        var storedExpense = await dbContext.Expenses.AsNoTracking().SingleAsync(expense => expense.Id == expenseId);
        storedExpense.CategoryId.Should().Be(category.Id);

        var listResponse = await client.GetAsync("/api/expenses");
        listResponse.EnsureSuccessStatusCode();
        var expenses = await listResponse.Content.ReadFromJsonAsync<List<ExpenseListItemDto>>();
        expenses!.Single(expense => expense.Id == expenseId).CategoryName.Should().Be("Tea");
    }

    [Fact]
    public async Task Categories_endpoint_rejects_default_category_rename()
    {
        var client = _factory!.CreateClient();
        var defaultCategoryId = new Guid("10000000-0000-0000-0000-000000000001");

        var response = await client.PutAsJsonAsync($"/api/categories/{defaultCategoryId}", new UpdateCategoryRequest("Groceries"));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        await AssertValidationProblemAsync(response, "Name");

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var category = await dbContext.Categories.AsNoTracking().SingleAsync(item => item.Id == defaultCategoryId);
        category.Name.Should().Be("Food");
        category.IsProtected.Should().BeTrue();
    }

    [Fact]
    public async Task Categories_endpoint_rejects_invalid_custom_category_rename_without_saving()
    {
        var client = _factory!.CreateClient();
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var category = Category.CreateCustom("Coffee");
        dbContext.Categories.Add(category);
        await dbContext.SaveChangesAsync();

        var response = await client.PutAsJsonAsync($"/api/categories/{category.Id}", new UpdateCategoryRequest(" "));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        await AssertValidationProblemAsync(response, "Name");

        var storedCategory = await dbContext.Categories.AsNoTracking().SingleAsync(item => item.Id == category.Id);
        storedCategory.Name.Should().Be("Coffee");
    }

    [Fact]
    public async Task Categories_endpoint_rejects_duplicate_custom_category_rename_without_saving()
    {
        var client = _factory!.CreateClient();
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var coffee = Category.CreateCustom("Coffee");
        var tea = Category.CreateCustom("Tea");
        dbContext.Categories.AddRange(coffee, tea);
        await dbContext.SaveChangesAsync();

        var response = await client.PutAsJsonAsync($"/api/categories/{coffee.Id}", new UpdateCategoryRequest(" Tea "));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        await AssertValidationProblemAsync(response, "Name");

        var storedCategory = await dbContext.Categories.AsNoTracking().SingleAsync(item => item.Id == coffee.Id);
        storedCategory.Name.Should().Be("Coffee");
    }

    [Fact]
    public async Task Categories_endpoint_deletes_unused_custom_category()
    {
        var client = _factory!.CreateClient();
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var category = Category.CreateCustom("Coffee");
        dbContext.Categories.Add(category);
        await dbContext.SaveChangesAsync();

        var response = await client.DeleteAsync($"/api/categories/{category.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        (await dbContext.Categories.AsNoTracking().AnyAsync(item => item.Id == category.Id)).Should().BeFalse();
    }

    [Fact]
    public async Task Categories_endpoint_blocks_in_use_custom_category_delete()
    {
        var client = _factory!.CreateClient();
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var category = Category.CreateCustom("Coffee");
        dbContext.Categories.Add(category);
        dbContext.Expenses.Add(new Expense(
            Guid.NewGuid(),
            120.00m,
            category.Id,
            new DateOnly(2038, 9, 10),
            null,
            new DateTimeOffset(2038, 9, 10, 8, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2038, 9, 10, 8, 0, 0, TimeSpan.Zero)));
        await dbContext.SaveChangesAsync();

        var response = await client.DeleteAsync($"/api/categories/{category.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        var problemJson = await response.Content.ReadAsStringAsync();
        problemJson.Should().Contain("This category is used by existing expenses. Reassign those expenses before deleting it.");
        (await dbContext.Categories.AsNoTracking().AnyAsync(item => item.Id == category.Id)).Should().BeTrue();
    }

    [Fact]
    public async Task Categories_endpoint_blocks_default_category_delete()
    {
        var client = _factory!.CreateClient();
        var defaultCategoryId = new Guid("10000000-0000-0000-0000-000000000001");

        var response = await client.DeleteAsync($"/api/categories/{defaultCategoryId}");

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var category = await dbContext.Categories.AsNoTracking().SingleAsync(item => item.Id == defaultCategoryId);
        category.Name.Should().Be("Food");
        category.IsProtected.Should().BeTrue();
    }

    [Fact]
    public async Task Current_month_summary_filters_groups_totals_and_orders_current_month_expenses()
    {
        var foodId = new Guid("10000000-0000-0000-0000-000000000001");
        var transportId = new Guid("10000000-0000-0000-0000-000000000002");
        var kolkataNow = TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, TimeZoneInfo.FindSystemTimeZoneById("Asia/Kolkata"));
        var monthStart = new DateOnly(kolkataNow.Year, kolkataNow.Month, 1);
        var monthEnd = monthStart.AddMonths(1).AddDays(-1);
        var currentFoodOlderId = Guid.NewGuid();
        var currentFoodNewerId = Guid.NewGuid();
        var currentTransportId = Guid.NewGuid();
        var outsideMonthId = Guid.NewGuid();
        using var scope = _factory!.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        dbContext.Expenses.AddRange(
            new Expense(
                currentFoodOlderId,
                100.25m,
                foodId,
                monthStart,
                "Breakfast",
                new DateTimeOffset(2039, 1, 1, 8, 0, 0, TimeSpan.Zero),
                new DateTimeOffset(2039, 1, 1, 8, 0, 0, TimeSpan.Zero)),
            new Expense(
                currentFoodNewerId,
                50.75m,
                foodId,
                monthEnd,
                "Dinner",
                new DateTimeOffset(2039, 1, 2, 9, 0, 0, TimeSpan.Zero),
                new DateTimeOffset(2039, 1, 2, 9, 0, 0, TimeSpan.Zero)),
            new Expense(
                currentTransportId,
                200.00m,
                transportId,
                monthEnd,
                null,
                new DateTimeOffset(2039, 1, 2, 10, 0, 0, TimeSpan.Zero),
                new DateTimeOffset(2039, 1, 2, 10, 0, 0, TimeSpan.Zero)),
            new Expense(
                outsideMonthId,
                999.00m,
                foodId,
                monthStart.AddDays(-1),
                "Outside",
                new DateTimeOffset(2039, 1, 3, 10, 0, 0, TimeSpan.Zero),
                new DateTimeOffset(2039, 1, 3, 10, 0, 0, TimeSpan.Zero)));
        await dbContext.SaveChangesAsync();
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/summaries/current-month");

        response.EnsureSuccessStatusCode();
        var summary = await response.Content.ReadFromJsonAsync<CurrentMonthSummaryDto>();

        summary.Should().NotBeNull();
        summary!.MonthStart.Should().Be(monthStart);
        summary.MonthEnd.Should().Be(monthEnd);
        summary.TotalAmount.Should().Be(351.00m);
        summary.CategoryBreakdown.Select(item => item.CategoryName).Should().Equal("Transport", "Food");
        summary.CategoryBreakdown[0].Amount.Should().Be(200.00m);
        summary.CategoryBreakdown[1].Amount.Should().Be(151.00m);
        summary.RecentExpenses.Select(expense => expense.Id).Should().StartWith(
        [
            currentTransportId,
            currentFoodNewerId,
            currentFoodOlderId
        ]);
        summary.RecentExpenses.Should().NotContain(expense => expense.Id == outsideMonthId);
    }

    [Fact]
    public async Task Current_month_summary_returns_zero_state_when_no_current_month_expenses_exist()
    {
        var foodId = new Guid("10000000-0000-0000-0000-000000000001");
        var kolkataNow = TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, TimeZoneInfo.FindSystemTimeZoneById("Asia/Kolkata"));
        var monthStart = new DateOnly(kolkataNow.Year, kolkataNow.Month, 1);
        using var scope = _factory!.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        dbContext.Expenses.Add(new Expense(
            Guid.NewGuid(),
            999.00m,
            foodId,
            monthStart.AddDays(-1),
            null,
            new DateTimeOffset(2040, 1, 1, 8, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2040, 1, 1, 8, 0, 0, TimeSpan.Zero)));
        await dbContext.SaveChangesAsync();
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/summaries/current-month");

        response.EnsureSuccessStatusCode();
        var summary = await response.Content.ReadFromJsonAsync<CurrentMonthSummaryDto>();

        summary.Should().NotBeNull();
        summary!.TotalAmount.Should().Be(0m);
        summary.CategoryBreakdown.Should().BeEmpty();
        summary.RecentExpenses.Should().BeEmpty();
    }

    [Fact]
    public async Task Expenses_endpoint_creates_expense_with_explicit_dto_and_required_persistence_types()
    {
        var client = _factory!.CreateClient();
        var request = new CreateExpenseRequest(
            125.50m,
            new Guid("10000000-0000-0000-0000-000000000001"),
            new DateOnly(2026, 9, 16),
            " ");

        var response = await client.PostAsJsonAsync("/api/expenses", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var responseJson = await response.Content.ReadAsStringAsync();
        using var responseDocument = JsonDocument.Parse(responseJson);
        responseDocument.RootElement.TryGetProperty("currency", out _).Should().BeFalse();

        var expenseDto = JsonSerializer.Deserialize<ExpenseDto>(responseJson, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        expenseDto.Should().NotBeNull();
        expenseDto!.Amount.Should().Be(125.50m);
        expenseDto.CategoryId.Should().Be(request.CategoryId);
        expenseDto.ExpenseDate.Should().Be(request.ExpenseDate);
        expenseDto.Description.Should().BeNull();
        expenseDto.CreatedAt.Offset.Should().Be(TimeSpan.Zero);
        expenseDto.UpdatedAt.Offset.Should().Be(TimeSpan.Zero);

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var storedExpense = await dbContext.Expenses.AsNoTracking().SingleAsync();

        storedExpense.Amount.Should().Be(125.50m);
        storedExpense.CategoryId.Should().Be(request.CategoryId);
        storedExpense.ExpenseDate.Should().Be(request.ExpenseDate);
        storedExpense.Description.Should().BeNull();
        storedExpense.CreatedAt.Offset.Should().Be(TimeSpan.Zero);
        storedExpense.UpdatedAt.Offset.Should().Be(TimeSpan.Zero);

        var amountType = await GetColumnTypeAsync(dbContext, "expenses", "amount");
        var expenseDateType = await GetColumnTypeAsync(dbContext, "expenses", "expense_date");
        var createdAtType = await GetColumnTypeAsync(dbContext, "expenses", "created_at");
        var updatedAtType = await GetColumnTypeAsync(dbContext, "expenses", "updated_at");
        var currencyColumnCount = await GetColumnCountAsync(dbContext, "expenses", "currency");

        amountType.Should().Be("numeric(12,2)");
        expenseDateType.Should().Be("date");
        createdAtType.Should().Be("timestamp with time zone");
        updatedAtType.Should().Be("timestamp with time zone");
        currencyColumnCount.Should().Be(0);
    }

    [Fact]
    public async Task Expenses_endpoint_rejects_unknown_category_without_saving()
    {
        var client = _factory!.CreateClient();
        var request = new CreateExpenseRequest(
            42.00m,
            Guid.NewGuid(),
            new DateOnly(2026, 9, 16),
            null);
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var countBefore = await dbContext.Expenses.CountAsync();

        var response = await client.PostAsJsonAsync("/api/expenses", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        await AssertValidationProblemAsync(response, "CategoryId");

        var countAfter = await dbContext.Expenses.CountAsync();
        countAfter.Should().Be(countBefore);
    }

    public static IEnumerable<object[]> InvalidCreateRequests()
    {
        var categoryId = new Guid("10000000-0000-0000-0000-000000000001");

        yield return
        [
            new CreateExpenseRequest(0m, categoryId, new DateOnly(2026, 9, 16), null),
            "Amount"
        ];
        yield return
        [
            new CreateExpenseRequest(12.345m, categoryId, new DateOnly(2026, 9, 16), null),
            "Amount"
        ];
        yield return
        [
            new CreateExpenseRequest(10000000000m, categoryId, new DateOnly(2026, 9, 16), null),
            "Amount"
        ];
        yield return
        [
            new CreateExpenseRequest(12.34m, Guid.Empty, new DateOnly(2026, 9, 16), null),
            "CategoryId"
        ];
        yield return
        [
            new CreateExpenseRequest(12.34m, categoryId, default, null),
            "ExpenseDate"
        ];
        yield return
        [
            new CreateExpenseRequest(12.34m, categoryId, new DateOnly(2026, 9, 16), new string('x', 241)),
            "Description"
        ];
    }

    [Theory]
    [MemberData(nameof(InvalidCreateRequests))]
    public async Task Expenses_endpoint_rejects_invalid_create_requests_without_saving(
        CreateExpenseRequest request,
        string expectedField)
    {
        var client = _factory!.CreateClient();
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var countBefore = await dbContext.Expenses.CountAsync();

        var response = await client.PostAsJsonAsync("/api/expenses", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        await AssertValidationProblemAsync(response, expectedField);

        var countAfter = await dbContext.Expenses.CountAsync();
        countAfter.Should().Be(countBefore);
    }

    [Fact]
    public async Task Expenses_endpoint_returns_empty_list_when_no_expenses_exist()
    {
        var client = _factory!.CreateClient();

        var response = await client.GetAsync("/api/expenses");

        response.EnsureSuccessStatusCode();
        var expenses = await response.Content.ReadFromJsonAsync<List<ExpenseListItemDto>>();

        expenses.Should().NotBeNull();
        expenses.Should().BeEmpty();
    }

    [Fact]
    public async Task Expenses_endpoint_returns_ordered_list_rows_with_category_names()
    {
        var foodId = new Guid("10000000-0000-0000-0000-000000000001");
        var transportId = new Guid("10000000-0000-0000-0000-000000000002");

        using var scope = _factory!.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var olderSameDateId = Guid.NewGuid();
        var newerSameDateId = Guid.NewGuid();
        var olderExpenseDateId = Guid.NewGuid();
        dbContext.Expenses.AddRange(
            new Expense(
                olderSameDateId,
                42.00m,
                foodId,
                new DateOnly(2030, 1, 2),
                "Earlier same day",
                new DateTimeOffset(2030, 1, 2, 8, 0, 0, TimeSpan.Zero),
                new DateTimeOffset(2030, 1, 2, 8, 0, 0, TimeSpan.Zero)),
            new Expense(
                newerSameDateId,
                80.00m,
                transportId,
                new DateOnly(2030, 1, 2),
                null,
                new DateTimeOffset(2030, 1, 2, 9, 0, 0, TimeSpan.Zero),
                new DateTimeOffset(2030, 1, 2, 9, 0, 0, TimeSpan.Zero)),
            new Expense(
                olderExpenseDateId,
                125.50m,
                foodId,
                new DateOnly(2030, 1, 1),
                "Previous day",
                new DateTimeOffset(2030, 1, 1, 10, 0, 0, TimeSpan.Zero),
                new DateTimeOffset(2030, 1, 1, 10, 0, 0, TimeSpan.Zero)));
        await dbContext.SaveChangesAsync();
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/expenses");

        response.EnsureSuccessStatusCode();
        var expenses = await response.Content.ReadFromJsonAsync<List<ExpenseListItemDto>>();

        expenses.Should().NotBeNull();
        expenses!.Select(expense => expense.Id).Should().StartWith(
        [
            newerSameDateId,
            olderSameDateId,
            olderExpenseDateId
        ]);
        expenses[0].CategoryName.Should().Be("Transport");
        expenses[0].Description.Should().BeNull();
        expenses[1].CategoryName.Should().Be("Food");
        expenses[1].Description.Should().Be("Earlier same day");
    }

    [Fact]
    public async Task Expense_detail_endpoint_returns_explicit_detail_dto_with_category_name()
    {
        var foodId = new Guid("10000000-0000-0000-0000-000000000001");
        var expenseId = Guid.NewGuid();
        using var scope = _factory!.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        dbContext.Expenses.Add(new Expense(
            expenseId,
            125.50m,
            foodId,
            new DateOnly(2031, 2, 3),
            "Lunch",
            new DateTimeOffset(2031, 2, 3, 8, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2031, 2, 3, 8, 0, 0, TimeSpan.Zero)));
        await dbContext.SaveChangesAsync();
        var client = _factory.CreateClient();

        var response = await client.GetAsync($"/api/expenses/{expenseId}");

        response.EnsureSuccessStatusCode();
        var detail = await response.Content.ReadFromJsonAsync<ExpenseDetailDto>();
        detail.Should().NotBeNull();
        detail!.Id.Should().Be(expenseId);
        detail.Amount.Should().Be(125.50m);
        detail.CategoryId.Should().Be(foodId);
        detail.CategoryName.Should().Be("Food");
        detail.ExpenseDate.Should().Be(new DateOnly(2031, 2, 3));
        detail.Description.Should().Be("Lunch");
    }

    [Fact]
    public async Task Expense_detail_endpoint_returns_not_found_for_missing_expense()
    {
        var client = _factory!.CreateClient();

        var response = await client.GetAsync($"/api/expenses/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Expense_update_endpoint_updates_editable_fields_and_preserves_created_at()
    {
        var foodId = new Guid("10000000-0000-0000-0000-000000000001");
        var transportId = new Guid("10000000-0000-0000-0000-000000000002");
        var expenseId = Guid.NewGuid();
        var createdAt = new DateTimeOffset(2032, 3, 4, 8, 0, 0, TimeSpan.Zero);
        using var scope = _factory!.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        dbContext.Expenses.Add(new Expense(
            expenseId,
            125.50m,
            foodId,
            new DateOnly(2032, 3, 4),
            "Lunch",
            createdAt,
            createdAt));
        await dbContext.SaveChangesAsync();
        var client = _factory.CreateClient();
        var request = new UpdateExpenseRequest(
            200.00m,
            transportId,
            new DateOnly(2032, 3, 5),
            " Auto ride ");

        var response = await client.PutAsJsonAsync($"/api/expenses/{expenseId}", request);

        response.EnsureSuccessStatusCode();
        var detail = await response.Content.ReadFromJsonAsync<ExpenseDetailDto>();
        detail.Should().NotBeNull();
        detail!.Amount.Should().Be(200.00m);
        detail.CategoryId.Should().Be(transportId);
        detail.CategoryName.Should().Be("Transport");
        detail.ExpenseDate.Should().Be(new DateOnly(2032, 3, 5));
        detail.Description.Should().Be("Auto ride");
        detail.CreatedAt.Should().Be(createdAt);
        detail.UpdatedAt.Should().BeAfter(createdAt);

        var storedExpense = await dbContext.Expenses.AsNoTracking().SingleAsync(expense => expense.Id == expenseId);
        storedExpense.Amount.Should().Be(200.00m);
        storedExpense.CategoryId.Should().Be(transportId);
        storedExpense.ExpenseDate.Should().Be(new DateOnly(2032, 3, 5));
        storedExpense.Description.Should().Be("Auto ride");
        storedExpense.CreatedAt.Should().Be(createdAt);
        storedExpense.UpdatedAt.Should().BeAfter(createdAt);
    }

    [Fact]
    public async Task Expense_update_endpoint_returns_not_found_for_missing_expense()
    {
        var client = _factory!.CreateClient();
        var request = new UpdateExpenseRequest(
            42.00m,
            new Guid("10000000-0000-0000-0000-000000000001"),
            new DateOnly(2032, 3, 5),
            null);

        var response = await client.PutAsJsonAsync($"/api/expenses/{Guid.NewGuid()}", request);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Expense_update_endpoint_rejects_unknown_category_without_saving()
    {
        var foodId = new Guid("10000000-0000-0000-0000-000000000001");
        var expenseId = Guid.NewGuid();
        using var scope = _factory!.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        dbContext.Expenses.Add(new Expense(
            expenseId,
            125.50m,
            foodId,
            new DateOnly(2033, 4, 5),
            "Lunch",
            new DateTimeOffset(2033, 4, 5, 8, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2033, 4, 5, 8, 0, 0, TimeSpan.Zero)));
        await dbContext.SaveChangesAsync();
        var client = _factory.CreateClient();
        var request = new UpdateExpenseRequest(
            42.00m,
            Guid.NewGuid(),
            new DateOnly(2033, 4, 6),
            null);

        var response = await client.PutAsJsonAsync($"/api/expenses/{expenseId}", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        await AssertValidationProblemAsync(response, "CategoryId");

        var storedExpense = await dbContext.Expenses.AsNoTracking().SingleAsync(expense => expense.Id == expenseId);
        storedExpense.Amount.Should().Be(125.50m);
        storedExpense.CategoryId.Should().Be(foodId);
        storedExpense.ExpenseDate.Should().Be(new DateOnly(2033, 4, 5));
    }

    public static IEnumerable<object[]> InvalidUpdateRequests()
    {
        var categoryId = new Guid("10000000-0000-0000-0000-000000000001");

        yield return
        [
            new UpdateExpenseRequest(0m, categoryId, new DateOnly(2034, 5, 6), null),
            "Amount"
        ];
        yield return
        [
            new UpdateExpenseRequest(12.345m, categoryId, new DateOnly(2034, 5, 6), null),
            "Amount"
        ];
        yield return
        [
            new UpdateExpenseRequest(10000000000m, categoryId, new DateOnly(2034, 5, 6), null),
            "Amount"
        ];
        yield return
        [
            new UpdateExpenseRequest(12.34m, Guid.Empty, new DateOnly(2034, 5, 6), null),
            "CategoryId"
        ];
        yield return
        [
            new UpdateExpenseRequest(12.34m, categoryId, default, null),
            "ExpenseDate"
        ];
        yield return
        [
            new UpdateExpenseRequest(12.34m, categoryId, new DateOnly(2034, 5, 6), new string('x', 241)),
            "Description"
        ];
    }

    [Theory]
    [MemberData(nameof(InvalidUpdateRequests))]
    public async Task Expense_update_endpoint_rejects_invalid_update_requests_without_saving(
        UpdateExpenseRequest request,
        string expectedField)
    {
        var foodId = new Guid("10000000-0000-0000-0000-000000000001");
        var expenseId = Guid.NewGuid();
        using var scope = _factory!.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        dbContext.Expenses.Add(new Expense(
            expenseId,
            125.50m,
            foodId,
            new DateOnly(2035, 6, 7),
            "Lunch",
            new DateTimeOffset(2035, 6, 7, 8, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2035, 6, 7, 8, 0, 0, TimeSpan.Zero)));
        await dbContext.SaveChangesAsync();
        var client = _factory.CreateClient();

        var response = await client.PutAsJsonAsync($"/api/expenses/{expenseId}", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        await AssertValidationProblemAsync(response, expectedField);

        var storedExpense = await dbContext.Expenses.AsNoTracking().SingleAsync(expense => expense.Id == expenseId);
        storedExpense.Amount.Should().Be(125.50m);
        storedExpense.CategoryId.Should().Be(foodId);
        storedExpense.ExpenseDate.Should().Be(new DateOnly(2035, 6, 7));
    }

    [Fact]
    public async Task Expense_delete_endpoint_deletes_only_the_requested_expense()
    {
        var foodId = new Guid("10000000-0000-0000-0000-000000000001");
        var expenseId = Guid.NewGuid();
        var retainedExpenseId = Guid.NewGuid();
        using var scope = _factory!.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        dbContext.Expenses.AddRange(
            new Expense(
                expenseId,
                125.50m,
                foodId,
                new DateOnly(2036, 7, 8),
                "Lunch",
                new DateTimeOffset(2036, 7, 8, 8, 0, 0, TimeSpan.Zero),
                new DateTimeOffset(2036, 7, 8, 8, 0, 0, TimeSpan.Zero)),
            new Expense(
                retainedExpenseId,
                42.00m,
                foodId,
                new DateOnly(2036, 7, 9),
                "Dinner",
                new DateTimeOffset(2036, 7, 9, 8, 0, 0, TimeSpan.Zero),
                new DateTimeOffset(2036, 7, 9, 8, 0, 0, TimeSpan.Zero)));
        await dbContext.SaveChangesAsync();
        var client = _factory.CreateClient();

        var response = await client.DeleteAsync($"/api/expenses/{expenseId}");

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        (await dbContext.Expenses.AsNoTracking().AnyAsync(expense => expense.Id == expenseId)).Should().BeFalse();
        (await dbContext.Expenses.AsNoTracking().AnyAsync(expense => expense.Id == retainedExpenseId)).Should().BeTrue();
    }

    [Fact]
    public async Task Expense_delete_endpoint_returns_not_found_for_missing_expense()
    {
        var client = _factory!.CreateClient();

        var response = await client.DeleteAsync($"/api/expenses/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    private static async Task AssertValidationProblemAsync(HttpResponseMessage response, string expectedField)
    {
        var problemJson = await response.Content.ReadAsStringAsync();
        using var problemDocument = JsonDocument.Parse(problemJson);
        var root = problemDocument.RootElement;

        root.GetProperty("status").GetInt32().Should().Be((int)HttpStatusCode.BadRequest);
        root.GetProperty("title").GetString().Should().NotBeNullOrWhiteSpace();
        root.TryGetProperty("errors", out var errors).Should().BeTrue();
        errors.ValueKind.Should().Be(JsonValueKind.Object);
        errors.TryGetProperty(expectedField, out var fieldErrors).Should().BeTrue();
        fieldErrors.ValueKind.Should().Be(JsonValueKind.Array);
        fieldErrors.GetArrayLength().Should().BeGreaterThan(0);
    }

    private static async Task<string> GetColumnTypeAsync(AppDbContext dbContext, string tableName, string columnName)
    {
        var connection = dbContext.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
        {
            await connection.OpenAsync();
        }

        await using var command = connection.CreateCommand();
        command.CommandText = """
            select format_type(a.atttypid, a.atttypmod)
            from pg_attribute a
            join pg_class c on c.oid = a.attrelid
            where c.relname = @tableName
              and a.attname = @columnName
              and a.attnum > 0
              and not a.attisdropped
            """;

        var tableParameter = command.CreateParameter();
        tableParameter.ParameterName = "tableName";
        tableParameter.Value = tableName;
        command.Parameters.Add(tableParameter);

        var columnParameter = command.CreateParameter();
        columnParameter.ParameterName = "columnName";
        columnParameter.Value = columnName;
        command.Parameters.Add(columnParameter);

        var result = await command.ExecuteScalarAsync();
        return result.Should().BeOfType<string>().Subject;
    }

    private static async Task<int> GetColumnCountAsync(AppDbContext dbContext, string tableName, string columnName)
    {
        var connection = dbContext.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
        {
            await connection.OpenAsync();
        }

        await using var command = connection.CreateCommand();
        command.CommandText = """
            select count(*)
            from information_schema.columns
            where table_name = @tableName
              and column_name = @columnName
            """;

        var tableParameter = command.CreateParameter();
        tableParameter.ParameterName = "tableName";
        tableParameter.Value = tableName;
        command.Parameters.Add(tableParameter);

        var columnParameter = command.CreateParameter();
        columnParameter.ParameterName = "columnName";
        columnParameter.Value = columnName;
        command.Parameters.Add(columnParameter);

        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }
}
