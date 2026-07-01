using BaseKit.Modules.Insights.Configuration;
using BaseKit.Modules.Insights.Providers;
using BaseKit.Shared.Modules;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace BaseKit.Modules.Insights;

/// <summary>
/// Dış entegrasyon modülü: hava durumu (OpenWeather), piyasa (CoinGecko +
/// ExchangeRate), haber (News API) ve yapay zeka brifing (Gemini). Veriyi
/// backend üzerinden proxy'ler (anahtarlar gizli kalır), Redis'te cache'ler
/// ve dashboard'a sunar. Kalıcı depo kullanmaz.
/// </summary>
public sealed class InsightsModule : IModule
{
    public void RegisterServices(IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<InsightsOptions>(configuration.GetSection(InsightsOptions.SectionName));

        // Her sağlayıcı için ayrı typed HttpClient (bağlantı havuzu + zaman aşımı).
        // User-Agent şart: News API gibi bazı servisler başlıksız isteği 400/426 ile reddeder.
        const string userAgent = "BaseKit/1.0";
        var timeout = TimeSpan.FromSeconds(10);

        void Configure(HttpClient c, TimeSpan t)
        {
            c.Timeout = t;
            c.DefaultRequestHeaders.UserAgent.ParseAdd(userAgent);
        }

        services.AddHttpClient<WeatherClient>(c => Configure(c, timeout));
        services.AddHttpClient<MarketsClient>(c => Configure(c, timeout));
        services.AddHttpClient<NewsClient>(c => Configure(c, timeout));
        // Gemini üretimi daha uzun sürebilir.
        services.AddHttpClient<GeminiClient>(c => Configure(c, TimeSpan.FromSeconds(60)));

        services.AddScoped<BriefingService>();
    }
}
