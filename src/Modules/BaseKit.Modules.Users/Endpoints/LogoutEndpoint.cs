using BaseKit.Modules.Users.Authentication;
using BaseKit.Modules.Users.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace BaseKit.Modules.Users.Endpoints;

/// <summary>
/// Oturumu kapatır: httpOnly cookie'deki refresh token iptal edilir (sunucuda
/// geçersiz kılınır) ve cookie temizlenir. Access token bekletilmez; erişim
/// süresi dolduğunda kendiliğinden geçersiz olur. Anonim erişime açıktır ki
/// access token süresi dolmuş olsa bile çıkış yapılabilsin.
/// </summary>
public sealed class LogoutEndpoint(ITokenService tokenService, UsersDbContext db)
    : EndpointWithoutRequest
{
    public override void Configure()
    {
        Post("/auth/logout");
        AllowAnonymous();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var rawToken = HttpContext.ReadRefreshTokenCookie();
        if (rawToken is not null)
        {
            var hash = tokenService.Hash(rawToken);
            var existing = await db.RefreshTokens
                .FirstOrDefaultAsync(x => x.TokenHash == hash && x.RevokedAtUtc == null, ct);
            if (existing is not null)
            {
                existing.RevokedAtUtc = DateTimeOffset.UtcNow;
                await db.SaveChangesAsync(ct);
            }
        }

        HttpContext.ClearRefreshTokenCookie();
        await Send.NoContentAsync(ct);
    }
}
