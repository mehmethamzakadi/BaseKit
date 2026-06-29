using Microsoft.AspNetCore.Identity;

namespace BaseKit.Modules.Users.Domain;

/// <summary>Uygulama kullanıcısı. Guid anahtar kullanır.</summary>
public sealed class AppUser : IdentityUser<Guid>
{
}
