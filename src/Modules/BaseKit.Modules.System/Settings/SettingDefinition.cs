namespace BaseKit.Modules.System.Settings;

/// <summary>Bir ayarın değer tipi — istemci tarafında uygun giriş alanına eşlenir.</summary>
public enum SettingType
{
    Text,
    Number,
    Boolean,
    Select,
}

/// <summary>"Select" tipli ayarlar için tek bir seçenek.</summary>
public sealed record SettingOption(string Value, string Label);

/// <summary>
/// Tek bir sistem ayarının tanımı (kod tarafında sabit). Gerçek değerler
/// <c>system.settings</c> tablosunda key/value olarak saklanır; kayıt yoksa
/// <see cref="DefaultValue"/> kullanılır. Böylece ayar listesi kodla yönetilir,
/// değerler veritabanında override edilir.
/// </summary>
public sealed record SettingDefinition(
    string Key,
    string Label,
    string Group,
    SettingType Type,
    string DefaultValue,
    string? Description = null,
    IReadOnlyList<SettingOption>? Options = null);
