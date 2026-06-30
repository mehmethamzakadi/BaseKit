using BaseKit.Modules.Users.Authorization;
using BaseKit.Modules.Users.Domain;
using BaseKit.Shared.Pagination;
using FastEndpoints;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace BaseKit.Modules.Users.Endpoints.Admin;

/// <summary>Rol listesi sorgusu (sayfalama + ad/açıklama araması).</summary>
public sealed class ListRolesRequest : PagedQuery;

/// <summary>Rolleri ve her birinin yetkilerini sayfalı, aranabilir biçimde listeler.</summary>
public sealed class ListRolesEndpoint(RoleManager<AppRole> roleManager, IPermissionService permissions)
    : Endpoint<ListRolesRequest, PagedResult<RoleDto>>
{
    public override void Configure()
    {
        Get("/admin/roles");
        Permissions(AdminPermissions.RolesManage);
    }

    public override async Task HandleAsync(ListRolesRequest req, CancellationToken ct)
    {
        var query = roleManager.Roles;

        if (!string.IsNullOrWhiteSpace(req.Search))
        {
            var term = req.Search.Trim();
            query = query.Where(r =>
                (r.Name != null && EF.Functions.ILike(r.Name, $"%{term}%")) ||
                (r.Description != null && EF.Functions.ILike(r.Description, $"%{term}%")));
        }

        query = query.OrderBy(r => r.Name);

        var totalCount = await query.CountAsync(ct);
        var pageRoles = await query
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .ToListAsync(ct);

        // Yetkiler rol başına (Redis-cache'li) ayrı sorgulanır; yalnızca sayfadakiler için.
        var items = new List<RoleDto>(pageRoles.Count);
        foreach (var role in pageRoles)
        {
            var perms = await permissions.GetRolePermissionsAsync(role.Id, ct);
            items.Add(new RoleDto(role.Id, role.Name!, role.Description, perms.ToList()));
        }

        await Send.OkAsync(new PagedResult<RoleDto>(items, req.Page, req.PageSize, totalCount), ct);
    }
}
