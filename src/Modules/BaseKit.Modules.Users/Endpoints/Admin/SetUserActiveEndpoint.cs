using BaseKit.Modules.Users.Authorization;
using BaseKit.Modules.Users.Domain;
using BaseKit.Modules.Users.Endpoints.Profile;
using FastEndpoints;
using Microsoft.AspNetCore.Identity;

namespace BaseKit.Modules.Users.Endpoints.Admin;

public sealed class SetUserActiveRequest
{
    public Guid Id { get; set; }
    public bool Active { get; set; }
}

/// <summary>
/// Kullanıcıyı aktif/pasif yapar. Pasif kullanıcı (LockoutEnd sonsuz) giriş
/// yapamaz. Yönetici kendini pasifleştiremez.
/// </summary>
public sealed class SetUserActiveEndpoint(UserManager<AppUser> userManager)
    : Endpoint<SetUserActiveRequest, UserDto>
{
    public override void Configure()
    {
        Put("/admin/users/{id}/active");
        Permissions(AdminPermissions.UsersManage);
    }

    public override async Task HandleAsync(SetUserActiveRequest req, CancellationToken ct)
    {
        if (!req.Active && ProfileClaims.GetUserId(User) == req.Id)
        {
            AddError("Kendi hesabınızı pasifleştiremezsiniz.");
            await Send.ErrorsAsync(400, ct);
            return;
        }

        var user = await userManager.FindByIdAsync(req.Id.ToString());
        if (user is null)
        {
            await Send.NotFoundAsync(ct);
            return;
        }

        // Pasif: LockoutEnd sonsuz; Aktif: kilit kaldırılır + başarısız sayaç sıfırlanır.
        user.LockoutEnd = req.Active ? null : DateTimeOffset.MaxValue;
        await userManager.UpdateAsync(user);
        if (req.Active)
        {
            await userManager.ResetAccessFailedCountAsync(user);
        }

        var roles = await userManager.GetRolesAsync(user);
        await Send.OkAsync(
            new UserDto(user.Id, user.Email, user.DisplayName, roles.ToList(), req.Active), ct);
    }
}
