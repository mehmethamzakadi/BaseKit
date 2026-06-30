namespace BaseKit.Shared.Pagination;

/// <summary>
/// Sayfalı liste yanıtı. Veri (<paramref name="Items"/>) ile birlikte istemcinin
/// sayfalama kontrolü için ihtiyaç duyduğu meta bilgileri taşır.
/// </summary>
public sealed record PagedResult<T>(
    IReadOnlyList<T> Items,
    int Page,
    int PageSize,
    int TotalCount)
{
    /// <summary>Toplam sayfa sayısı (en az 1).</summary>
    public int TotalPages => PageSize > 0
        ? (int)Math.Ceiling(TotalCount / (double)PageSize)
        : 0;

    public bool HasPrevious => Page > 1;
    public bool HasNext => Page < TotalPages;
}
