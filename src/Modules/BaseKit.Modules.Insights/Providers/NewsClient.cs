using System.Net.Http.Json;
using System.Text.Json.Serialization;
using BaseKit.Modules.Insights.Configuration;
using BaseKit.Modules.Insights.Contracts;
using BaseKit.Shared.Caching;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Options;

namespace BaseKit.Modules.Insights.Providers;

/// <summary>News API'den Türkiye manşetlerini çeker (Redis'te ~15 dk cache).</summary>
public sealed class NewsClient(
    HttpClient http,
    IOptions<InsightsOptions> options,
    IDistributedCache cache)
{
    private readonly InsightsOptions _opt = options.Value;
    private static readonly TimeSpan Ttl = TimeSpan.FromMinutes(15);

    public async Task<NewsResponse> GetTopHeadlinesAsync(int pageSize, CancellationToken ct)
    {
        var key = $"insights:news:{_opt.News.Language}:{pageSize}";
        return await cache.GetOrSetAsync(key, () => FetchAsync(pageSize, ct), Ttl, ct);
    }

    private async Task<NewsResponse> FetchAsync(int pageSize, CancellationToken ct)
    {
        // Ücretsiz plan ülke manşeti (top-headlines?country=tr) döndürmediğinden
        // büyük Türk kaynaklarından en güncel haberler "everything" ile çekilir.
        var url = $"{_opt.News.BaseUrl}/v2/everything" +
                  $"?domains={_opt.News.Domains}&language={_opt.News.Language}" +
                  $"&sortBy=publishedAt&pageSize={pageSize}&apiKey={_opt.News.ApiKey}";

        var dto = await http.GetFromJsonAsync<NewsApiResponse>(url, ct)
                  ?? throw new InvalidOperationException("Haber yanıtı boş.");

        var articles = (dto.Articles ?? [])
            .Where(a => !string.IsNullOrWhiteSpace(a.Title) && a.Title != "[Removed]")
            .Select(a => new NewsArticle(
                a.Title!,
                a.Description,
                a.Url ?? "",
                a.UrlToImage,
                a.Source?.Name,
                a.PublishedAt))
            .ToList();

        return new NewsResponse(articles);
    }

    private sealed record NewsApiResponse(
        [property: JsonPropertyName("articles")] IReadOnlyList<NewsApiArticle>? Articles);

    private sealed record NewsApiArticle(
        [property: JsonPropertyName("title")] string? Title,
        [property: JsonPropertyName("description")] string? Description,
        [property: JsonPropertyName("url")] string? Url,
        [property: JsonPropertyName("urlToImage")] string? UrlToImage,
        [property: JsonPropertyName("publishedAt")] DateTimeOffset? PublishedAt,
        [property: JsonPropertyName("source")] NewsApiSource? Source);

    private sealed record NewsApiSource(
        [property: JsonPropertyName("name")] string? Name);
}
