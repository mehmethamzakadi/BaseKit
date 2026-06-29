using BaseKit.Modules.Users.Authorization;
using BaseKit.Modules.Users.Domain;
using FastEndpoints;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace BaseKit.Modules.Users.Endpoints.Admin;

/// <summary>Tüm rolleri ve her birinin yetkilerini listeler.</summary>
public sealed class ListRolesEndpoint(RoleManager<AppRole> roleManager, IPermissionService permissions)
    : EndpointWithoutRequest<IReadOnlyList<RoleDto>>
{
    public override void Configure()
    {
        Get("/admin/roles");
        Permissions(AdminPermissions.RolesManage);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var roles = await roleManager.Roles.ToListAsync(ct);

        var result = new List<RoleDto>(roles.Count);
        foreach (var role in roles)
        {
            var perms = await permissions.GetRolePermissionsAsync(role.Id, ct);
            result.Add(new RoleDto(role.Id, role.Name!, role.Description, perms.ToList()));
        }

        await Send.OkAsync(result, ct);
    }
}
