using BaseKit.Modules.Insights.Contracts;
using BaseKit.Modules.Insights.Providers;
using FastEndpoints;

namespace BaseKit.Modules.Insights.Endpoints;

/// <summary>Türkiye manşetlerini döner. Kimlik doğrulaması gerekir.</summary>
public sealed class GetNewsEndpoint(NewsClient news)
    : EndpointWithoutRequest<NewsResponse>
{
    public override void Configure()
    {
        Get("/insights/news");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        await Send.OkAsync(await news.GetTopHeadlinesAsync(8, ct), ct);
    }
}
