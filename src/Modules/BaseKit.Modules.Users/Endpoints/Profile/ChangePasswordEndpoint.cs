using BaseKit.Modules.Users.Authentication;
using BaseKit.Modules.Users.Domain;
using BaseKit.Modules.Users.Endpoints;
using BaseKit.Modules.Users.Persistence;
using FastEndpoints;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace BaseKit.Modules.Users.Endpoints.Profile;

public sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword);

/// <summary>
/// Geçerli kullanıcının şifresini değiştirir. Mevcut şifre doğrulanır; yeni
/// şifre Identity parola kurallarından geçmelidir.
/// <para>
/// Güvenlik: Şifre değişince kullanıcının <b>tüm aktif refresh token'ları iptal
/// edilir</b> (diğer cihaz/oturumlar bir sonraki yenilemede düşer) ve çağıran
/// istemciye <b>yeni bir token çifti</b> verilir; böylece mevcut oturum açık kalır
/// ama olası ele geçirilmiş diğer oturumlar sonlandırılır.
/// </para>
/// </summary>
public sealed class ChangePasswordEndpoint(
    UserManager<AppUser> userManager,
    ITokenService tokenService,
    UsersDbContext db)
    : Endpoint<ChangePasswordRequest, TokenResponse>
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

        var now = DateTimeOffset.UtcNow;

        // Tüm aktif refresh token'ları iptal et (diğer cihazlar/oturumlar).
        var activeTokens = await db.RefreshTokens
            .Where(t => t.UserId == user.Id && t.RevokedAtUtc == null && t.ExpiresAtUtc > now)
            .ToListAsync(ct);
        foreach (var token in activeTokens)
        {
            token.RevokedAtUtc = now;
        }

        // Çağıran istemci için yeni token çifti üret; oturum kesintisiz devam etsin.
        var roles = await userManager.GetRolesAsync(user);
        var access = tokenService.CreateAccessToken(user, roles);
        var refresh = tokenService.CreateRefreshToken();
        db.RefreshTokens.Add(new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = refresh.Hash,
            CreatedAtUtc = now,
            ExpiresAtUtc = refresh.ExpiresAtUtc,
        });

        await db.SaveChangesAsync(ct);

        await Send.OkAsync(
            new TokenResponse(access.Value, access.ExpiresAtUtc, refresh.RawValue, refresh.ExpiresAtUtc),
            ct);
    }
}
