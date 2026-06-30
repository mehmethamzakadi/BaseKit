using BaseKit.Modules.Notifications.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BaseKit.Modules.Notifications.Persistence;

public sealed class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("notifications");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Title).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Message).HasMaxLength(2000).IsRequired();
        builder.Property(x => x.Type).HasMaxLength(20).IsRequired();
        builder.Property(x => x.Link).HasMaxLength(500);

        // Kullanıcının bildirimlerini en yeniden listelemek için bileşik indeks.
        builder.HasIndex(x => new { x.UserId, x.CreatedAtUtc });
        // Okunmamış sayımı için.
        builder.HasIndex(x => new { x.UserId, x.IsRead });
    }
}
