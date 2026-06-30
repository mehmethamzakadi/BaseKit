using BaseKit.Modules.Catalog.Persistence;
using BaseKit.Shared.Storage;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;

namespace BaseKit.Modules.Catalog.Endpoints;

public sealed record DeleteProductRequest(Guid Id);

/// <summary>Ürünü siler ve varsa görselini nesne deposundan temizler.</summary>
public sealed class DeleteProductEndpoint(CatalogDbContext db, IDistributedCache cache, IFileStorage storage)
    : Endpoint<DeleteProductRequest>
{
    public override void Configure()
    {
        Delete("/catalog/products/{id}");
        Permissions(CatalogPermissions.ProductsDelete);
    }

    public override async Task HandleAsync(DeleteProductRequest req, CancellationToken ct)
    {
        // Görsel anahtarını silmeden önce al (orphan temizliği için).
        var imageKey = await db.Products
            .Where(x => x.Id == req.Id)
            .Select(x => x.ImageObjectKey)
            .FirstOrDefaultAsync(ct);

        var deleted = await db.Products
            .Where(x => x.Id == req.Id)
            .ExecuteDeleteAsync(ct);

        if (deleted == 0)
        {
            await Send.NotFoundAsync(ct);
            return;
        }

        if (!string.IsNullOrEmpty(imageKey))
        {
            await storage.DeleteAsync(imageKey, ct);
        }

        await cache.RemoveAsync(CatalogCacheKeys.Product(req.Id), ct);

        await Send.NoContentAsync(ct);
    }
}
