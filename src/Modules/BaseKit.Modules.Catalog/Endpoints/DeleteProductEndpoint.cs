using BaseKit.Modules.Catalog.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;

namespace BaseKit.Modules.Catalog.Endpoints;

public sealed record DeleteProductRequest(Guid Id);

/// <summary>Ürünü siler. Kimlik doğrulaması gerektirir.</summary>
public sealed class DeleteProductEndpoint(CatalogDbContext db, IDistributedCache cache)
    : Endpoint<DeleteProductRequest>
{
    public override void Configure()
    {
        Delete("/catalog/products/{id}");
        Permissions(CatalogPermissions.ProductsDelete);
    }

    public override async Task HandleAsync(DeleteProductRequest req, CancellationToken ct)
    {
        var deleted = await db.Products
            .Where(x => x.Id == req.Id)
            .ExecuteDeleteAsync(ct);

        if (deleted == 0)
        {
            await Send.NotFoundAsync(ct);
            return;
        }

        await cache.RemoveAsync(CatalogCacheKeys.AllProducts, ct);
        await cache.RemoveAsync(CatalogCacheKeys.Product(req.Id), ct);

        await Send.NoContentAsync(ct);
    }
}
