namespace BaseKit.Shared.Audit;

/// <summary>
/// Denetim (audit) kaydı soyutlaması. Kritik aksiyonları "kim, ne, ne zaman,
/// nereden" bilgisiyle kalıcı hale getirir. Geçerli kullanıcı ve IP, uygulama
/// tarafından (HttpContext) otomatik doldurulur.
/// </summary>
public interface IAuditLogger
{
    Task LogAsync(
        string action,
        string? entityType = null,
        string? entityId = null,
        string? details = null,
        CancellationToken ct = default);
}
