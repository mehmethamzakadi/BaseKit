using System.Globalization;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using BaseKit.Modules.Insights.Configuration;
using BaseKit.Modules.Insights.Contracts;
using BaseKit.Shared.Caching;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Options;

namespace BaseKit.Modules.Insights.Providers;

/// <summary>OpenWeather'dan anlık hava durumunu çeker (Redis'te ~10 dk cache).</summary>
public sealed class WeatherClient(
    HttpClient http,
    IOptions<InsightsOptions> options,
    IDistributedCache cache)
{
    private readonly InsightsOptions _opt = options.Value;
    private static readonly TimeSpan Ttl = TimeSpan.FromMinutes(10);

    public async Task<WeatherResponse> GetAsync(double lat, double lon, CancellationToken ct)
    {
        // Konumu yuvarlayarak cache anahtarı üret (yakın koordinatlar aynı cache'i paylaşsın).
        // InvariantCulture şart: tr-TR kültüründe F2 virgül üretir, anahtarı bozar.
        var key = string.Format(
            CultureInfo.InvariantCulture, "insights:weather:{0:F2}:{1:F2}", lat, lon);
        return await cache.GetOrSetAsync(key, () => FetchAsync(lat, lon, ct), Ttl, ct);
    }

    private async Task<WeatherResponse> FetchAsync(double lat, double lon, CancellationToken ct)
    {
        // Koordinatları InvariantCulture ile (nokta ondalık) yaz. Aksi halde tr-TR
        // kültüründe virgül üretilir ve OpenWeather isteği 400 (Bad Request) döner.
        var latStr = lat.ToString(CultureInfo.InvariantCulture);
        var lonStr = lon.ToString(CultureInfo.InvariantCulture);
        var url = $"{_opt.OpenWeather.BaseUrl}/data/2.5/weather" +
                  $"?lat={latStr}&lon={lonStr}&units=metric&lang=tr&appid={_opt.OpenWeather.ApiKey}";

        var dto = await http.GetFromJsonAsync<OwmResponse>(url, ct)
                  ?? throw new InvalidOperationException("Hava durumu yanıtı boş.");

        var w = dto.Weather.FirstOrDefault();
        return new WeatherResponse(
            Location: dto.Name ?? "—",
            Temperature: Math.Round(dto.Main.Temp, 1),
            FeelsLike: Math.Round(dto.Main.FeelsLike, 1),
            Humidity: dto.Main.Humidity,
            WindSpeed: Math.Round(dto.Wind.Speed * 3.6, 1), // m/s -> km/h
            Description: w?.Description ?? "",
            Icon: w?.Icon ?? "01d",
            TempMin: Math.Round(dto.Main.TempMin, 1),
            TempMax: Math.Round(dto.Main.TempMax, 1));
    }

    // --- OpenWeather ham yanıt modelleri ---
    private sealed record OwmResponse(
        [property: JsonPropertyName("weather")] IReadOnlyList<OwmWeather> Weather,
        [property: JsonPropertyName("main")] OwmMain Main,
        [property: JsonPropertyName("wind")] OwmWind Wind,
        [property: JsonPropertyName("name")] string? Name);

    private sealed record OwmWeather(
        [property: JsonPropertyName("description")] string Description,
        [property: JsonPropertyName("icon")] string Icon);

    private sealed record OwmMain(
        [property: JsonPropertyName("temp")] double Temp,
        [property: JsonPropertyName("feels_like")] double FeelsLike,
        [property: JsonPropertyName("temp_min")] double TempMin,
        [property: JsonPropertyName("temp_max")] double TempMax,
        [property: JsonPropertyName("humidity")] int Humidity);

    private sealed record OwmWind(
        [property: JsonPropertyName("speed")] double Speed);
}
