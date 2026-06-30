namespace BaseKit.Shared.Dashboard;

/// <summary>
/// Dashboard'da gösterilecek tek bir istatistik. <paramref name="Icon"/> istemci
/// tarafında bir ikona eşlenen anahtardır (ör. "users", "shield", "package").
/// </summary>
public sealed record DashboardStat(string Key, string Label, long Value, string Icon);

/// <summary>
/// Her modül kendi özet istatistiklerini bu arabirimi uygulayarak bildirir.
/// Dashboard endpoint'i tüm sağlayıcıları birleştirir; böylece yeni modülün
/// istatistikleri merkezi bir dosyayı düzenlemeden eklenir.
/// </summary>
public interface IDashboardStatProvider
{
    Task<IReadOnlyList<DashboardStat>> GetStatsAsync(CancellationToken ct = default);
}
