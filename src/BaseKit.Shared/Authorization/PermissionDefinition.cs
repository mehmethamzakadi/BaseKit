namespace BaseKit.Shared.Authorization;

/// <summary>
/// Tek bir yetkinin tanımı. <paramref name="Name"/> kod/claim'lerde kullanılan
/// teknik ad (ör. "catalog.products.create"), <paramref name="DisplayName"/>
/// arayüzde gösterilen ad, <paramref name="Group"/> ise sayfa/modül grubudur.
/// </summary>
public sealed record PermissionDefinition(string Name, string DisplayName, string Group);

/// <summary>
/// Her modül kendi yetkilerini bu arabirimi uygulayarak bildirir. Yetki
/// kataloğu tüm sağlayıcıları birleştirir; böylece yeni modül eklemek için
/// merkezi bir listeyi düzenlemek gerekmez.
/// </summary>
public interface IPermissionProvider
{
    IReadOnlyList<PermissionDefinition> GetPermissions();
}
