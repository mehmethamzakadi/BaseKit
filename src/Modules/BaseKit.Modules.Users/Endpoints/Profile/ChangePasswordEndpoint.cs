using BaseKit.Modules.Users.Domain;
using FastEndpoints;
using Microsoft.AspNetCore.Identity;

namespace BaseKit.Modules.Users.Endpoints.Profile;

public sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword);

public sealed record ChangePasswordResponse(string Message);

/// <summary>
/// Geçerli kullanıcının şifresini değiştirir. Mevcut şifre doğrulanır; yeni
/// şifre Identity parola kurallarından geçmelidir.
/// </summary>
public sealed class ChangePasswordEndpoint(UserManager<AppUser> userManager)
    : Endpoint<ChangePasswordRequest, ChangePasswordResponse>
{
    public override void Configure()
    {
        Post("/profile/change-password");
    }

    public override async Task HandleAsync(ChangePasswordRequest req, CancellationToken ct)
    {
        var userId = ProfileClaims.GetUserId(User);
        if (userId is null) { await Send.UnauthorizedAsync(ct); return; }

        var user = await userManager.FindByIdAsync(userId.Value.ToString());
        if (user is null) { await Send.UnauthorizedAsync(ct); return; }

        var result = await userManager.ChangePasswordAsync(user, req.CurrentPassword, req.NewPassword);
        if (!result.Succeeded)
        {
            foreach (var error in result.Errors) AddError(error.Description);
            await Send.ErrorsAsync(400, ct);
            return;
        }

        await Send.OkAsync(new ChangePasswordResponse("Şifreniz başarıyla güncellendi."), ct);
    }
}
