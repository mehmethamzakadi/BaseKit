using BaseKit.Shared.Authorization;

namespace BaseKit.Modules.Catalog;

/// <summary>Katalog modülünün sayfa/işlem yetkileri.</summary>
public static class CatalogPermissions
{
    public const string View = "catalog.view";
    public const string ProductsCreate = "catalog.products.create";
    public const string ProductsUpdate = "catalog.products.update";
    public const string ProductsDelete = "catalog.products.delete";
}

public sealed class CatalogPermissionProvider : IPermissionProvider
{
    private const string Group = "Katalog";

    public IReadOnlyList<PermissionDefinition> GetPermissions() =>
    [
        new(CatalogPermissions.View, "Katalog sayfasını görüntüle", Group),
        new(CatalogPermissions.ProductsCreate, "Ürün oluştur", Group),
        new(CatalogPermissions.ProductsUpdate, "Ürün güncelle", Group),
        new(CatalogPermissions.ProductsDelete, "Ürün sil", Group),
    ];
}
