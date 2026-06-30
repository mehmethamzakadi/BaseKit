using BaseKit.Modules.Users.Domain;
using FastEndpoints;
using Microsoft.AspNetCore.Identity;

namespace BaseKit.Modules.Users.Endpoints.Profile;

/// <summary>Geçerli kullanıcının profil fotoğrafını kaldırır (anahtarı temizler).</summary>
public sealed class DeleteAvatarEndpoint(UserManager<AppUser> userManager)
    : EndpointWithoutRequest<ProfileResponse>
{
    public override void Configure()
    {
        Delete("/profile/avatar");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = ProfileClaims.GetUserId(User);
        if (userId is null) { await Send.UnauthorizedAsync(ct); return; }

        var user = await userManager.FindByIdAsync(userId.Value.ToString());
        if (user is null) { await Send.UnauthorizedAsync(ct); return; }

        user.AvatarObjectKey = null;
        await userManager.UpdateAsync(user);

        await Send.OkAsync(new ProfileResponse(user.Email, user.DisplayName, null), ct);
    }
}
