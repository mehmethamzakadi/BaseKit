using BaseKit.Modules.Catalog.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;

namespace BaseKit.Modules.Catalog.Endpoints;

public sealed record DeleteProductRequest(Guid Id);

/// <summary>
/// Ürünü mantıksal olarak siler (soft-delete: <c>IsDeleted = true</c>). Kayıt ve
/// görseli korunur; global sorgu filtresi ürünü listelerden gizler.
/// </summary>
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
        // Sorgu filtresi zaten silinmiş kayıtları dışladığından, tekrar silme
        // denemeleri 0 satır etkiler → NotFound.
        var updated = await db.Products
            .Where(x => x.Id == req.Id)
            .ExecuteUpdateAsync(
                s => s
                    .SetProperty(x => x.IsDeleted, true)
                    .SetProperty(x => x.DeletedAtUtc, DateTimeOffset.UtcNow),
                ct);

        if (updated == 0)
        {
            await Send.NotFoundAsync(ct);
            return;
        }

        await cache.RemoveAsync(CatalogCacheKeys.Product(req.Id), ct);

        await Send.NoContentAsync(ct);
    }
}
