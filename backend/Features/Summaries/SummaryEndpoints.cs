namespace Backend.Features.Summaries;

public static class SummaryEndpoints
{
    public static IEndpointRouteBuilder MapSummaryEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/summaries/current-month", async (
            SummaryService summaryService,
            CancellationToken cancellationToken) =>
        {
            var summary = await summaryService.GetCurrentMonthSummaryAsync(cancellationToken);
            return Results.Ok(summary);
        });

        return endpoints;
    }
}
