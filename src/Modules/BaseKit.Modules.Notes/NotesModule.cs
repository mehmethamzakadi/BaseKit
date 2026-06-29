using BaseKit.Modules.Notes.Persistence;
using BaseKit.Shared.Authorization;
using BaseKit.Shared.Modules;
using BaseKit.Shared.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace BaseKit.Modules.Notes;

public sealed class NotesModule : IModule
{
    public void RegisterServices(IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Postgres");
        services.AddModuleDbContext<NotesDbContext>(options =>
            options.UseNpgsql(connectionString, npgsql =>
                npgsql.MigrationsHistoryTable("__ef_migrations_history", NotesDbContext.Schema)));

        services.AddSingleton<IPermissionProvider, NotesPermissionProvider>();
    }
}