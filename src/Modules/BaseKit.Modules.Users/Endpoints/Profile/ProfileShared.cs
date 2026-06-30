using System.Security.Claims;
using Microsoft.IdentityModel.JsonWebTokens;

namespace BaseKit.Modules.Users.Endpoints.Profile;

/// <summary>Profil uçlarının ortak yanıtı (görünen ad + avatar URL).</summary>
public sealed record ProfileResponse(string? Email, string? DisplayName, string? AvatarUrl);

/// <summary>Profil uçları için ortak yardımcılar.</summary>
public static class ProfileClaims
{
    /// <summary>JWT'den geçerli kullanıcının id'sini çözer.</summary>
    public static Guid? GetUserId(ClaimsPrincipal user)
    {
        var value = user.FindFirstValue(JwtRegisteredClaimNames.Sub)
                    ?? user.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(value, out var id) ? id : null;
    }
}
