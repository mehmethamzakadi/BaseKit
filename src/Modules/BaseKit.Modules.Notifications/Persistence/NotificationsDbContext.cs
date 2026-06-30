using BaseKit.Modules.Notifications.Domain;
using Microsoft.EntityFrameworkCore;

namespace BaseKit.Modules.Notifications.Persistence;

/// <summary>
/// Notifications modülünün DbContext'i. Kendi PostgreSQL şemasına ve migration
/// geçmişine sahiptir (modüler monolit izolasyonu).
/// </summary>
public sealed class NotificationsDbContext(DbContextOptions<NotificationsDbContext> options)
    : DbContext(options)
{
    public const string Schema = "notifications";

    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(NotificationsDbContext).Assembly);
    }
}
