using Microsoft.AspNetCore.Identity;

namespace BaseKit.Modules.Users.Domain;

/// <summary>Açıklama alanı eklenmiş uygulama rolü.</summary>
public sealed class AppRole : IdentityRole<Guid>
{
    public string? Description { get; set; }

    public AppRole() { }

    public AppRole(string name) : base(name) { }
}
