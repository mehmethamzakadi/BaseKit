using BaseKit.Modules.Users.Authorization;
using BaseKit.Modules.Users.Domain;
using FastEndpoints;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace BaseKit.Modules.Users.Endpoints.Admin;

public sealed record UserDto(Guid Id, string? Email, IReadOnlyList<string> Roles);

/// <summary>Tüm kullanıcıları rolleriyle birlikte listeler.</summary>
public sealed class ListUsersEndpoint(UserManager<AppUser> userManager)
    : EndpointWithoutRequest<IReadOnlyList<UserDto>>
{
    public override void Configure()
    {
        Get("/admin/users");
        Permissions(AdminPermissions.UsersManage);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var users = await userManager.Users.ToListAsync(ct);

        var result = new List<UserDto>(users.Count);
        foreach (var user in users)
        {
            var roles = await userManager.GetRolesAsync(user);
            result.Add(new UserDto(user.Id, user.Email, roles.ToList()));
        }

        await Send.OkAsync(result, ct);
    }
}
