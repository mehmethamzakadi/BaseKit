using BaseKit.Shared.Settings;

namespace BaseKit.Modules.System.Settings;

/// <summary>
/// Bilinen sistem ayarlarının merkezi kataloğu. Yeni bir ayar eklemek için
/// buraya bir <see cref="SettingDefinition"/> eklemek yeterlidir; yönetim
/// arayüzünde ilgili grup altında otomatik görünür.
/// </summary>
public static class SystemSettingsCatalog
{
    public const string GeneralGroup = "Genel";
    public const string SecurityGroup = "Güvenlik";
    public const string DisplayGroup = "Görünüm";

    public static readonly IReadOnlyList<SettingDefinition> All =
    [
        new(SettingKeys.SiteName, "Site adı", GeneralGroup, SettingType.Text, "BaseKit",
            "Uygulamanın görünen adı (başlık ve menüde gösterilir)."),
        new(SettingKeys.SupportEmail, "Destek e-postası", GeneralGroup, SettingType.Text, "destek@basekit.local",
            "İletişim/footer için gösterilen e-posta adresi."),

        new(SettingKeys.RegistrationEnabled, "Kayıt açık", SecurityGroup, SettingType.Boolean, "true",
            "Kapalıyken yeni kullanıcı kaydı engellenir."),
        new(SettingKeys.MaintenanceMode, "Bakım modu", SecurityGroup, SettingType.Boolean, "false",
            "Açıkken tüm kullanıcılara bakım uyarısı şeridi gösterilir."),

        new(SettingKeys.DefaultPageSize, "Varsayılan sayfa boyutu", DisplayGroup, SettingType.Number, "20",
            "Listelerde varsayılan kayıt sayısı."),
        new(SettingKeys.DefaultTheme, "Varsayılan tema", DisplayGroup, SettingType.Select, "system",
            "Tema tercihi yapmamış kullanıcılar için varsayılan.",
            [new("system", "Sistem"), new("light", "Açık"), new("dark", "Koyu")]),
    ];

    public static SettingDefinition? Find(string key) =>
        All.FirstOrDefault(s => string.Equals(s.Key, key, StringComparison.Ordinal));
}
