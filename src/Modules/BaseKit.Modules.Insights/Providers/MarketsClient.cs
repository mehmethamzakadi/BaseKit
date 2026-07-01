using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using BaseKit.Modules.Insights.Configuration;
using BaseKit.Modules.Insights.Contracts;
using BaseKit.Shared.Caching;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Options;

namespace BaseKit.Modules.Insights.Providers;

/// <summary>
/// Bitcoin (CoinGecko) ve döviz kurlarını (ExchangeRate-API) çeker. Ücretsiz kota
/// dostu olması için her kaynak farklı TTL ile cache'lenir: BTC fiyatı 5 dk,
/// sparkline 30 dk, döviz kurları 6 saat.
/// </summary>
public sealed class MarketsClient(
    HttpClient http,
    IOptions<InsightsOptions> options,
    IDistributedCache cache)
{
    private readonly InsightsOptions _opt = options.Value;

    public async Task<MarketsResponse> GetAsync(CancellationToken ct)
    {
        // Bağımsız kaynaklar; biri hata verirse diğerleri yine dönebilsin diye
        // her biri ayrı try içinde toplanır.
        var quotes = new List<MarketQuote>();

        var btc = await SafeAsync(() => GetBitcoinAsync(ct));
        if (btc is not null) quotes.Add(btc);

        var rates = await SafeAsync(() => GetRatesAsync(ct));
        if (rates is not null)
        {
            quotes.Add(new MarketQuote("USDTRY", "Dolar/TL", rates.UsdTry, null, null));
            quotes.Add(new MarketQuote("EURTRY", "Euro/TL", rates.EurTry, null, null));
        }

        return new MarketsResponse(quotes);
    }

    private static async Task<T?> SafeAsync<T>(Func<Task<T>> factory) where T : class
    {
        try { return await factory(); }
        catch { return null; }
    }

    // --- Bitcoin: fiyat + %24s (5 dk) + sparkline (30 dk) ---
    private async Task<MarketQuote> GetBitcoinAsync(CancellationToken ct)
    {
        var price = await cache.GetOrSetAsync(
            "insights:btc:price",
            () => FetchBtcPriceAsync(ct),
            TimeSpan.FromMinutes(5), ct);

        var sparkline = await cache.GetOrSetAsync(
            "insights:btc:sparkline",
            () => FetchBtcSparklineAsync(ct),
            TimeSpan.FromMinutes(30), ct);

        return new MarketQuote("BTCTRY", "Bitcoin", price.Price, price.Change, sparkline);
    }

    private async Task<BtcPrice> FetchBtcPriceAsync(CancellationToken ct)
    {
        var url = $"{_opt.CoinGecko.BaseUrl}/api/v3/simple/price" +
                  "?ids=bitcoin&vs_currencies=try&include_24hr_change=true";
        using var req = new HttpRequestMessage(HttpMethod.Get, url);
        AddCoinGeckoKey(req);

        using var res = await http.SendAsync(req, ct);
        res.EnsureSuccessStatusCode();
        var json = await res.Content.ReadFromJsonAsync<JsonElement>(ct);

        var btc = json.GetProperty("bitcoin");
        var price = btc.GetProperty("try").GetDecimal();
        var change = btc.TryGetProperty("try_24h_change", out var c) ? c.GetDouble() : 0d;
        return new BtcPrice(Math.Round(price, 0), Math.Round(change, 2));
    }

    private async Task<IReadOnlyList<decimal>> FetchBtcSparklineAsync(CancellationToken ct)
    {
        var url = $"{_opt.CoinGecko.BaseUrl}/api/v3/coins/bitcoin/market_chart" +
                  "?vs_currency=try&days=1";
        using var req = new HttpRequestMessage(HttpMethod.Get, url);
        AddCoinGeckoKey(req);

        using var res = await http.SendAsync(req, ct);
        res.EnsureSuccessStatusCode();
        var chart = await res.Content.ReadFromJsonAsync<MarketChart>(ct);

        var prices = chart?.Prices ?? [];
        // ~24 noktaya indir (grafik için yeterli).
        if (prices.Count <= 24)
            return prices.Select(p => Math.Round(p[1], 0)).ToList();

        var step = prices.Count / 24;
        return prices.Where((_, i) => i % step == 0)
            .Select(p => Math.Round(p[1], 0))
            .ToList();
    }

    // --- Döviz: USD/TRY, EUR/TRY (6 saat) ---
    private async Task<TryRates> GetRatesAsync(CancellationToken ct)
        => await cache.GetOrSetAsync(
            "insights:rates:try",
            () => FetchRatesAsync(ct),
            TimeSpan.FromHours(6), ct);

    private async Task<TryRates> FetchRatesAsync(CancellationToken ct)
    {
        var url = $"{_opt.ExchangeRate.BaseUrl}/v6/{_opt.ExchangeRate.ApiKey}/latest/USD";
        var dto = await http.GetFromJsonAsync<ExchangeRateResponse>(url, ct)
                  ?? throw new InvalidOperationException("Kur yanıtı boş.");

        var usdTry = dto.ConversionRates["TRY"];
        var usdEur = dto.ConversionRates["EUR"];
        var eurTry = usdEur == 0 ? 0 : usdTry / usdEur;
        return new TryRates(Math.Round(usdTry, 2), Math.Round(eurTry, 2));
    }

    private void AddCoinGeckoKey(HttpRequestMessage req)
    {
        if (!string.IsNullOrEmpty(_opt.CoinGecko.ApiKey))
            req.Headers.TryAddWithoutValidation("x-cg-demo-api-key", _opt.CoinGecko.ApiKey);
    }

    // Cache'lenen değerler record (property) olmalı; ValueTuple System.Text.Json
    // ile serialize edilmez (alan olduğundan "{}" olarak yazılıp 0 dönerdi).
    private sealed record BtcPrice(decimal Price, double Change);

    private sealed record TryRates(decimal UsdTry, decimal EurTry);

    private sealed record MarketChart(
        [property: JsonPropertyName("prices")] IReadOnlyList<decimal[]> Prices);

    private sealed record ExchangeRateResponse(
        [property: JsonPropertyName("conversion_rates")] Dictionary<string, decimal> ConversionRates);
}
