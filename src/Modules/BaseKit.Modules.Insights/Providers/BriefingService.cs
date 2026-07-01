using System.Globalization;
using System.Text;
using System.Text.Json;
using BaseKit.Modules.Insights.Contracts;
using Microsoft.Extensions.Caching.Distributed;

namespace BaseKit.Modules.Insights.Providers;

/// <summary>
/// Hava durumu + piyasa + haberleri toplayıp Gemini ile tek bir doğal Türkçe
/// "günlük brifing" metnine dönüştürür.
/// <para>
/// Dayanıklılık: (1) Sonuç saatlik + konum bazlı cache'lenir. (2) Eşzamanlı
/// istekler tek-uçuş (single-flight) kilidiyle serileştirilir → aynı anda birden
/// çok Gemini çağrısı ("cache stampede") ve gereksiz 429 önlenir. (3) Gemini
/// başarısız olursa (ör. kota/429) hata fırlatmak yerine veriden üretilen AI-dışı
/// bir özet döner ve kısa süre (10 dk) cache'lenir; böylece kullanıcı her zaman bir
/// brifing görür ve limit kısa sürede yeniden denenir.
/// </para>
/// </summary>
public sealed class BriefingService(
    WeatherClient weather,
    MarketsClient markets,
    NewsClient news,
    GeminiClient gemini,
    IDistributedCache cache)
{
    private static readonly SemaphoreSlim Gate = new(1, 1);
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    private static readonly CultureInfo Tr = new("tr-TR");
    private static readonly TimeSpan AiTtl = TimeSpan.FromHours(1);
    private static readonly TimeSpan FallbackTtl = TimeSpan.FromMinutes(10);

    public async Task<BriefingResponse> GetAsync(double lat, double lon, CancellationToken ct)
    {
        var hourKey = DateTimeOffset.UtcNow.ToString("yyyyMMddHH", CultureInfo.InvariantCulture);
        var key = string.Format(CultureInfo.InvariantCulture,
            "insights:briefing:{0:F2}:{1:F2}:{2}", lat, lon, hourKey);

        // 1) Hızlı yol: cache'te varsa kilide hiç girme.
        if (await ReadCacheAsync(key, ct) is { } cached) return cached;

        // 2) Tek-uçuş: yalnızca bir istek üretim yapsın; diğerleri beklesin ve cache'ten alsın.
        await Gate.WaitAsync(ct);
        try
        {
            if (await ReadCacheAsync(key, ct) is { } afterWait) return afterWait;

            // Bağımsız veri kaynakları; biri düşse de brifing üretilebilsin.
            var w = await Safe(() => weather.GetAsync(lat, lon, ct));
            var m = await Safe(() => markets.GetAsync(ct));
            var n = await Safe(() => news.GetTopHeadlinesAsync(5, ct));

            try
            {
                var text = await gemini.GenerateAsync(BuildPrompt(w, m, n), ct);
                var resp = new BriefingResponse(text, DateTimeOffset.UtcNow, "ai");
                await WriteCacheAsync(key, resp, AiTtl, ct);
                return resp;
            }
            catch
            {
                // Gemini kullanılamıyor (kota/429/ağ) → veriden düz özet üret, kısa cache'le.
                var resp = new BriefingResponse(BuildFallback(w, m, n), DateTimeOffset.UtcNow, "fallback");
                await WriteCacheAsync(key, resp, FallbackTtl, ct);
                return resp;
            }
        }
        finally
        {
            Gate.Release();
        }
    }

    private async Task<BriefingResponse?> ReadCacheAsync(string key, CancellationToken ct)
    {
        var raw = await cache.GetStringAsync(key, ct);
        return raw is null ? null : JsonSerializer.Deserialize<BriefingResponse>(raw, Json);
    }

    private async Task WriteCacheAsync(string key, BriefingResponse value, TimeSpan ttl, CancellationToken ct)
        => await cache.SetStringAsync(
            key,
            JsonSerializer.Serialize(value, Json),
            new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = ttl },
            ct);

    private static async Task<T?> Safe<T>(Func<Task<T>> factory) where T : class
    {
        try { return await factory(); }
        catch { return null; }
    }

    private static string BuildPrompt(WeatherResponse? w, MarketsResponse? m, NewsResponse? n)
    {
        var sb = new StringBuilder();
        sb.AppendLine(
            "Sen bir yönetim panelinin asistanısın. Aşağıdaki güncel verilere dayanarak " +
            "kullanıcıya günaydın niteliğinde, samimi ve akıcı TÜRKÇE bir günlük özet yaz. " +
            "2-3 kısa cümle olsun, madde işareti veya başlık kullanma, doğal bir paragraf yaz. " +
            "Rakamları abartma, sadece verilenleri kullan.");
        sb.AppendLine();

        if (w is not null)
            sb.AppendLine(CultureInfo.InvariantCulture,
                $"Hava durumu: {w.Location}, {w.Temperature}°C ({w.Description}), hissedilen {w.FeelsLike}°C.");

        if (m is not null)
        {
            foreach (var q in m.Quotes)
            {
                var chg = q.ChangePercent24h is { } c
                    ? $" (%{c.ToString("0.0", CultureInfo.InvariantCulture)} 24s)"
                    : "";
                sb.AppendLine(CultureInfo.InvariantCulture,
                    $"{q.Label}: {q.Price.ToString("N2", CultureInfo.InvariantCulture)}{chg}.");
            }
        }

        if (n is { Articles.Count: > 0 })
        {
            sb.AppendLine("Gündemdeki başlıklar:");
            foreach (var a in n.Articles.Take(4))
                sb.AppendLine(CultureInfo.InvariantCulture, $"- {a.Title}");
        }

        return sb.ToString();
    }

    /// <summary>Gemini kullanılamıyorken veriden üretilen AI-dışı düz Türkçe özet.</summary>
    private static string BuildFallback(WeatherResponse? w, MarketsResponse? m, NewsResponse? n)
    {
        var parts = new List<string>();

        if (w is not null)
            parts.Add($"{w.Location}'da hava {Math.Round(w.Temperature)}°C ({w.Description})");

        if (m is not null && m.Quotes.Count > 0)
        {
            var quotes = string.Join(", ", m.Quotes.Select(q =>
                $"{q.Label} {q.Price.ToString("N2", Tr)}"));
            parts.Add($"piyasada {quotes}");
        }

        var summary = parts.Count > 0
            ? "Günaydın! " + char.ToUpper(parts[0][0], Tr) + parts[0][1..] +
              (parts.Count > 1 ? "; " + string.Join("; ", parts.Skip(1)) : "") + "."
            : "Günaydın! Güncel verilere göz atabilirsiniz.";

        if (n is { Articles.Count: > 0 })
            summary += $" Gündemde öne çıkan başlık: \"{n.Articles[0].Title}\".";

        return summary;
    }
}
