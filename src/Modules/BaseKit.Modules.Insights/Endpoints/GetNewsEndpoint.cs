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
        // 0 → yapılandırmadaki MaxItems (birden çok kaynaktan birleşik liste).
        await Send.OkAsync(await news.GetTopHeadlinesAsync(0, ct), ct);
    }
}
