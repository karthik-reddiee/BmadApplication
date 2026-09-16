using Backend.Data;
using Backend.Features.Categories;
using Backend.Features.Expenses;
using Backend.Features.Summaries;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddProblemDetails();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddScoped<CategoryService>();
builder.Services.AddScoped<ExpenseService>();
builder.Services.AddScoped<SummaryService>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendDev", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
            Uri.TryCreate(origin, UriKind.Absolute, out var uri)
            && (uri.Host == "localhost" || uri.Host == "127.0.0.1")
            && uri.Port is >= 5173 and <= 5199)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseCors("FrontendDev");
app.UseExceptionHandler();
app.MapCategoryEndpoints();
app.MapExpenseEndpoints();
app.MapSummaryEndpoints();

app.Run();

public partial class Program;
