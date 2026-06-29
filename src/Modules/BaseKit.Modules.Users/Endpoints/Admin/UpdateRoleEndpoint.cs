using BaseKit.Modules.Users.Authorization;
using BaseKit.Modules.Users.Domain;
using FastEndpoints;
using Microsoft.AspNetCore.Identity;

namespace BaseKit.Modules.Users.Endpoints.Admin;

public sealed record UpdateRoleRequest(Guid Id, string Name, string? Description);

/// <summary>Rolün adını/açıklamasını günceller.</summary>
public sealed class UpdateRoleEndpoint(RoleManager<AppRole> roleManager)
    : Endpoint<UpdateRoleRequest, RoleDto>
{
    public override void Configure()
    {
        Put("/admin/roles/{id}");
        Permissions(AdminPermissions.RolesManage);
    }

    public override async Task HandleAsync(UpdateRoleRequest req, CancellationToken ct)
    {
        var role = await roleManager.FindByIdAsync(req.Id.ToString());
        if (role is null)
        {
            await Send.NotFoundAsync(ct);
            return;
        }

        role.Name = req.Name;
        role.Description = req.Description;

        var result = await roleManager.UpdateAsync(role);
        if (!result.Succeeded)
        {
            foreach (var error in result.Errors)
            {
                AddError(error.Description);
            }

            await Send.ErrorsAsync(400, ct);
            return;
        }

        await Send.OkAsync(new RoleDto(role.Id, role.Name!, role.Description, []), ct);
    }
}
