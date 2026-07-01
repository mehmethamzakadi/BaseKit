using System.Net;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using BaseKit.Modules.Insights.Configuration;
using BaseKit.Modules.Insights.Contracts;
using BaseKit.Shared.Caching;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Options;

namespace BaseKit.Modules.Insights.Providers;

/// <summary>
/// Birden çok ücretsiz RSS beslemesinden (Türkiye + dünya) haber toplar, yayın
/// tarihine göre birleştirip sıralar (son dakika önce). Anahtar gerektirmez,
/// anlık günceldir. Sonuç Redis'te ~10 dk cache'lenir.
/// </summary>
public sealed partial class NewsClient(
    HttpClient http,
    IOptions<InsightsOptions> options,
    IDistributedCache cache)
{
    private static readonly XNamespace Media = "http://search.yahoo.com/mrss/";
    private static readonly TimeSpan Ttl = TimeSpan.FromMinutes(10);
    private readonly NewsOptions _opt = options.Value.News;

    public async Task<NewsResponse> GetTopHeadlinesAsync(int pageSize, CancellationToken ct)
    {
        var take = pageSize > 0 ? pageSize : _opt.MaxItems;
        return await cache.GetOrSetAsync(
            $"insights:news:rss:{take}", () => AggregateAsync(take, ct), Ttl, ct);
    }

    private async Task<NewsResponse> AggregateAsync(int take, CancellationToken ct)
    {
        // Tüm kaynakları paralel oku; biri hata verirse (SafeFetch) atlanır.
        var tasks = _opt.Feeds.Select(f => SafeFetchAsync(f, ct));
        var perFeed = await Task.WhenAll(tasks);

        // Her kaynaktan yalnızca en yeni MaxPerSource haberi al → tek kaynak listeyi
        // domine etmesin (çeşitlilik). Sonra hepsini tarihe göre karıştır (son dakika önce).
        var merged = perFeed
            .SelectMany(feed => feed
                .Where(a => !string.IsNullOrWhiteSpace(a.Title) && !string.IsNullOrWhiteSpace(a.Url))
                .OrderByDescending(a => a.PublishedAt ?? DateTimeOffset.MinValue)
                .Take(_opt.MaxPerSource))
            .GroupBy(a => a.Url)                    // aynı haber birden çok kaynakta olabilir
            .Select(g => g.First())
            .OrderByDescending(a => a.PublishedAt ?? DateTimeOffset.MinValue)
            .Take(take)
            .ToList();

        return new NewsResponse(merged);
    }

    private async Task<IReadOnlyList<NewsArticle>> SafeFetchAsync(NewsFeed feed, CancellationToken ct)
    {
        try
        {
            var xml = await http.GetStringAsync(feed.Url, ct);
            var doc = XDocument.Parse(xml);
            return doc.Descendants("item").Select(item => Parse(item, feed.Source)).ToList();
        }
        catch
        {
            return [];
        }
    }

    private static NewsArticle Parse(XElement item, string source)
    {
        var title = Clean(item.Element("title")?.Value);
        var link = item.Element("link")?.Value?.Trim() ?? "";
        var description = StripHtml(item.Element("description")?.Value);
        DateTimeOffset? published =
            DateTimeOffset.TryParse(item.Element("pubDate")?.Value, out var dt) ? dt : null;

        // Bazı kaynaklar (ör. CNN Türk) yerel saati yanlışlıkla GMT olarak etiketler →
        // tarih geleceğe düşer ("3 saat sonra"). Gelecekteki tarihleri şimdiye sabitle.
        var now = DateTimeOffset.UtcNow;
        if (published > now) published = now;

        return new NewsArticle(title, description, link, ExtractImage(item), source, published);
    }

    /// <summary>Görseli sırayla dener: enclosure → media:content/thumbnail → &lt;image&gt; → açıklamadaki ilk img.</summary>
    private static string? ExtractImage(XElement item)
    {
        var enclosure = item.Elements("enclosure")
            .FirstOrDefault(e => (e.Attribute("type")?.Value ?? "").StartsWith("image", StringComparison.OrdinalIgnoreCase))
            ?.Attribute("url")?.Value
            ?? item.Element("enclosure")?.Attribute("url")?.Value;
        if (!string.IsNullOrEmpty(enclosure)) return enclosure;

        var media = item.Element(Media + "content")?.Attribute("url")?.Value
                    ?? item.Element(Media + "thumbnail")?.Attribute("url")?.Value;
        if (!string.IsNullOrEmpty(media)) return media;

        var image = item.Element("image")?.Value?.Trim();       // AA özel <image> etiketi
        if (!string.IsNullOrEmpty(image)) return image;

        var raw = item.Element("description")?.Value ?? item.Element("content")?.Value ?? "";
        var m = ImgSrcRegex().Match(raw);
        return m.Success ? m.Groups[1].Value : null;
    }

    /// <summary>HTML etiketlerini temizler, entity'leri çözer, kısaltır.</summary>
    private static string? StripHtml(string? html)
    {
        if (string.IsNullOrWhiteSpace(html)) return null;
        var text = WebUtility.HtmlDecode(TagRegex().Replace(html, " ")).Trim();
        text = WhitespaceRegex().Replace(text, " ");
        return text.Length > 300 ? text[..300].TrimEnd() + "…" : text;
    }

    private static string Clean(string? s) => WebUtility.HtmlDecode(s ?? "").Trim();

    [GeneratedRegex("<img[^>]+src=[\"']([^\"']+)[\"']", RegexOptions.IgnoreCase)]
    private static partial Regex ImgSrcRegex();

    [GeneratedRegex("<[^>]+>")]
    private static partial Regex TagRegex();

    [GeneratedRegex(@"\s+")]
    private static partial Regex WhitespaceRegex();
}
