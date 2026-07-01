namespace BaseKit.Modules.Insights.Configuration;

/// <summary>
/// Dış entegrasyon (hava durumu, piyasa, haber, yapay zeka) yapılandırması.
/// API anahtarları gizlidir; yerelde <c>appsettings.Development.local.json</c>
/// (git'e gönderilmez), üretimde ortam değişkeni / secret store ile verilmelidir.
/// </summary>
public sealed class InsightsOptions
{
    public const string SectionName = "Insights";

    public OpenWeatherOptions OpenWeather { get; init; } = new();
    public CoinGeckoOptions CoinGecko { get; init; } = new();
    public ExchangeRateOptions ExchangeRate { get; init; } = new();
    public NewsOptions News { get; init; } = new();
    public GeminiOptions Gemini { get; init; } = new();

    /// <summary>Konum alınamazsa kullanılacak varsayılan koordinat (İstanbul).</summary>
    public double DefaultLat { get; init; } = 41.0082;
    public double DefaultLon { get; init; } = 28.9784;
}

public sealed class OpenWeatherOptions
{
    public string ApiKey { get; init; } = string.Empty;
    public string BaseUrl { get; init; } = "https://api.openweathermap.org";
}

public sealed class CoinGeckoOptions
{
    public string ApiKey { get; init; } = string.Empty;
    public string BaseUrl { get; init; } = "https://api.coingecko.com";
}

public sealed class ExchangeRateOptions
{
    public string ApiKey { get; init; } = string.Empty;
    public string BaseUrl { get; init; } = "https://v6.exchangerate-api.com";
}

public sealed class NewsOptions
{
    public string ApiKey { get; init; } = string.Empty;
    public string BaseUrl { get; init; } = "https://newsapi.org";
    /// <summary>Haber dili (ISO 639-1). Türkçe için "tr".</summary>
    public string Language { get; init; } = "tr";
    /// <summary>
    /// Manşetlerin çekileceği kaynak siteler. News API ücretsiz planı ülke bazlı
    /// (country=tr) manşet döndürmediğinden büyük Türk haber siteleri kullanılır.
    /// </summary>
    public string Domains { get; init; } =
        "hurriyet.com.tr,ntv.com.tr,sozcu.com.tr,cnnturk.com,haberturk.com,trthaber.com,milliyet.com.tr";
}

public sealed class GeminiOptions
{
    public string ApiKey { get; init; } = string.Empty;
    public string BaseUrl { get; init; } = "https://generativelanguage.googleapis.com";
    public string Model { get; init; } = "gemini-flash-latest";
}
