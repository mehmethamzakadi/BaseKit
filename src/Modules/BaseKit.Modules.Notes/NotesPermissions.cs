using BaseKit.Shared.Authorization;

namespace BaseKit.Modules.Notes;

public static class NotesPermissions
{
    public const string View   = "notes.view";
    public const string Create = "notes.create";
    public const string Update = "notes.update";
    public const string Delete = "notes.delete";
}

public sealed class NotesPermissionProvider : IPermissionProvider
{
    private const string Group = "Notes";

    public IReadOnlyList<PermissionDefinition> GetPermissions() =>
    [
        new(NotesPermissions.View,   "Notes sayfasını görüntüle", Group),
        new(NotesPermissions.Create, "Note oluştur",           Group),
        new(NotesPermissions.Update, "Note güncelle",          Group),
        new(NotesPermissions.Delete, "Note sil",               Group),
    ];
}