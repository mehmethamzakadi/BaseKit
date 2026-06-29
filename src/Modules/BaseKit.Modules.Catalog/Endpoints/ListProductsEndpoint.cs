using BaseKit.Modules.Catalog.Persistence;
using BaseKit.Shared.Caching;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;

namespace BaseKit.Modules.Catalog.Endpoints;

/// <summary>Tüm ürünleri listeler. Anonim erişime açık ve cache'lenir.</summary>
public sealed class ListProductsEndpoint(CatalogDbContext db, IDistributedCache cache)
    : EndpointWithoutRequest<IReadOnlyList<ProductResponse>>
{
    public override void Configure()
    {
        Get("/catalog/products");
        Permissions(CatalogPermissions.View);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var products = await cache.GetOrSetAsync(
            CatalogCacheKeys.AllProducts,
            async () =>
            {
                var entities = await db.Products
                    .AsNoTracking()
                    .OrderByDescending(x => x.CreatedAtUtc)
                    .ToListAsync(ct);
                return (IReadOnlyList<ProductResponse>)entities
                    .Select(ProductResponse.From)
                    .ToList();
            },
            TimeSpan.FromMinutes(5),
            ct);

        await Send.OkAsync(products, ct);
    }
}
