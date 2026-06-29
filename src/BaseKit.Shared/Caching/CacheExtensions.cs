using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;

namespace BaseKit.Shared.Caching;

/// <summary>
/// IDistributedCache (Redis) üzerine basit "cache-aside" yardımcısı.
/// Değer cache'te varsa onu döner; yoksa factory'yi çalıştırıp sonucu
/// cache'e yazar.
/// </summary>
public static class CacheExtensions
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static async Task<T> GetOrSetAsync<T>(
        this IDistributedCache cache,
        string key,
        Func<Task<T>> factory,
        TimeSpan ttl,
        CancellationToken ct = default)
    {
        var cached = await cache.GetStringAsync(key, ct);
        if (cached is not null)
        {
            return JsonSerializer.Deserialize<T>(cached, JsonOptions)!;
        }

        var value = await factory();
        await cache.SetStringAsync(
            key,
            JsonSerializer.Serialize(value, JsonOptions),
            new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = ttl },
            ct);

        return value;
    }
}
