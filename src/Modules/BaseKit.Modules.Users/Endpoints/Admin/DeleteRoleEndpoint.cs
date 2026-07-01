using BaseKit.Modules.Users.Authorization;
using BaseKit.Modules.Users.Domain;
using BaseKit.Modules.Users.Persistence;
using BaseKit.Shared.Audit;
using FastEndpoints;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace BaseKit.Modules.Users.Endpoints.Admin;

public sealed record DeleteRoleRequest(Guid Id);

/// <summary>
/// Rolü soft-delete ile siler. Rol satırı korunur (IsDeleted=true) ama izin
/// atamaları (RolePermissions) ve kullanıcı-rol bağları (UserRoles) kalıcı olarak
/// temizlenir; böylece soft-silinmiş rolün yetkileri kullanıcılarda etkin kalmaz
/// (eski cascade davranışının karşılığı).
/// </summary>
public sealed class DeleteRoleEndpoint(
    RoleManager<AppRole> roleManager,
    UsersDbContext db,
    IPermissionService permissionService,
    IAuditLogger audit)
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

        // Join satırlarını kalıcı temizle (soft-delete cascade tetiklemez).
        await db.RolePermissions.Where(rp => rp.RoleId == role.Id).ExecuteDeleteAsync(ct);
        await db.UserRoles.Where(ur => ur.RoleId == role.Id).ExecuteDeleteAsync(ct);

        // Rolü sil → SoftDeleteInterceptor bunu IsDeleted=true'ya çevirir.
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
