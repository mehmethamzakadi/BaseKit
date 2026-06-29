using BaseKit.Modules.Catalog.Persistence;
using BaseKit.Shared.Authorization;
using BaseKit.Shared.Modules;
using BaseKit.Shared.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace BaseKit.Modules.Catalog;

/// <summary>
/// Örnek CRUD modülü — yeni modüller için şablon. REPR endpoint'leri,
/// Redis cache (cache-aside) ve MinIO dosya yükleme entegrasyonunu gösterir.
/// </summary>
public sealed class CatalogModule : IModule
{
    public void RegisterServices(IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Postgres");
        services.AddModuleDbContext<CatalogDbContext>(options =>
            options.UseNpgsql(connectionString, npgsql =>
                npgsql.MigrationsHistoryTable("__ef_migrations_history", CatalogDbContext.Schema)));

        services.AddSingleton<IPermissionProvider, CatalogPermissionProvider>();
    }
}
