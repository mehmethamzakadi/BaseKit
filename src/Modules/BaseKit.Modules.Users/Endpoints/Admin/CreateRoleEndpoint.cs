using BaseKit.Modules.Users.Authorization;
using BaseKit.Modules.Users.Domain;
using FastEndpoints;
using Microsoft.AspNetCore.Identity;

namespace BaseKit.Modules.Users.Endpoints.Admin;

public sealed record CreateRoleRequest(string Name, string? Description);

/// <summary>Yeni rol oluşturur.</summary>
public sealed class CreateRoleEndpoint(RoleManager<AppRole> roleManager)
    : Endpoint<CreateRoleRequest, RoleDto>
{
    public override void Configure()
    {
        Post("/admin/roles");
        Permissions(AdminPermissions.RolesManage);
    }

    public override async Task HandleAsync(CreateRoleRequest req, CancellationToken ct)
    {
        if (await roleManager.RoleExistsAsync(req.Name))
        {
            AddError(r => r.Name, "Bu adda bir rol zaten var.");
            await Send.ErrorsAsync(409, ct);
            return;
        }

        var role = new AppRole(req.Name) { Description = req.Description };
        var result = await roleManager.CreateAsync(role);
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
