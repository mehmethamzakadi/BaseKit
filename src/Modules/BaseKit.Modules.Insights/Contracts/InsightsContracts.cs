namespace BaseKit.Modules.Insights.Contracts;

/// <summary>Anlık hava durumu (client'a dönen sadeleştirilmiş görünüm).</summary>
public sealed record WeatherResponse(
    string Location,
    double Temperature,
    double FeelsLike,
    int Humidity,
    double WindSpeed,
    string Description,
    string Icon,
    double TempMin,
    double TempMax);

/// <summary>Tek bir piyasa kalemi (BTC, USD/TRY, EUR/TRY).</summary>
public sealed record MarketQuote(
    string Symbol,
    string Label,
    decimal Price,
    double? ChangePercent24h,
    IReadOnlyList<decimal>? Sparkline);

/// <summary>Birleşik piyasa görünümü.</summary>
public sealed record MarketsResponse(IReadOnlyList<MarketQuote> Quotes);

/// <summary>Tek bir haber öğesi.</summary>
public sealed record NewsArticle(
    string Title,
    string? Description,
    string Url,
    string? ImageUrl,
    string? Source,
    DateTimeOffset? PublishedAt);

/// <summary>Manşet listesi.</summary>
public sealed record NewsResponse(IReadOnlyList<NewsArticle> Articles);

/// <summary>Günlük brifing metni. <paramref name="Source"/> metnin kaynağını belirtir:
/// "ai" (Gemini üretti) veya "fallback" (kota/hata nedeniyle veriden üretilen özet).</summary>
public sealed record BriefingResponse(string Text, DateTimeOffset GeneratedAtUtc, string Source);
