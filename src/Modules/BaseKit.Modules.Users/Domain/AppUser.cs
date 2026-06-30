using Microsoft.AspNetCore.Identity;

namespace BaseKit.Modules.Users.Domain;

/// <summary>Uygulama kullanıcısı. Guid anahtar kullanır.</summary>
public sealed class AppUser : IdentityUser<Guid>
{
    /// <summary>Arayüzde gösterilen ad (opsiyonel). Yoksa e-posta kullanılır.</summary>
    public string? DisplayName { get; set; }

    /// <summary>Profil fotoğrafının nesne deposu (MinIO) anahtarı; yoksa null.</summary>
    public string? AvatarObjectKey { get; set; }
}
