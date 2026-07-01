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

/// <summary>Tek bir RSS haber kaynağı (URL + gösterilecek kaynak adı).</summary>
public sealed record NewsFeed(string Url, string Source);

/// <summary>
/// Haber ayarları. Ücretli/gecikmeli News API yerine ücretsiz, anlık ve çok
/// kaynaklı <b>RSS</b> beslemeleri kullanılır (anahtar gerekmez). Türkiye + dünya
/// kaynakları karışık gelir; sonuç yayın tarihine göre sıralanır.
/// </summary>
public sealed class NewsOptions
{
    /// <summary>Toplam gösterilecek haber sayısı (kaynaklar birleştirilip sıralandıktan sonra).</summary>
    public int MaxItems { get; init; } = 12;

    /// <summary>Tek bir kaynağın listeyi domine etmemesi için kaynak başına en fazla haber.</summary>
    public int MaxPerSource { get; init; } = 12;

    /// <summary>Okunacak RSS kaynakları. appsettings ile geçersiz kılınabilir.</summary>
    public IReadOnlyList<NewsFeed> Feeds { get; init; } =
    [
        new("https://feeds.bbci.co.uk/turkce/rss.xml", "BBC Türkçe"),
    ];
}

public sealed class GeminiOptions
{
    public string ApiKey { get; init; } = string.Empty;
    public string BaseUrl { get; init; } = "https://generativelanguage.googleapis.com";
    public string Model { get; init; } = "gemini-flash-latest";
}
