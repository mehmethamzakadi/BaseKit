using BaseKit.Modules.Insights.Configuration;
using BaseKit.Modules.Insights.Contracts;
using BaseKit.Modules.Insights.Providers;
using FastEndpoints;
using Microsoft.Extensions.Options;

namespace BaseKit.Modules.Insights.Endpoints;

/// <summary>Koordinat (opsiyonel; yoksa varsayılan konum kullanılır).</summary>
public sealed class WeatherRequest
{
    public double? Lat { get; init; }
    public double? Lon { get; init; }
}

/// <summary>Anlık hava durumunu döner. Kimlik doğrulaması gerekir.</summary>
public sealed class GetWeatherEndpoint(WeatherClient weather, IOptions<InsightsOptions> options)
    : Endpoint<WeatherRequest, WeatherResponse>
{
    private readonly InsightsOptions _opt = options.Value;

    public override void Configure()
    {
        Get("/insights/weather");
    }

    public override async Task HandleAsync(WeatherRequest req, CancellationToken ct)
    {
        var lat = req.Lat ?? _opt.DefaultLat;
        var lon = req.Lon ?? _opt.DefaultLon;
        await Send.OkAsync(await weather.GetAsync(lat, lon, ct), ct);
    }
}
