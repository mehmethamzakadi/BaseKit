using BaseKit.Modules.Users.Authentication;
using BaseKit.Modules.Users.Domain;
using BaseKit.Modules.Users.Persistence;
using FastEndpoints;
using Microsoft.AspNetCore.Identity;

namespace BaseKit.Modules.Users.Endpoints;

public sealed record LoginRequest(string Email, string Password);

public sealed class LoginEndpoint(
    UserManager<AppUser> userManager,
    ITokenService tokenService,
    UsersDbContext db)
    : Endpoint<LoginRequest, TokenResponse>
{
    public override void Configure()
    {
        Post("/auth/login");
        AllowAnonymous();
    }

    public override async Task HandleAsync(LoginRequest req, CancellationToken ct)
    {
        var user = await userManager.FindByEmailAsync(req.Email);
        if (user is null || !await userManager.CheckPasswordAsync(user, req.Password))
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

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
