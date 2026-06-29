using BaseKit.Modules.Users.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BaseKit.Modules.Users.Persistence;

public sealed class RolePermissionConfiguration : IEntityTypeConfiguration<RolePermission>
{
    public void Configure(EntityTypeBuilder<RolePermission> builder)
    {
        builder.ToTable("role_permissions");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Permission).HasMaxLength(200).IsRequired();
        builder.HasIndex(x => new { x.RoleId, x.Permission }).IsUnique();

        // Rol silinince yetkileri de silinsin.
        builder.HasOne<AppRole>()
            .WithMany()
            .HasForeignKey(x => x.RoleId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
