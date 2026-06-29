using BaseKit.Modules.Catalog.Endpoints;
using BaseKit.Modules.Catalog.Persistence;
using BaseKit.Shared.Caching;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;

namespace BaseKit.Modules.Catalog.Endpoints;

public sealed record GetProductRequest(Guid Id);

/// <summary>Tek ürünü getirir. Anonim erişime açık ve Redis ile cache'lenir.</summary>
public sealed class GetProductEndpoint(CatalogDbContext db, IDistributedCache cache)
    : Endpoint<GetProductRequest, ProductResponse>
{
    public override void Configure()
    {
        Get("/catalog/products/{id}");
        Permissions(CatalogPermissions.View);
    }

    public override async Task HandleAsync(GetProductRequest req, CancellationToken ct)
    {
        var product = await cache.GetOrSetAsync(
            CatalogCacheKeys.Product(req.Id),
            async () =>
            {
                var entity = await db.Products
                    .AsNoTracking()
                    .FirstOrDefaultAsync(x => x.Id == req.Id, ct);
                return entity is null ? null : ProductResponse.From(entity);
            },
            TimeSpan.FromMinutes(5),
            ct);

        if (product is null)
        {
            await Send.NotFoundAsync(ct);
            return;
        }

        await Send.OkAsync(product, ct);
    }
}
