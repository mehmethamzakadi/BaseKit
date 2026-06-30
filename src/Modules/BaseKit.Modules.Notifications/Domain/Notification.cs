namespace BaseKit.Modules.Notifications.Domain;

/// <summary>
/// Tek bir kullanıcıya ait bildirim. Okundu/okunmadı durumu ve isteğe bağlı
/// bir yönlendirme bağlantısı (link) taşır.
/// </summary>
public sealed class Notification
{
    public Guid Id { get; set; }

    /// <summary>Bildirimin sahibi (alıcı) kullanıcı.</summary>
    public Guid UserId { get; set; }

    public string Title { get; set; } = default!;
    public string Message { get; set; } = default!;

    /// <summary>Önem seviyesi: info | success | warning | error.</summary>
    public string Type { get; set; } = "info";

    /// <summary>İsteğe bağlı uygulama içi yönlendirme yolu (ör. "/dashboard/users").</summary>
    public string? Link { get; set; }

    public bool IsRead { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset? ReadAtUtc { get; set; }
}
