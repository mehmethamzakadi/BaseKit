using BaseKit.Modules.Users.Domain;
using BaseKit.Shared.Storage;
using FastEndpoints;
using Microsoft.AspNetCore.Identity;

namespace BaseKit.Modules.Users.Endpoints.Profile;

public sealed record UpdateProfileRequest(string? DisplayName);

/// <summary>
/// Geçerli kullanıcının profilini günceller (şimdilik görünen ad). Kimlik
/// doğrulaması gerektirir; yalnızca kendi hesabını etkiler.
/// </summary>
public sealed class UpdateProfileEndpoint(UserManager<AppUser> userManager, IFileStorage storage)
    : Endpoint<UpdateProfileRequest, ProfileResponse>
{
    public override void Configure()
    {
        Put("/profile");
        // Yetki yok; her kimliği doğrulanmış kullanıcı kendi profilini düzenler.
    }

    public override async Task HandleAsync(UpdateProfileRequest req, CancellationToken ct)
    {
        var userId = ProfileClaims.GetUserId(User);
        if (userId is null) { await Send.UnauthorizedAsync(ct); return; }

        var user = await userManager.FindByIdAsync(userId.Value.ToString());
        if (user is null) { await Send.UnauthorizedAsync(ct); return; }

        user.DisplayName = string.IsNullOrWhiteSpace(req.DisplayName) ? null : req.DisplayName.Trim();
        var result = await userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            foreach (var error in result.Errors) AddError(error.Description);
            await Send.ErrorsAsync(400, ct);
            return;
        }

        var avatarUrl = string.IsNullOrEmpty(user.AvatarObjectKey)
            ? null
            : await storage.GetPresignedUrlAsync(user.AvatarObjectKey, ct: ct);

        await Send.OkAsync(new ProfileResponse(user.Email, user.DisplayName, avatarUrl), ct);
    }
}
