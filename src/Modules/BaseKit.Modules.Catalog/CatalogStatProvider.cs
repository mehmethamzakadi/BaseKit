using BaseKit.Modules.Catalog.Persistence;
using BaseKit.Shared.Dashboard;
using Microsoft.EntityFrameworkCore;

namespace BaseKit.Modules.Catalog;

/// <summary>Katalog modülünün dashboard istatistikleri (ürün sayısı).</summary>
public sealed class CatalogStatProvider(CatalogDbContext db) : IDashboardStatProvider
{
    public async Task<IReadOnlyList<DashboardStat>> GetStatsAsync(CancellationToken ct = default)
    {
        var productCount = await db.Products.CountAsync(ct);
        return [new DashboardStat("catalog.products", "Ürün", productCount, "package")];
    }
}
