using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.IdentityModel.JsonWebTokens;

namespace BaseKit.Modules.Users.Authorization;

/// <summary>
/// Her istekte, kimliği doğrulanmış kullanıcının güncel yetkilerini (rol→yetki,
/// Redis-cache'li) "permissions" claim'leri olarak ekler. Böylece bir rolün
/// yetkisi değiştiğinde etki anında görülür; token'ın yenilenmesi beklenmez.
/// </summary>
public sealed class PermissionClaimsTransformation(IPermissionService permissionService)
    : IClaimsTransformation
{
    public const string PermissionClaimType = "permissions";

    public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
    {
        if (principal.Identity is not ClaimsIdentity { IsAuthenticated: true } identity)
        {
            return principal;
        }

        // Aynı istekte birden fazla kez çağrılırsa tekrar eklemeyelim.
        if (identity.HasClaim(c => c.Type == PermissionClaimType))
        {
            return principal;
        }

        var userIdValue = principal.FindFirstValue(JwtRegisteredClaimNames.Sub)
                          ?? principal.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(userIdValue, out var userId))
        {
            return principal;
        }

        var permissions = await permissionService.GetUserPermissionsAsync(userId);
        identity.AddClaims(permissions.Select(p => new Claim(PermissionClaimType, p)));

        return principal;
    }
}
