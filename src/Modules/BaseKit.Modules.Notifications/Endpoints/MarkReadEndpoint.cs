using BaseKit.Modules.Notifications.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace BaseKit.Modules.Notifications.Endpoints;

/// <summary>
/// Tek bir bildirimi okundu işaretler (yalnızca sahibi yapabilir). Gövde
/// beklemez; bildirim kimliği rota parametresinden okunur.
/// </summary>
public sealed class MarkReadEndpoint(NotificationsDbContext db) : EndpointWithoutRequest
{
    public override void Configure()
    {
        Post("/notifications/{id}/read");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = NotificationsUser.GetUserId(User);
        if (userId is null) { await Send.UnauthorizedAsync(ct); return; }

        var id = Route<Guid>("id");

        var updated = await db.Notifications
            .Where(n => n.Id == id && n.UserId == userId.Value && !n.IsRead)
            .ExecuteUpdateAsync(
                s => s.SetProperty(n => n.IsRead, true)
                      .SetProperty(n => n.ReadAtUtc, DateTimeOffset.UtcNow),
                ct);

        // Bulunamasa bile (zaten okunmuş ya da yok) idempotent davran.
        if (updated == 0)
        {
            var exists = await db.Notifications
                .AnyAsync(n => n.Id == id && n.UserId == userId.Value, ct);
            if (!exists) { await Send.NotFoundAsync(ct); return; }
        }

        await Send.NoContentAsync(ct);
    }
}
