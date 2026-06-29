using System.Security.Claims;
using FastEndpoints;
using Microsoft.IdentityModel.JsonWebTokens;

namespace BaseKit.Modules.Users.Endpoints;

public sealed record MeResponse(string? UserId, string? Email);

/// <summary>
/// Korumalı örnek endpoint. Geçerli bir JWT gerektirir; token doğrulama ve
/// yetkilendirme zincirinin çalıştığını doğrular.
/// </summary>
public sealed class MeEndpoint : EndpointWithoutRequest<MeResponse>
{
    public override void Configure()
    {
        Get("/auth/me");
        // AllowAnonymous yok → kimlik doğrulaması zorunlu.
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
                     ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        var email = User.FindFirstValue(JwtRegisteredClaimNames.Email)
                    ?? User.FindFirstValue(ClaimTypes.Email);

        await Send.OkAsync(new MeResponse(userId, email), ct);
    }
}
