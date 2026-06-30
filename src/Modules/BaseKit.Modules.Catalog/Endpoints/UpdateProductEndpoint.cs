using BaseKit.Modules.Catalog.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;

namespace BaseKit.Modules.Catalog.Endpoints;

public sealed record UpdateProductRequest(Guid Id, string Name, string? Description, decimal Price);

/// <summary>Ürünü günceller. Kimlik doğrulaması gerektirir.</summary>
public sealed class UpdateProductEndpoint(CatalogDbContext db, IDistributedCache cache)
    : Endpoint<UpdateProductRequest, ProductResponse>
{
    public override void Configure()
    {
        Put("/catalog/products/{id}");
        Permissions(CatalogPermissions.ProductsUpdate);
    }

    public override async Task HandleAsync(UpdateProductRequest req, CancellationToken ct)
    {
        var product = await db.Products.FirstOrDefaultAsync(x => x.Id == req.Id, ct);
        if (product is null)
        {
            await Send.NotFoundAsync(ct);
            return;
        }

        product.Name = req.Name;
        product.Description = req.Description;
        product.Price = req.Price;
        product.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);

        await cache.RemoveAsync(CatalogCacheKeys.Product(req.Id), ct);

        await Send.OkAsync(ProductResponse.From(product), ct);
    }
}
