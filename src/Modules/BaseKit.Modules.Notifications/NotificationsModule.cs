using BaseKit.Modules.Notifications.Persistence;
using BaseKit.Modules.Notifications.Realtime;
using BaseKit.Shared.Authorization;
using BaseKit.Shared.Modules;
using BaseKit.Shared.Notifications;
using BaseKit.Shared.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace BaseKit.Modules.Notifications;

/// <summary>
/// Bildirim modülü: kalıcı bildirimler + SignalR ile gerçek zamanlı iletim.
/// <see cref="INotificationPublisher"/> soyutlamasını uygular; böylece diğer
/// modüller bildirim üretebilir.
/// </summary>
public sealed class NotificationsModule : IModule
{
    public void RegisterServices(IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Postgres");
        services.AddModuleDbContext<NotificationsDbContext>(options =>
            options.UseNpgsql(connectionString, npgsql =>
                npgsql.MigrationsHistoryTable("__ef_migrations_history", NotificationsDbContext.Schema)));

        services.AddSignalR();
        services.AddScoped<INotificationPublisher, NotificationPublisher>();
        services.AddSingleton<IPermissionProvider, NotificationsPermissionProvider>();
    }
}
