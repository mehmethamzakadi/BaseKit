using BaseKit.Modules.System.Persistence;
using BaseKit.Shared.Modules;
using BaseKit.Shared.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace BaseKit.Modules.System;

/// <summary>
/// Çekirdek sistem modülü. Modül mekanizmasını, FastEndpoints endpoint
/// keşfini ve modüle özel EF Core DbContext desenini örnekler.
/// </summary>
public sealed class SystemModule : IModule
{
    public void RegisterServices(IServiceCollection services, IConfiguration configuration)
    {
        services.AddSingleton<ISystemClock, SystemClock>();

        var connectionString = configuration.GetConnectionString("Postgres");
        services.AddModuleDbContext<SystemDbContext>(options =>
            options.UseNpgsql(connectionString, npgsql =>
                npgsql.MigrationsHistoryTable("__ef_migrations_history", SystemDbContext.Schema)));
    }
}

/// <summary>Test edilebilirlik için soyutlanmış sistem saati.</summary>
public interface ISystemClock
{
    DateTimeOffset UtcNow { get; }
}

public sealed class SystemClock : ISystemClock
{
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
}
