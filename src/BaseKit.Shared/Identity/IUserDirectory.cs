namespace BaseKit.Shared.Identity;

/// <summary>Kullanıcının kimlik/görünüm özeti (alıcı seçimi gibi modüller arası kullanımlar için).</summary>
public sealed record UserSummary(Guid Id, string? Email, string? DisplayName);

/// <summary>
/// Kullanıcı kimliklerini modüller arası okumak için soyutlama. Users modülü
/// uygular; diğer modüller (ör. Notifications duyuru gönderirken) kullanıcı
/// tablosuna doğrudan bağımlı olmadan aktif kullanıcı listesine erişebilir.
/// </summary>
public interface IUserDirectory
{
    /// <summary>Aktif (engellenmemiş) tüm kullanıcıların kimliklerini döndürür.</summary>
    Task<IReadOnlyList<Guid>> GetActiveUserIdsAsync(CancellationToken ct = default);

    /// <summary>
    /// Aktif kullanıcıları e-posta/görünen ad üzerinde arar (alıcı seçici için).
    /// <paramref name="take"/> ile sonuç sayısı sınırlanır.
    /// </summary>
    Task<IReadOnlyList<UserSummary>> SearchActiveUsersAsync(
        string? search, int take = 20, CancellationToken ct = default);
}
