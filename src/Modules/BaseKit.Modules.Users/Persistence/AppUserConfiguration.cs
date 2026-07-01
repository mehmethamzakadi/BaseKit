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

        // Identity'nin benzersiz kullanıcı adı indeksini, yalnızca silinmemiş
        // kayıtları kapsayacak biçimde filtreler. Böylece bir kullanıcı soft-delete
        // edildikten sonra aynı e-posta/kullanıcı adıyla yeni kayıt açılabilir.
        builder.HasIndex(x => x.NormalizedUserName)
            .HasDatabaseName("UserNameIndex")
            .IsUnique()
            .HasFilter("\"IsDeleted\" = false");
    }
}
