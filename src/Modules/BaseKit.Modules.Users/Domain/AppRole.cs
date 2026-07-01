using BaseKit.Shared.Persistence;
using Microsoft.AspNetCore.Identity;

namespace BaseKit.Modules.Users.Domain;

/// <summary>Açıklama alanı eklenmiş uygulama rolü.</summary>
public sealed class AppRole : IdentityRole<Guid>, ISoftDeletable
{
    public string? Description { get; set; }

    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAtUtc { get; set; }

    public AppRole() { }

    public AppRole(string name) : base(name) { }
}
