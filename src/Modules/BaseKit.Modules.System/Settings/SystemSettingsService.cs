using BaseKit.Modules.System.Persistence;
using BaseKit.Shared.Settings;
using Microsoft.EntityFrameworkCore;

namespace BaseKit.Modules.System.Settings;

/// <summary>
/// Sistem ayarlarını okuma/yazma soyutlaması. Değerler katalog tanımlarıyla
/// (varsayılanlar) birleştirilerek döner; yazma yalnızca katalogda tanımlı
/// anahtarları kabul eder ve tipe göre doğrular.
/// </summary>
public interface ISystemSettingsService
{
    /// <summary>Tüm bilinen ayarların etkin değerlerini (override yoksa varsayılan) döndürür.</summary>
    Task<IReadOnlyDictionary<string, string>> GetEffectiveValuesAsync(CancellationToken ct = default);

    /// <summary>Tek bir ayarın etkin değerini döndürür (override yoksa varsayılan).</summary>
    Task<string?> GetValueAsync(string key, CancellationToken ct = default);

    /// <summary>
    /// Verilen anahtar/değerleri kalıcılaştırır. Bilinmeyen anahtar veya tipe
    /// uymayan değer için <see cref="SettingsValidationException"/> fırlatır.
    /// </summary>
    Task UpdateAsync(IReadOnlyDictionary<string, string> values, CancellationToken ct = default);
}

/// <summary>Ayar doğrulama hatası — alan adı → mesaj.</summary>
public sealed class SettingsValidationException(IReadOnlyDictionary<string, string> errors)
    : Exception("Geçersiz ayar değeri.")
{
    public IReadOnlyDictionary<string, string> Errors { get; } = errors;
}

public sealed class SystemSettingsService(SystemDbContext db) : ISystemSettingsService, ISystemSettingsReader
{
    async Task<bool> ISystemSettingsReader.GetBoolAsync(string key, bool fallback, CancellationToken ct) =>
        bool.TryParse(await GetValueAsync(key, ct), out var b) ? b : fallback;

    async Task<int> ISystemSettingsReader.GetIntAsync(string key, int fallback, CancellationToken ct) =>
        int.TryParse(await GetValueAsync(key, ct), out var n) ? n : fallback;

    public async Task<IReadOnlyDictionary<string, string>> GetEffectiveValuesAsync(CancellationToken ct = default)
    {
        var stored = await db.Settings.AsNoTracking()
            .ToDictionaryAsync(s => s.Key, s => s.Value, ct);

        var result = new Dictionary<string, string>(StringComparer.Ordinal);
        foreach (var def in SystemSettingsCatalog.All)
        {
            result[def.Key] = stored.TryGetValue(def.Key, out var v) && v is not null
                ? v
                : def.DefaultValue;
        }
        return result;
    }

    public async Task<string?> GetValueAsync(string key, CancellationToken ct = default)
    {
        var def = SystemSettingsCatalog.Find(key);
        if (def is null) return null;

        var stored = await db.Settings.AsNoTracking()
            .Where(s => s.Key == key)
            .Select(s => s.Value)
            .FirstOrDefaultAsync(ct);

        return stored ?? def.DefaultValue;
    }

    public async Task UpdateAsync(IReadOnlyDictionary<string, string> values, CancellationToken ct = default)
    {
        var errors = new Dictionary<string, string>(StringComparer.Ordinal);
        var validated = new Dictionary<string, string>(StringComparer.Ordinal);

        foreach (var (key, rawValue) in values)
        {
            var def = SystemSettingsCatalog.Find(key);
            if (def is null)
            {
                errors[key] = "Bilinmeyen ayar anahtarı.";
                continue;
            }

            var value = rawValue?.Trim() ?? string.Empty;
            if (!TryNormalize(def, value, out var normalized, out var error))
            {
                errors[key] = error!;
                continue;
            }

            validated[key] = normalized!;
        }

        if (errors.Count > 0) throw new SettingsValidationException(errors);
        if (validated.Count == 0) return;

        var keys = validated.Keys.ToList();
        var existing = await db.Settings
            .Where(s => keys.Contains(s.Key))
            .ToDictionaryAsync(s => s.Key, ct);

        var now = DateTimeOffset.UtcNow;
        foreach (var (key, value) in validated)
        {
            if (existing.TryGetValue(key, out var row))
            {
                row.Value = value;
                row.UpdatedAtUtc = now;
            }
            else
            {
                db.Settings.Add(new SystemSetting
                {
                    Id = Guid.NewGuid(),
                    Key = key,
                    Value = value,
                    UpdatedAtUtc = now,
                });
            }
        }

        await db.SaveChangesAsync(ct);
    }

    /// <summary>Değeri tipe göre doğrular ve kanonik biçimine getirir.</summary>
    private static bool TryNormalize(
        SettingDefinition def, string value, out string? normalized, out string? error)
    {
        normalized = null;
        error = null;

        switch (def.Type)
        {
            case SettingType.Boolean:
                if (bool.TryParse(value, out var b))
                {
                    normalized = b ? "true" : "false";
                    return true;
                }
                error = "Geçerli bir doğru/yanlış değeri girin.";
                return false;

            case SettingType.Number:
                if (long.TryParse(value, out var n))
                {
                    normalized = n.ToString();
                    return true;
                }
                error = "Geçerli bir sayı girin.";
                return false;

            case SettingType.Select:
                if (def.Options is { Count: > 0 } &&
                    def.Options.Any(o => string.Equals(o.Value, value, StringComparison.Ordinal)))
                {
                    normalized = value;
                    return true;
                }
                error = "Geçersiz seçenek.";
                return false;

            case SettingType.Text:
            default:
                if (value.Length > 2000)
                {
                    error = "En fazla 2000 karakter olabilir.";
                    return false;
                }
                normalized = value;
                return true;
        }
    }
}
