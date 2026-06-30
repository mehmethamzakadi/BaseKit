using BaseKit.Modules.Catalog.Domain;
using BaseKit.Shared.Storage;

namespace BaseKit.Modules.Catalog.Endpoints;

public sealed record ProductResponse(
    Guid Id,
    string Name,
    string? Description,
    decimal Price,
    string? ImageObjectKey,
    /// <summary>Görseli göstermek için geçici (presigned) erişim URL'i; görsel yoksa null.</summary>
    string? ImageUrl,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc)
{
    public static ProductResponse From(Product p) =>
        new(p.Id, p.Name, p.Description, p.Price, p.ImageObjectKey, null, p.CreatedAtUtc, p.UpdatedAtUtc);
}

/// <summary>
/// <see cref="ProductResponse"/> için görsel zenginleştirme yardımcısı. Nesne
/// anahtarı varsa MinIO'dan geçici (presigned) bir URL üretip <c>ImageUrl</c>'i
/// doldurur. Presigned imza yerel olarak üretilir (ağ turu gerektirmez).
/// </summary>
internal static class ProductImageEnricher
{
    public static async Task<ProductResponse> WithImageUrlAsync(
        this ProductResponse response, IFileStorage storage, CancellationToken ct)
        => string.IsNullOrEmpty(response.ImageObjectKey)
            ? response
            : response with { ImageUrl = await storage.GetPresignedUrlAsync(response.ImageObjectKey, ct: ct) };
}

/// <summary>Cache anahtarları tek yerde toplanır.</summary>
public static class CatalogCacheKeys
{
    public static string Product(Guid id) => $"catalog:product:{id}";
}
