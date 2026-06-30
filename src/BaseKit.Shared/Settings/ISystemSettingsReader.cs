namespace BaseKit.Shared.Settings;

/// <summary>
/// Bilinen sistem ayarı anahtarları. Hem ayar kataloğu (System modülü) hem de
/// ayarı okuyan diğer modüller (ör. Users kayıt kontrolü) buradan referans alır.
/// </summary>
public static class SettingKeys
{
    public const string SiteName = "general.siteName";
    public const string SupportEmail = "general.supportEmail";
    public const string RegistrationEnabled = "security.registrationEnabled";
    public const string MaintenanceMode = "security.maintenanceMode";
    public const string DefaultPageSize = "display.defaultPageSize";
    public const string DefaultTheme = "display.defaultTheme";
}

/// <summary>
/// Sistem ayarlarını yalnızca okumak için modüller arası soyutlama. System
/// modülü uygular; diğer modüller (Users, vb.) ayar tablosuna doğrudan bağımlı
/// olmadan etkin değerleri (override yoksa varsayılan) okuyabilir.
/// </summary>
public interface ISystemSettingsReader
{
    /// <summary>Anahtarın etkin değerini döndürür (bilinmeyen anahtar için null).</summary>
    Task<string?> GetValueAsync(string key, CancellationToken ct = default);

    Task<bool> GetBoolAsync(string key, bool fallback = false, CancellationToken ct = default);

    Task<int> GetIntAsync(string key, int fallback = 0, CancellationToken ct = default);
}
