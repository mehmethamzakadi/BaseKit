using BaseKit.Modules.Users.Authentication;
using BaseKit.Modules.Users.Domain;
using BaseKit.Modules.Users.Persistence;
using FastEndpoints;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace BaseKit.Modules.Users.Endpoints;

public sealed record RefreshRequest(string RefreshToken);

/// <summary>
/// Refresh token rotasyonu: gelen token doğrulanır, iptal edilir ve yerine
/// yeni bir access + refresh çifti üretilir.
/// </summary>
public sealed class RefreshEndpoint(
    UserManager<AppUser> userManager,
    ITokenService tokenService,
    UsersDbContext db)
    : Endpoint<RefreshRequest, TokenResponse>
{
    public override void Configure()
    {
        Post("/auth/refresh");
        AllowAnonymous();
    }

    public override async Task HandleAsync(RefreshRequest req, CancellationToken ct)
    {
        var hash = tokenService.Hash(req.RefreshToken);
        var existing = await db.RefreshTokens.FirstOrDefaultAsync(x => x.TokenHash == hash, ct);

        if (existing is null || !existing.IsActive)
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var user = await userManager.FindByIdAsync(existing.UserId.ToString());
        if (user is null)
        {
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

        await Send.OkAsync(
            new TokenResponse(access.Value, access.ExpiresAtUtc, refresh.RawValue, refresh.ExpiresAtUtc),
            ct);
    }
}
