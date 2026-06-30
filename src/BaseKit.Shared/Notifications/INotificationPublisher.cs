namespace BaseKit.Shared.Notifications;

/// <summary>Bildirim önem seviyesi — istemcide ikon/renk eşlemesi için.</summary>
public static class NotificationTypes
{
    public const string Info = "info";
    public const string Success = "success";
    public const string Warning = "warning";
    public const string Error = "error";
}

/// <summary>
/// Bildirim üretimi için cross-cutting soyutlama. Herhangi bir modül bunu
/// enjekte ederek kullanıcıya bildirim gönderebilir; gerçek kalıcılaştırma ve
/// gerçek zamanlı (SignalR) iletim Notifications modülünde yapılır.
/// </summary>
public interface INotificationPublisher
{
    /// <summary>Tek bir kullanıcıya bildirim gönderir (kalıcı + canlı push).</summary>
    Task PublishAsync(
        Guid userId,
        string title,
        string message,
        string type = NotificationTypes.Info,
        string? link = null,
        CancellationToken ct = default);

    /// <summary>Tüm aktif kullanıcılara bildirim gönderir (duyuru).</summary>
    Task PublishToAllAsync(
        string title,
        string message,
        string type = NotificationTypes.Info,
        string? link = null,
        CancellationToken ct = default);
}
