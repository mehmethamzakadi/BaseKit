using System.Globalization;
using System.Text;
using BaseKit.Modules.Insights.Contracts;
using BaseKit.Shared.Caching;
using Microsoft.Extensions.Caching.Distributed;

namespace BaseKit.Modules.Insights.Providers;

/// <summary>
/// Hava durumu + piyasa + haberleri toplayıp Gemini ile tek bir doğal Türkçe
/// "günlük brifing" metnine dönüştürür. Kota dostu olması için sonuç saatlik +
/// konum bazlı cache'lenir.
/// </summary>
public sealed class BriefingService(
    WeatherClient weather,
    MarketsClient markets,
    NewsClient news,
    GeminiClient gemini,
    IDistributedCache cache)
{
    public async Task<BriefingResponse> GetAsync(double lat, double lon, CancellationToken ct)
    {
        // Saat + konum bazlı anahtar → aynı saatte tekrar Gemini çağrılmaz.
        var hourKey = DateTimeOffset.UtcNow.ToString("yyyyMMddHH", CultureInfo.InvariantCulture);
        var key = $"insights:briefing:{lat:F2}:{lon:F2}:{hourKey}";

        return await cache.GetOrSetAsync(key, () => BuildAsync(lat, lon, ct), TimeSpan.FromHours(1), ct);
    }

    private async Task<BriefingResponse> BuildAsync(double lat, double lon, CancellationToken ct)
    {
        // Bağımsız veri kaynakları; biri düşse de brifing üretilebilsin.
        var weatherTask = Safe(() => weather.GetAsync(lat, lon, ct));
        var marketsTask = Safe(() => markets.GetAsync(ct));
        var newsTask = Safe(() => news.GetTopHeadlinesAsync(5, ct));

        await Task.WhenAll(weatherTask, marketsTask, newsTask);

        var prompt = BuildPrompt(weatherTask.Result, marketsTask.Result, newsTask.Result);
        var text = await gemini.GenerateAsync(prompt, ct);
        return new BriefingResponse(text, DateTimeOffset.UtcNow);
    }

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
}
