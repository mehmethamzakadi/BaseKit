using BaseKit.Shared.Authorization;

namespace BaseKit.Modules.Users.Authorization;

/// <summary>Yönetim (rol/kullanıcı) yetkileri.</summary>
public static class AdminPermissions
{
    public const string View = "admin.view";
    public const string RolesManage = "admin.roles.manage";
    public const string UsersManage = "admin.users.manage";
    public const string AuditView = "admin.audit.view";
}

public sealed class AdminPermissionProvider : IPermissionProvider
{
    private const string Group = "Yönetim";

    public IReadOnlyList<PermissionDefinition> GetPermissions() =>
    [
        new(AdminPermissions.View, "Yönetim sayfasını görüntüle", Group),
        new(AdminPermissions.RolesManage, "Rolleri ve yetkileri yönet", Group),
        new(AdminPermissions.UsersManage, "Kullanıcıları ve rol atamalarını yönet", Group),
        new(AdminPermissions.AuditView, "Denetim kayıtlarını görüntüle", Group),
    ];
}
