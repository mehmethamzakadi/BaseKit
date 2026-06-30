using BaseKit.Modules.Catalog.Endpoints;
using BaseKit.Modules.Catalog.Persistence;
using BaseKit.Shared.Caching;
using BaseKit.Shared.Storage;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;

namespace BaseKit.Modules.Catalog.Endpoints;

public sealed record GetProductRequest(Guid Id);

/// <summary>Tek ürünü getirir. Redis ile cache'lenir; görsel URL'i cache dışında üretilir.</summary>
public sealed class GetProductEndpoint(CatalogDbContext db, IDistributedCache cache, IFileStorage storage)
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

        // Presigned URL cache dışında üretilir: cache'lenen veri nesne anahtarını
        // tutar, kısa ömürlü imzalı URL her istekte yeniden oluşturulur.
        await Send.OkAsync(await product.WithImageUrlAsync(storage, ct), ct);
    }
}
