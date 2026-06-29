using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BaseKit.Modules.System.Persistence;

public sealed class SystemSettingConfiguration : IEntityTypeConfiguration<SystemSetting>
{
    public void Configure(EntityTypeBuilder<SystemSetting> builder)
    {
        builder.ToTable("settings");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Key).HasMaxLength(200).IsRequired();
        builder.HasIndex(x => x.Key).IsUnique();
        builder.Property(x => x.Value).HasMaxLength(2000);
    }
}
