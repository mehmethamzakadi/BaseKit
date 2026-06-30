using BaseKit.Shared.Authorization;

namespace BaseKit.Modules.Notifications;

/// <summary>
/// Bildirim modülünün yetkileri. Kendi bildirimlerini görüntüleme/okuma için
/// özel yetki gerekmez (yalnızca kimlik doğrulaması); yalnızca başkalarına
/// duyuru gönderme yetkiyle korunur.
/// </summary>
public static class NotificationsPermissions
{
    public const string Send = "notifications.send";
}

public sealed class NotificationsPermissionProvider : IPermissionProvider
{
    private const string Group = "Bildirimler";

    public IReadOnlyList<PermissionDefinition> GetPermissions() =>
    [
        new(NotificationsPermissions.Send, "Bildirim/duyuru gönder", Group),
    ];
}
