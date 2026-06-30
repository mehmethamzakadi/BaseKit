using BaseKit.Modules.Users.Authorization;
using BaseKit.Modules.Users.Domain;
using BaseKit.Modules.Users.Endpoints.Profile;
using BaseKit.Modules.Users.Persistence;
using FastEndpoints;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace BaseKit.Modules.Users.Endpoints.Admin;

public sealed record DeleteUserRequest(Guid Id);

/// <summary>Kullanıcıyı siler. Yönetici kendini silemez.</summary>
public sealed class DeleteUserEndpoint(UserManager<AppUser> userManager, UsersDbContext db)
    : Endpoint<DeleteUserRequest>
{
    public override void Configure()
    {
        Delete("/admin/users/{id}");
        Permissions(AdminPermissions.UsersManage);
    }

    public override async Task HandleAsync(DeleteUserRequest req, CancellationToken ct)
    {
        if (ProfileClaims.GetUserId(User) == req.Id)
        {
            AddError("Kendi hesabınızı silemezsiniz.");
            await Send.ErrorsAsync(400, ct);
            return;
        }

        var user = await userManager.FindByIdAsync(req.Id.ToString());
        if (user is null)
        {
            await Send.NotFoundAsync(ct);
            return;
        }

        // Kullanıcının refresh token'larını temizle (orphan önleme).
        await db.RefreshTokens.Where(t => t.UserId == user.Id).ExecuteDeleteAsync(ct);

        var result = await userManager.DeleteAsync(user);
        if (!result.Succeeded)
        {
            foreach (var error in result.Errors) AddError(error.Description);
            await Send.ErrorsAsync(400, ct);
            return;
        }

        await Send.NoContentAsync(ct);
    }
}
