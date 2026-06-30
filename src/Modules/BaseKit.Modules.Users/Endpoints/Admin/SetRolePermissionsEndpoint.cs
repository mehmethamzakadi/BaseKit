using BaseKit.Modules.Users.Authorization;
using BaseKit.Modules.Users.Domain;
using BaseKit.Shared.Audit;
using BaseKit.Shared.Authorization;
using FastEndpoints;
using Microsoft.AspNetCore.Identity;

namespace BaseKit.Modules.Users.Endpoints.Admin;

public sealed class SetRolePermissionsRequest
{
    public Guid Id { get; set; }
    public List<string> Permissions { get; set; } = [];
}

/// <summary>
/// Bir rolün yetki kümesini tümüyle değiştirir. Yalnızca katalogda tanımlı
/// yetkiler kabul edilir. Değişiklik cache invalidation ile anında etki eder.
/// </summary>
public sealed class SetRolePermissionsEndpoint(
    RoleManager<AppRole> roleManager,
    IPermissionService permissionService,
    IEnumerable<IPermissionProvider> providers,
    IAuditLogger audit)
    : Endpoint<SetRolePermissionsRequest, RoleDto>
{
    public override void Configure()
    {
        Put("/admin/roles/{id}/permissions");
        Permissions(AdminPermissions.RolesManage);
    }

    public override async Task HandleAsync(SetRolePermissionsRequest req, CancellationToken ct)
    {
        var role = await roleManager.FindByIdAsync(req.Id.ToString());
        if (role is null)
        {
            await Send.NotFoundAsync(ct);
            return;
        }

        var known = providers
            .SelectMany(p => p.GetPermissions())
            .Select(d => d.Name)
            .ToHashSet(StringComparer.Ordinal);

        var unknown = req.Permissions.Where(p => !known.Contains(p)).ToList();
        if (unknown.Count > 0)
        {
            AddError($"Tanımsız yetki(ler): {string.Join(", ", unknown)}");
            await Send.ErrorsAsync(400, ct);
            return;
        }

        await permissionService.SetRolePermissionsAsync(role.Id, req.Permissions, ct);

        await audit.LogAsync(
            "role.set_permissions", "Role", role.Id.ToString(),
            $"{role.Name}: {req.Permissions.Count} yetki", ct);

        await Send.OkAsync(new RoleDto(role.Id, role.Name!, role.Description, req.Permissions), ct);
    }
}
