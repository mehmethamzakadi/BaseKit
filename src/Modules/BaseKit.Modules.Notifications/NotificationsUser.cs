using System.Security.Claims;

namespace BaseKit.Modules.Notifications;

/// <summary>Geçerli kullanıcı kimliğini claim'lerden çözen yardımcı.</summary>
public static class NotificationsUser
{
    // JWT "sub" claim'i; sağlayıcı eşlemesine göre NameIdentifier'a da düşebilir.
    public static Guid? GetUserId(ClaimsPrincipal? user)
    {
        var idValue = user?.FindFirstValue("sub")
                      ?? user?.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(idValue, out var id) ? id : null;
    }
}
