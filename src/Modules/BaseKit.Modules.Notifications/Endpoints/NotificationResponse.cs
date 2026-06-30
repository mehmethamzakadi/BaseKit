using BaseKit.Modules.Notifications.Domain;

namespace BaseKit.Modules.Notifications.Endpoints;

/// <summary>
/// Bildirimin istemciye dönen biçimi. Hem REST listesinde hem SignalR canlı
/// push'unda ("ReceiveNotification") aynı sözleşme kullanılır.
/// </summary>
public sealed record NotificationResponse(
    Guid Id,
    string Title,
    string Message,
    string Type,
    string? Link,
    bool IsRead,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset? ReadAtUtc)
{
    public static NotificationResponse From(Notification n) =>
        new(n.Id, n.Title, n.Message, n.Type, n.Link, n.IsRead, n.CreatedAtUtc, n.ReadAtUtc);
}
