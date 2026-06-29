namespace BaseKit.Modules.Users.Domain;

/// <summary>Bir role atanmış tekil yetki. Rol-yetki eşlemesi düzenlenebilir.</summary>
public sealed class RolePermission
{
    public Guid Id { get; set; }
    public Guid RoleId { get; set; }
    public string Permission { get; set; } = default!;
}
