using BaseKit.Shared.Authorization;

namespace BaseKit.Modules.System;

/// <summary>Sistem modülünün yetkileri (ayar yönetimi).</summary>
public static class SystemPermissions
{
    public const string SettingsView = "system.settings.view";
    public const string SettingsManage = "system.settings.manage";
}

public sealed class SystemPermissionProvider : IPermissionProvider
{
    private const string Group = "Sistem";

    public IReadOnlyList<PermissionDefinition> GetPermissions() =>
    [
        new(SystemPermissions.SettingsView, "Sistem ayarlarını görüntüle", Group),
        new(SystemPermissions.SettingsManage, "Sistem ayarlarını düzenle", Group),
    ];
}
