using BaseKit.Modules.Notifications.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace BaseKit.Modules.Notifications.Endpoints;

public sealed record UnreadCountResponse(int Count);

/// <summary>Geçerli kullanıcının okunmamış bildirim sayısını döndürür (zil rozeti için).</summary>
public sealed class UnreadCountEndpoint(NotificationsDbContext db)
    : EndpointWithoutRequest<UnreadCountResponse>
{
    public override void Configure()
    {
        Get("/notifications/unread-count");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = NotificationsUser.GetUserId(User);
        if (userId is null) { await Send.UnauthorizedAsync(ct); return; }

        var count = await db.Notifications
            .CountAsync(n => n.UserId == userId.Value && !n.IsRead, ct);

        await Send.OkAsync(new UnreadCountResponse(count), ct);
    }
}
