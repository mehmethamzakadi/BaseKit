using BaseKit.Modules.Users.Authorization;
using BaseKit.Modules.Users.Domain;
using BaseKit.Shared.Pagination;
using FastEndpoints;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace BaseKit.Modules.Users.Endpoints.Admin;

public sealed record UserDto(
    Guid Id, string? Email, string? DisplayName, IReadOnlyList<string> Roles, bool IsActive);

/// <summary>Kullanıcı listesi sorgusu (sayfalama + e-posta araması).</summary>
public sealed class ListUsersRequest : PagedQuery;

/// <summary>Kullanıcıları rolleriyle birlikte, sayfalı ve aranabilir biçimde listeler.</summary>
public sealed class ListUsersEndpoint(UserManager<AppUser> userManager)
    : Endpoint<ListUsersRequest, PagedResult<UserDto>>
{
    public override void Configure()
    {
        Get("/admin/users");
        Permissions(AdminPermissions.UsersManage);
    }

    public override async Task HandleAsync(ListUsersRequest req, CancellationToken ct)
    {
        var query = userManager.Users;

        if (!string.IsNullOrWhiteSpace(req.Search))
        {
            var term = req.Search.Trim();
            query = query.Where(u =>
                (u.Email != null && EF.Functions.ILike(u.Email, $"%{term}%")) ||
                (u.DisplayName != null && EF.Functions.ILike(u.DisplayName, $"%{term}%")));
        }

        query = query.OrderBy(u => u.Email);

        var totalCount = await query.CountAsync(ct);
        var pageUsers = await query
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .ToListAsync(ct);

        var now = DateTimeOffset.UtcNow;

        // Roller kullanıcı başına ayrı sorgulanır; yalnızca sayfadaki kayıtlar için.
        var items = new List<UserDto>(pageUsers.Count);
        foreach (var user in pageUsers)
        {
            var roles = await userManager.GetRolesAsync(user);
            var isActive = user.LockoutEnd is null || user.LockoutEnd <= now;
            items.Add(new UserDto(user.Id, user.Email, user.DisplayName, roles.ToList(), isActive));
        }

        await Send.OkAsync(new PagedResult<UserDto>(items, req.Page, req.PageSize, totalCount), ct);
    }
}
