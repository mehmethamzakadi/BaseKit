using BaseKit.Modules.Users.Domain;
using BaseKit.Shared.Storage;
using FastEndpoints;
using Microsoft.AspNetCore.Identity;

namespace BaseKit.Modules.Users.Endpoints.Profile;

/// <summary>Geçerli kullanıcının profil fotoğrafını kaldırır ve depodan siler.</summary>
public sealed class DeleteAvatarEndpoint(UserManager<AppUser> userManager, IFileStorage storage)
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

        var oldKey = user.AvatarObjectKey;
        user.AvatarObjectKey = null;
        await userManager.UpdateAsync(user);

        if (!string.IsNullOrEmpty(oldKey))
        {
            await storage.DeleteAsync(oldKey, ct);
        }

        await Send.OkAsync(new ProfileResponse(user.Email, user.DisplayName, null), ct);
    }
}
