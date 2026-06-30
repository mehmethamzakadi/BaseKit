using BaseKit.Modules.Users.Authorization;
using BaseKit.Modules.Users.Domain;
using BaseKit.Shared.Audit;
using FastEndpoints;
using Microsoft.AspNetCore.Identity;

namespace BaseKit.Modules.Users.Endpoints.Admin;

public sealed record DeleteRoleRequest(Guid Id);

/// <summary>Rolü siler (yetkileri cascade ile temizlenir).</summary>
public sealed class DeleteRoleEndpoint(
    RoleManager<AppRole> roleManager, IPermissionService permissionService, IAuditLogger audit)
    : Endpoint<DeleteRoleRequest>
{
    public override void Configure()
    {
        Delete("/admin/roles/{id}");
        Permissions(AdminPermissions.RolesManage);
    }

    public override async Task HandleAsync(DeleteRoleRequest req, CancellationToken ct)
    {
        var role = await roleManager.FindByIdAsync(req.Id.ToString());
        if (role is null)
        {
            await Send.NotFoundAsync(ct);
            return;
        }

        var result = await roleManager.DeleteAsync(role);
        if (!result.Succeeded)
        {
            foreach (var error in result.Errors)
            {
                AddError(error.Description);
            }

            await Send.ErrorsAsync(400, ct);
            return;
        }

        await permissionService.InvalidateRoleAsync(role.Id, ct);
        await audit.LogAsync("role.delete", "Role", req.Id.ToString(), role.Name, ct);
        await Send.NoContentAsync(ct);
    }
}
