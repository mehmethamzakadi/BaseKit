using BaseKit.Modules.Catalog.Domain;
using BaseKit.Modules.Catalog.Persistence;
using FastEndpoints;
using Microsoft.Extensions.Caching.Distributed;

namespace BaseKit.Modules.Catalog.Endpoints;

public sealed record CreateProductRequest(string Name, string? Description, decimal Price);

/// <summary>Ürün oluşturur. Kimlik doğrulaması gerektirir (yazma işlemi).</summary>
public sealed class CreateProductEndpoint(CatalogDbContext db, IDistributedCache cache)
    : Endpoint<CreateProductRequest, ProductResponse>
{
    public override void Configure()
    {
        Post("/catalog/products");
        Permissions(CatalogPermissions.ProductsCreate);
    }

    public override async Task HandleAsync(CreateProductRequest req, CancellationToken ct)
    {
        var now = DateTimeOffset.UtcNow;
        var product = new Product
        {
            Id = Guid.NewGuid(),
            Name = req.Name,
            Description = req.Description,
            Price = req.Price,
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
        };

        db.Products.Add(product);
        await db.SaveChangesAsync(ct);

        await cache.RemoveAsync(CatalogCacheKeys.AllProducts, ct);

        await Send.CreatedAtAsync<GetProductEndpoint>(
            new { id = product.Id }, ProductResponse.From(product), cancellation: ct);
    }
}
