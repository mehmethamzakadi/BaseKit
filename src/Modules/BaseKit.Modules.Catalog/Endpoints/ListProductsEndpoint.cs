using BaseKit.Modules.Catalog.Persistence;
using BaseKit.Shared.Pagination;
using BaseKit.Shared.Storage;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace BaseKit.Modules.Catalog.Endpoints;

/// <summary>
/// Ürün listesi sorgusu. <see cref="PagedQuery"/>'den sayfalama/arama/sıralama
/// alanlarını miras alır (query string'den bağlanır:
/// ?page=1&amp;pageSize=20&amp;search=...&amp;sort=name&amp;desc=true).
/// </summary>
public sealed class ListProductsRequest : PagedQuery;

/// <summary>
/// Ürünleri sayfalı, aranabilir ve sıralanabilir biçimde listeler. Sonuç sorguya
/// göre değiştiğinden cache'lenmez (tekil ürün getirme cache'lidir).
/// </summary>
public sealed class ListProductsEndpoint(CatalogDbContext db, IFileStorage storage)
    : Endpoint<ListProductsRequest, PagedResult<ProductResponse>>
{
    public override void Configure()
    {
        Get("/catalog/products");
        Permissions(CatalogPermissions.View);
    }

    public override async Task HandleAsync(ListProductsRequest req, CancellationToken ct)
    {
        var query = db.Products.AsNoTracking();

        // Arama: ad veya açıklama içinde (büyük/küçük harf duyarsız, PostgreSQL ILIKE).
        if (!string.IsNullOrWhiteSpace(req.Search))
        {
            var term = req.Search.Trim();
            query = query.Where(p =>
                EF.Functions.ILike(p.Name, $"%{term}%") ||
                (p.Description != null && EF.Functions.ILike(p.Description, $"%{term}%")));
        }

        // Sıralama: yalnızca izin verilen alanlar; bilinmeyen değer varsayılana düşer.
        query = req.Sort?.ToLowerInvariant() switch
        {
            "name" => req.Desc ? query.OrderByDescending(p => p.Name) : query.OrderBy(p => p.Name),
            "price" => req.Desc ? query.OrderByDescending(p => p.Price) : query.OrderBy(p => p.Price),
            "createdat" => req.Desc
                ? query.OrderByDescending(p => p.CreatedAtUtc)
                : query.OrderBy(p => p.CreatedAtUtc),
            _ => query.OrderByDescending(p => p.CreatedAtUtc),
        };

        var result = await query
            .Select(p => new ProductResponse(
                p.Id, p.Name, p.Description, p.Price, p.ImageObjectKey, null, p.CreatedAtUtc, p.UpdatedAtUtc))
            .ToPagedResultAsync(req, ct);

        // Sayfadaki görselli ürünler için geçici (presigned) URL üret.
        var items = new List<ProductResponse>(result.Items.Count);
        foreach (var item in result.Items)
        {
            items.Add(await item.WithImageUrlAsync(storage, ct));
        }

        await Send.OkAsync(result with { Items = items }, ct);
    }
}
