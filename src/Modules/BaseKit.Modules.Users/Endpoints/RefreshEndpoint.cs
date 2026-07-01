using BaseKit.Modules.Users.Authentication;
using BaseKit.Modules.Users.Domain;
using BaseKit.Modules.Users.Persistence;
using FastEndpoints;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace BaseKit.Modules.Users.Endpoints;

/// <summary>
/// Refresh token rotasyonu: refresh token <b>httpOnly cookie'den</b> okunur,
/// doğrulanır, iptal edilir ve yerine yeni bir access + refresh çifti üretilir.
/// Yeni refresh token yine cookie olarak yazılır; gövdede yalnızca access token döner.
/// </summary>
public sealed class RefreshEndpoint(
    UserManager<AppUser> userManager,
    ITokenService tokenService,
    UsersDbContext db)
    : EndpointWithoutRequest<TokenResponse>
{
    public override void Configure()
    {
        Post("/auth/refresh");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("auth"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var rawToken = HttpContext.ReadRefreshTokenCookie();
        if (rawToken is null)
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var hash = tokenService.Hash(rawToken);
        var existing = await db.RefreshTokens.FirstOrDefaultAsync(x => x.TokenHash == hash, ct);

        if (existing is null || !existing.IsActive)
        {
            // Geçersiz/iptal edilmiş token → bayat cookie'yi temizle.
            HttpContext.ClearRefreshTokenCookie();
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var user = await userManager.FindByIdAsync(existing.UserId.ToString());
        if (user is null)
        {
            HttpContext.ClearRefreshTokenCookie();
            await Send.UnauthorizedAsync(ct);
            return;
        }

        // Eski token'ı iptal et (rotasyon).
        existing.RevokedAtUtc = DateTimeOffset.UtcNow;

        var roles = await userManager.GetRolesAsync(user);
        var access = tokenService.CreateAccessToken(user, roles);
        var refresh = tokenService.CreateRefreshToken();

        db.RefreshTokens.Add(new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = refresh.Hash,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            ExpiresAtUtc = refresh.ExpiresAtUtc,
        });
        await db.SaveChangesAsync(ct);

        HttpContext.SetRefreshTokenCookie(refresh.RawValue, refresh.ExpiresAtUtc);

        await Send.OkAsync(new TokenResponse(access.Value, access.ExpiresAtUtc), ct);
    }
}
