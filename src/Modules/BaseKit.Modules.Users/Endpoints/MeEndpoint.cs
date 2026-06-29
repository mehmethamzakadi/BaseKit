using System.Security.Claims;
using BaseKit.Modules.Users.Authorization;
using FastEndpoints;
using Microsoft.IdentityModel.JsonWebTokens;

namespace BaseKit.Modules.Users.Endpoints;

public sealed record MeResponse(
    string? UserId,
    string? Email,
    IReadOnlyList<string> Roles,
    IReadOnlyList<string> Permissions);

/// <summary>
/// Geçerli kullanıcının kimlik bilgisini, rollerini ve (rol→yetki, anlık)
/// yetkilerini döndürür. Client bu yetkilere göre menü/buton göster-gizle yapar.
/// Yetkiler her istekte <see cref="PermissionClaimsTransformation"/> ile
/// "permissions" claim'i olarak eklenir.
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

        var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
        var permissions = User
            .FindAll(PermissionClaimsTransformation.PermissionClaimType)
            .Select(c => c.Value)
            .Distinct(StringComparer.Ordinal)
            .ToList();

        await Send.OkAsync(new MeResponse(userId, email, roles, permissions), ct);
    }
}
