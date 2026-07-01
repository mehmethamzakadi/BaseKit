using BaseKit.Modules.Notifications.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace BaseKit.Modules.Notifications.Endpoints;

public sealed record DeleteNotificationRequest(Guid Id);

/// <summary>Geçerli kullanıcının tek bir bildirimini siler.</summary>
public sealed class DeleteNotificationEndpoint(NotificationsDbContext db)
    : Endpoint<DeleteNotificationRequest>
{
    public override void Configure()
    {
        Delete("/notifications/{id}");
    }

    public override async Task HandleAsync(DeleteNotificationRequest req, CancellationToken ct)
    {
        var userId = NotificationsUser.GetUserId(User);
        if (userId is null) { await Send.UnauthorizedAsync(ct); return; }

        var deleted = await db.Notifications
            .Where(n => n.Id == req.Id && n.UserId == userId.Value)
            .ExecuteUpdateAsync(
                s => s
                    .SetProperty(n => n.IsDeleted, true)
                    .SetProperty(n => n.DeletedAtUtc, DateTimeOffset.UtcNow),
                ct);

        if (deleted == 0) { await Send.NotFoundAsync(ct); return; }
        await Send.NoContentAsync(ct);
    }
}
