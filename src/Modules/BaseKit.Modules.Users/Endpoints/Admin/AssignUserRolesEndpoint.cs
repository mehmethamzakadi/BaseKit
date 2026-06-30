using BaseKit.Modules.Users.Authorization;
using BaseKit.Modules.Users.Domain;
using BaseKit.Shared.Audit;
using FastEndpoints;
using Microsoft.AspNetCore.Identity;

namespace BaseKit.Modules.Users.Endpoints.Admin;

public sealed class AssignUserRolesRequest
{
    public Guid Id { get; set; }
    public List<string> Roles { get; set; } = [];
}

/// <summary>Kullanıcının rollerini verilen kümeyle eşitler.</summary>
public sealed class AssignUserRolesEndpoint(
    UserManager<AppUser> userManager, RoleManager<AppRole> roleManager, IAuditLogger audit)
    : Endpoint<AssignUserRolesRequest, UserDto>
{
    public override void Configure()
    {
        Put("/admin/users/{id}/roles");
        Permissions(AdminPermissions.UsersManage);
    }

    public override async Task HandleAsync(AssignUserRolesRequest req, CancellationToken ct)
    {
        var user = await userManager.FindByIdAsync(req.Id.ToString());
        if (user is null)
        {
            await Send.NotFoundAsync(ct);
            return;
        }

        var desired = req.Roles.Distinct(StringComparer.Ordinal).ToList();

        var unknown = new List<string>();
        foreach (var roleName in desired)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                unknown.Add(roleName);
            }
        }

        if (unknown.Count > 0)
        {
            AddError($"Tanımsız rol(ler): {string.Join(", ", unknown)}");
            await Send.ErrorsAsync(400, ct);
            return;
        }

        var current = await userManager.GetRolesAsync(user);
        var toAdd = desired.Except(current, StringComparer.Ordinal).ToList();
        var toRemove = current.Except(desired, StringComparer.Ordinal).ToList();

        if (toRemove.Count > 0)
        {
            await userManager.RemoveFromRolesAsync(user, toRemove);
        }

        if (toAdd.Count > 0)
        {
            await userManager.AddToRolesAsync(user, toAdd);
        }

        await audit.LogAsync(
            "user.assign_roles", "User", user.Id.ToString(),
            $"{user.Email}: {string.Join(", ", desired)}", ct);

        var isActive = user.LockoutEnd is null || user.LockoutEnd <= DateTimeOffset.UtcNow;
        await Send.OkAsync(new UserDto(user.Id, user.Email, user.DisplayName, desired, isActive), ct);
    }
}
