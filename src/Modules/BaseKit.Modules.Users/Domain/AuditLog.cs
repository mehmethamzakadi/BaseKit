namespace BaseKit.Modules.Users.Domain;

/// <summary>
/// Tek bir denetim kaydı. Kim (<see cref="UserId"/>/<see cref="UserEmail"/>),
/// ne (<see cref="Action"/> + hedef), ne zaman ve nereden (IP) bilgisini tutar.
/// </summary>
public sealed class AuditLog
{
    public Guid Id { get; set; }
    public Guid? UserId { get; set; }
    public string? UserEmail { get; set; }
    public string Action { get; set; } = default!;
    public string? EntityType { get; set; }
    public string? EntityId { get; set; }
    public string? Details { get; set; }
    public string? IpAddress { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
}
