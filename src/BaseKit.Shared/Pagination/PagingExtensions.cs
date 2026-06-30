using Microsoft.EntityFrameworkCore;

namespace BaseKit.Shared.Pagination;

/// <summary>
/// <see cref="IQueryable{T}"/> için sayfalama yardımcıları. Toplam sayıyı ve
/// istenen sayfayı tek noktadan, tutarlı biçimde üretir.
/// </summary>
public static class PagingExtensions
{
    /// <summary>
    /// Sorguyu verilen sayfaya göre çalıştırır; toplam kayıt sayısıyla birlikte
    /// <see cref="PagedResult{T}"/> döner. Sıralama/filtreleme bu çağrıdan ÖNCE
    /// uygulanmalıdır.
    /// </summary>
    public static async Task<PagedResult<T>> ToPagedResultAsync<T>(
        this IQueryable<T> source,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        var totalCount = await source.CountAsync(ct);

        var items = await source
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PagedResult<T>(items, page, pageSize, totalCount);
    }

    /// <summary>
    /// Projeksiyon (Select) sonrası kullanım için kısa yol: <see cref="PagedQuery"/>
    /// içindeki sayfa bilgisini kullanır.
    /// </summary>
    public static Task<PagedResult<T>> ToPagedResultAsync<T>(
        this IQueryable<T> source,
        PagedQuery query,
        CancellationToken ct = default)
        => source.ToPagedResultAsync(query.Page, query.PageSize, ct);
}
