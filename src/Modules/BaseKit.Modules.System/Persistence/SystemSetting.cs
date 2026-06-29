namespace BaseKit.Modules.System.Persistence;

/// <summary>
/// Basit anahtar/değer sistem ayarı. EF Core eşlemesini, migration'ı ve
/// gerçek tablo oluşturmayı doğrulamak için kullanılan örnek varlık.
/// </summary>
public sealed class SystemSetting
{
    public Guid Id { get; set; }
    public string Key { get; set; } = default!;
    public string? Value { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
}
