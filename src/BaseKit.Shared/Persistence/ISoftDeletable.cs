namespace BaseKit.Shared.Persistence;

/// <summary>
/// Soft-delete (mantıksal silme) destekleyen varlıklar. Bu arayüzü uygulayan
/// tipler gerçek DELETE yerine <see cref="IsDeleted"/> = true olarak işaretlenir
/// ve global sorgu filtresiyle normal sorgulardan gizlenir.
/// </summary>
public interface ISoftDeletable
{
    /// <summary>Kayıt mantıksal olarak silindi mi?</summary>
    bool IsDeleted { get; set; }

    /// <summary>Silinme zamanı (UTC); silinmemişse null.</summary>
    DateTimeOffset? DeletedAtUtc { get; set; }
}
