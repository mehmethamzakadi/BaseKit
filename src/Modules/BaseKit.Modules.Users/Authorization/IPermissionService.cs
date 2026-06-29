namespace BaseKit.Modules.Users.Authorization;

public interface IPermissionService
{
    /// <summary>Kullanıcının tüm rollerinden gelen yetkilerin birleşimi.</summary>
    Task<IReadOnlyCollection<string>> GetUserPermissionsAsync(Guid userId, CancellationToken ct = default);

    /// <summary>Tek bir rolün yetkileri (Redis-cache'li).</summary>
    Task<IReadOnlyCollection<string>> GetRolePermissionsAsync(Guid roleId, CancellationToken ct = default);

    /// <summary>Rolün yetki kümesini tümüyle değiştirir ve cache'i tazeler.</summary>
    Task SetRolePermissionsAsync(Guid roleId, IEnumerable<string> permissions, CancellationToken ct = default);

    /// <summary>Bir rolün cache'ini geçersiz kılar.</summary>
    Task InvalidateRoleAsync(Guid roleId, CancellationToken ct = default);
}
