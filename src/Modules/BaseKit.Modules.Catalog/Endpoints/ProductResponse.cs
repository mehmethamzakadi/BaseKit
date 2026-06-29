using BaseKit.Modules.Catalog.Domain;

namespace BaseKit.Modules.Catalog.Endpoints;

public sealed record ProductResponse(
    Guid Id,
    string Name,
    string? Description,
    decimal Price,
    string? ImageObjectKey,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc)
{
    public static ProductResponse From(Product p) =>
        new(p.Id, p.Name, p.Description, p.Price, p.ImageObjectKey, p.CreatedAtUtc, p.UpdatedAtUtc);
}

/// <summary>Cache anahtarları tek yerde toplanır.</summary>
public static class CatalogCacheKeys
{
    public const string AllProducts = "catalog:products:all";
    public static string Product(Guid id) => $"catalog:product:{id}";
}
