namespace BaseKit.Modules.Users.Domain;

/// <summary>
/// Veritabanında saklanan yenileme (refresh) token'ı. Ham değer asla
/// saklanmaz; yalnızca SHA-256 özeti tutulur. Her kullanımda rotasyona
/// tabidir (eskisi iptal edilir, yenisi üretilir).
/// </summary>
public sealed class RefreshToken
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string TokenHash { get; set; } = default!;
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset ExpiresAtUtc { get; set; }
    public DateTimeOffset? RevokedAtUtc { get; set; }

    public bool IsActive => RevokedAtUtc is null && DateTimeOffset.UtcNow < ExpiresAtUtc;
}
