using BaseKit.Modules.Notifications.Persistence;
using BaseKit.Shared.Pagination;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace BaseKit.Modules.Notifications.Endpoints;

/// <summary>Bildirim listesi sorgusu (sayfalama + yalnızca okunmamış filtresi).</summary>
public sealed class ListNotificationsRequest : PagedQuery
{
    /// <summary>true ise yalnızca okunmamış bildirimler döner (?unreadOnly=true).</summary>
    public bool UnreadOnly { get; init; }
}

/// <summary>
/// Geçerli kullanıcının bildirimlerini en yeniden eskiye, sayfalı döndürür.
/// Yalnızca kimlik doğrulaması gerekir — her kullanıcı kendi bildirimlerini görür.
/// </summary>
public sealed class ListNotificationsEndpoint(NotificationsDbContext db)
    : Endpoint<ListNotificationsRequest, PagedResult<NotificationResponse>>
{
    public override void Configure()
    {
        Get("/notifications");
    }

    public override async Task HandleAsync(ListNotificationsRequest req, CancellationToken ct)
    {
        var userId = NotificationsUser.GetUserId(User);
        if (userId is null) { await Send.UnauthorizedAsync(ct); return; }

        var query = db.Notifications.AsNoTracking().Where(n => n.UserId == userId.Value);

        if (req.UnreadOnly)
        {
            query = query.Where(n => !n.IsRead);
        }

        var result = await query
            .OrderByDescending(n => n.CreatedAtUtc)
            .Select(n => new NotificationResponse(
                n.Id, n.Title, n.Message, n.Type, n.Link, n.IsRead, n.CreatedAtUtc, n.ReadAtUtc))
            .ToPagedResultAsync(req, ct);

        await Send.OkAsync(result, ct);
    }
}
