using BaseKit.Modules.Users.Authorization;
using BaseKit.Modules.Users.Persistence;
using BaseKit.Shared.Pagination;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace BaseKit.Modules.Users.Endpoints.Admin;

public sealed record AuditLogDto(
    Guid Id,
    Guid? UserId,
    string? UserEmail,
    string Action,
    string? EntityType,
    string? EntityId,
    string? Details,
    string? IpAddress,
    DateTimeOffset CreatedAtUtc);

/// <summary>Denetim kaydı listesi sorgusu (sayfalama + eylem/e-posta araması).</summary>
public sealed class ListAuditLogsRequest : PagedQuery;

/// <summary>Denetim kayıtlarını en yeniden eskiye, sayfalı ve aranabilir biçimde listeler.</summary>
public sealed class ListAuditLogsEndpoint(UsersDbContext db)
    : Endpoint<ListAuditLogsRequest, PagedResult<AuditLogDto>>
{
    public override void Configure()
    {
        Get("/admin/audit-logs");
        Permissions(AdminPermissions.AuditView);
    }

    public override async Task HandleAsync(ListAuditLogsRequest req, CancellationToken ct)
    {
        var query = db.AuditLogs.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(req.Search))
        {
            var term = req.Search.Trim();
            query = query.Where(a =>
                EF.Functions.ILike(a.Action, $"%{term}%") ||
                (a.UserEmail != null && EF.Functions.ILike(a.UserEmail, $"%{term}%")) ||
                (a.EntityType != null && EF.Functions.ILike(a.EntityType, $"%{term}%")));
        }

        var result = await query
            .OrderByDescending(a => a.CreatedAtUtc)
            .Select(a => new AuditLogDto(
                a.Id, a.UserId, a.UserEmail, a.Action, a.EntityType, a.EntityId,
                a.Details, a.IpAddress, a.CreatedAtUtc))
            .ToPagedResultAsync(req, ct);

        await Send.OkAsync(result, ct);
    }
}
