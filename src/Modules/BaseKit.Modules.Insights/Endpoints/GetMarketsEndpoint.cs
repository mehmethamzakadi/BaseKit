using BaseKit.Modules.Insights.Contracts;
using BaseKit.Modules.Insights.Providers;
using FastEndpoints;

namespace BaseKit.Modules.Insights.Endpoints;

/// <summary>Bitcoin + USD/TRY + EUR/TRY birleşik piyasa görünümü. Kimlik doğrulaması gerekir.</summary>
public sealed class GetMarketsEndpoint(MarketsClient markets)
    : EndpointWithoutRequest<MarketsResponse>
{
    public override void Configure()
    {
        Get("/insights/markets");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        await Send.OkAsync(await markets.GetAsync(ct), ct);
    }
}
