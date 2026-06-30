using BaseKit.Modules.Users.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BaseKit.Modules.Users.Persistence;

/// <summary>
/// <see cref="AppUser"/> için ek alanların eşlemesi. Identity'nin varsayılan
/// tablo yapısını korur; yalnızca profil alanlarına kısıt ekler.
/// </summary>
public sealed class AppUserConfiguration : IEntityTypeConfiguration<AppUser>
{
    public void Configure(EntityTypeBuilder<AppUser> builder)
    {
        builder.Property(x => x.DisplayName).HasMaxLength(100);
        builder.Property(x => x.AvatarObjectKey).HasMaxLength(512);
    }
}
