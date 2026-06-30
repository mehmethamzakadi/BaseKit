using BaseKit.Shared.Audit;
using BaseKit.Shared.Notifications;
using FastEndpoints;
using FluentValidation;

namespace BaseKit.Modules.Notifications.Endpoints;

/// <summary>Duyuru/bildirim gönderme isteği. <see cref="UserId"/> boşsa tüm kullanıcılara gider.</summary>
public sealed class BroadcastNotificationRequest
{
    public string Title { get; init; } = default!;
    public string Message { get; init; } = default!;
    /// <summary>info | success | warning | error (boşsa info).</summary>
    public string? Type { get; init; }
    /// <summary>İsteğe bağlı uygulama içi yönlendirme yolu.</summary>
    public string? Link { get; init; }
    /// <summary>Hedef kullanıcı; boş bırakılırsa tüm aktif kullanıcılara gönderilir.</summary>
    public Guid? UserId { get; init; }
}

public sealed class BroadcastNotificationValidator : Validator<BroadcastNotificationRequest>
{
    private static readonly string[] AllowedTypes =
        [NotificationTypes.Info, NotificationTypes.Success, NotificationTypes.Warning, NotificationTypes.Error];

    public BroadcastNotificationValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Message).NotEmpty().MaximumLength(2000);
        RuleFor(x => x.Link).MaximumLength(500);
        RuleFor(x => x.Type)
            .Must(t => string.IsNullOrEmpty(t) || AllowedTypes.Contains(t))
            .WithMessage("Geçersiz bildirim tipi.");
    }
}

/// <summary>
/// Yöneticinin tek bir kullanıcıya veya tüm kullanıcılara bildirim/duyuru
/// göndermesini sağlar. <see cref="INotificationPublisher"/> üzerinden kalıcılaştırır
/// ve SignalR ile canlı iletir.
/// </summary>
public sealed class BroadcastNotificationEndpoint(INotificationPublisher publisher, IAuditLogger audit)
    : Endpoint<BroadcastNotificationRequest>
{
    public override void Configure()
    {
        Post("/notifications/broadcast");
        Permissions(NotificationsPermissions.Send);
    }

    public override async Task HandleAsync(BroadcastNotificationRequest req, CancellationToken ct)
    {
        var type = string.IsNullOrWhiteSpace(req.Type) ? NotificationTypes.Info : req.Type!;

        if (req.UserId is { } userId)
        {
            await publisher.PublishAsync(userId, req.Title, req.Message, type, req.Link, ct);
            await audit.LogAsync("notification.send", "Notification", userId.ToString(), req.Title, ct);
        }
        else
        {
            await publisher.PublishToAllAsync(req.Title, req.Message, type, req.Link, ct);
            await audit.LogAsync("notification.broadcast", "Notification", details: req.Title, ct: ct);
        }

        await Send.NoContentAsync(ct);
    }
}
