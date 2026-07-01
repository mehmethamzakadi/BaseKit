using BaseKit.Modules.Insights.Configuration;
using BaseKit.Modules.Insights.Contracts;
using BaseKit.Modules.Insights.Providers;
using FastEndpoints;
using Microsoft.Extensions.Options;

namespace BaseKit.Modules.Insights.Endpoints;

/// <summary>
/// Yapay zeka (Gemini) günlük brifing: hava + piyasa + haberleri tek doğal Türkçe
/// özete çevirir. Saatlik cache'lenir. Kimlik doğrulaması gerekir.
/// </summary>
public sealed class GetBriefingEndpoint(BriefingService briefing, IOptions<InsightsOptions> options)
    : Endpoint<WeatherRequest, BriefingResponse>
{
    private readonly InsightsOptions _opt = options.Value;

    public override void Configure()
    {
        Get("/insights/ai/briefing");
    }

    public override async Task HandleAsync(WeatherRequest req, CancellationToken ct)
    {
        var lat = req.Lat ?? _opt.DefaultLat;
        var lon = req.Lon ?? _opt.DefaultLon;
        await Send.OkAsync(await briefing.GetAsync(lat, lon, ct), ct);
    }
}
