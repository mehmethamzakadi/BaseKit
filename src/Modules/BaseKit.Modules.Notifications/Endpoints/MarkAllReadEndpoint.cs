using BaseKit.Modules.Notifications.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace BaseKit.Modules.Notifications.Endpoints;

/// <summary>Geçerli kullanıcının tüm okunmamış bildirimlerini okundu işaretler.</summary>
public sealed class MarkAllReadEndpoint(NotificationsDbContext db) : EndpointWithoutRequest
{
    public override void Configure()
    {
        Post("/notifications/read-all");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = NotificationsUser.GetUserId(User);
        if (userId is null) { await Send.UnauthorizedAsync(ct); return; }

        await db.Notifications
            .Where(n => n.UserId == userId.Value && !n.IsRead)
            .ExecuteUpdateAsync(
                s => s.SetProperty(n => n.IsRead, true)
                      .SetProperty(n => n.ReadAtUtc, DateTimeOffset.UtcNow),
                ct);

        await Send.NoContentAsync(ct);
    }
}
