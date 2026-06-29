using BaseKit.Modules.Catalog.Persistence;
using BaseKit.Shared.Storage;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;

namespace BaseKit.Modules.Catalog.Endpoints;

public sealed class UploadProductImageRequest
{
    public Guid Id { get; set; }
}

public sealed record UploadProductImageResponse(string ObjectKey, string Url);

/// <summary>
/// Ürün görselini MinIO'ya yükler, nesne anahtarını üründe saklar ve geçici
/// (presigned) erişim URL'i döner. Kimlik doğrulaması gerektirir.
/// </summary>
public sealed class UploadProductImageEndpoint(
    CatalogDbContext db, IFileStorage storage, IDistributedCache cache)
    : Endpoint<UploadProductImageRequest, UploadProductImageResponse>
{
    public override void Configure()
    {
        Post("/catalog/products/{id}/image");
        Permissions(CatalogPermissions.ProductsUpdate);
        AllowFileUploads();
    }

    public override async Task HandleAsync(UploadProductImageRequest req, CancellationToken ct)
    {
        var product = await db.Products.FirstOrDefaultAsync(x => x.Id == req.Id, ct);
        if (product is null)
        {
            await Send.NotFoundAsync(ct);
            return;
        }

        if (Files.Count == 0)
        {
            AddError("Yüklenecek dosya bulunamadı.");
            await Send.ErrorsAsync(400, ct);
            return;
        }

        var file = Files[0];
        var objectKey = $"products/{product.Id}/{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";

        await using (var stream = file.OpenReadStream())
        {
            await storage.UploadAsync(objectKey, stream, file.Length, file.ContentType, ct);
        }

        product.ImageObjectKey = objectKey;
        product.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);

        await cache.RemoveAsync(CatalogCacheKeys.AllProducts, ct);
        await cache.RemoveAsync(CatalogCacheKeys.Product(product.Id), ct);

        var url = await storage.GetPresignedUrlAsync(objectKey, ct: ct);
        await Send.OkAsync(new UploadProductImageResponse(objectKey, url), ct);
    }
}
