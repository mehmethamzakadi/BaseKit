using BaseKit.Modules.Users.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BaseKit.Modules.Users.Persistence;

public sealed class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("audit_logs");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.UserEmail).HasMaxLength(256);
        builder.Property(x => x.Action).HasMaxLength(100).IsRequired();
        builder.Property(x => x.EntityType).HasMaxLength(100);
        builder.Property(x => x.EntityId).HasMaxLength(100);
        builder.Property(x => x.Details).HasMaxLength(2000);
        builder.Property(x => x.IpAddress).HasMaxLength(64);
        builder.HasIndex(x => x.CreatedAtUtc);
    }
}
