using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace BaseKit.Shared.Persistence;

public static class PersistenceExtensions
{
    /// <summary>
    /// Bir modül DbContext'ini kaydeder ve otomatik migration için kayıt
    /// defterine ekler. Modüller <c>AddDbContext</c> yerine bunu kullanır.
    /// </summary>
    public static IServiceCollection AddModuleDbContext<TContext>(
        this IServiceCollection services,
        Action<DbContextOptionsBuilder> optionsAction)
        where TContext : DbContext
    {
        services.AddDbContext<TContext>(optionsAction);
        GetOrCreateRegistry(services).Register<TContext>();
        return services;
    }

    /// <summary>
    /// Kayıtlı tüm modül DbContext'leri için bekleyen migration'ları uygular.
    /// Uygulama başlangıcında bir kez çağrılır.
    /// </summary>
    public static async Task MigrateModulesAsync(
        this IServiceProvider serviceProvider,
        CancellationToken cancellationToken = default)
    {
        using var scope = serviceProvider.CreateScope();
        var registry = scope.ServiceProvider.GetRequiredService<ModuleDbContextRegistry>();

        foreach (var contextType in registry.ContextTypes)
        {
            var context = (DbContext)scope.ServiceProvider.GetRequiredService(contextType);
            await context.Database.MigrateAsync(cancellationToken);
        }
    }

    private static ModuleDbContextRegistry GetOrCreateRegistry(IServiceCollection services)
    {
        var descriptor = services.FirstOrDefault(d => d.ServiceType == typeof(ModuleDbContextRegistry));
        if (descriptor?.ImplementationInstance is ModuleDbContextRegistry existing)
        {
            return existing;
        }

        var registry = new ModuleDbContextRegistry();
        services.AddSingleton(registry);
        return registry;
    }
}
