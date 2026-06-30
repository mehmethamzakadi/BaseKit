using BaseKit.Modules.Notifications.Domain;
using BaseKit.Modules.Notifications.Endpoints;
using BaseKit.Modules.Notifications.Persistence;
using BaseKit.Shared.Identity;
using BaseKit.Shared.Notifications;
using Microsoft.AspNetCore.SignalR;

namespace BaseKit.Modules.Notifications.Realtime;

/// <summary>
/// <see cref="INotificationPublisher"/>'ın uygulaması: bildirimi kalıcılaştırır
/// ve ilgili kullanıcının SignalR grubuna canlı olarak ("ReceiveNotification")
/// push eder.
/// </summary>
public sealed class NotificationPublisher(
    NotificationsDbContext db,
    IHubContext<NotificationsHub> hub,
    IUserDirectory userDirectory) : INotificationPublisher
{
    public async Task PublishAsync(
        Guid userId,
        string title,
        string message,
        string type = NotificationTypes.Info,
        string? link = null,
        CancellationToken ct = default)
    {
        var notification = Create(userId, title, message, type, link, DateTimeOffset.UtcNow);
        db.Notifications.Add(notification);
        await db.SaveChangesAsync(ct);
        await PushAsync(notification, ct);
    }

    public async Task PublishToAllAsync(
        string title,
        string message,
        string type = NotificationTypes.Info,
        string? link = null,
        CancellationToken ct = default)
    {
        var userIds = await userDirectory.GetActiveUserIdsAsync(ct);
        if (userIds.Count == 0) return;

        var now = DateTimeOffset.UtcNow;
        var notifications = userIds
            .Select(uid => Create(uid, title, message, type, link, now))
            .ToList();

        db.Notifications.AddRange(notifications);
        await db.SaveChangesAsync(ct);

        foreach (var notification in notifications)
        {
            await PushAsync(notification, ct);
        }
    }

    private async Task PushAsync(Notification notification, CancellationToken ct) =>
        await hub.Clients
            .Group(NotificationsHub.GroupName(notification.UserId))
            .SendAsync("ReceiveNotification", NotificationResponse.From(notification), ct);

    private static Notification Create(
        Guid userId, string title, string message, string type, string? link, DateTimeOffset now) =>
        new()
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = title,
            Message = message,
            Type = string.IsNullOrWhiteSpace(type) ? NotificationTypes.Info : type,
            Link = link,
            IsRead = false,
            CreatedAtUtc = now,
        };
}
