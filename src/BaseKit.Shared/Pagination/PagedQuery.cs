namespace BaseKit.Shared.Pagination;

/// <summary>
/// Liste endpoint'leri için ortak sayfalama/arama/sıralama parametreleri.
/// Endpoint istek modelleri bundan türeyerek bu alanları otomatik kazanır
/// (query string'den bağlanır: ?page=1&amp;pageSize=20&amp;search=...&amp;sort=name&amp;desc=true).
/// </summary>
public class PagedQuery
{
    /// <summary>İzin verilen en büyük sayfa boyutu (aşırı yük koruması).</summary>
    public const int MaxPageSize = 100;

    private int _page = 1;
    private int _pageSize = 20;

    /// <summary>1 tabanlı sayfa numarası (en az 1).</summary>
    public int Page
    {
        get => _page;
        set => _page = value < 1 ? 1 : value;
    }

    /// <summary>Sayfa başına kayıt (1..<see cref="MaxPageSize"/> aralığına kıstırılır).</summary>
    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = value < 1 ? 1 : value > MaxPageSize ? MaxPageSize : value;
    }

    /// <summary>Serbest metin arama terimi (opsiyonel).</summary>
    public string? Search { get; set; }

    /// <summary>Sıralanacak alan adı (endpoint tarafından yorumlanır, opsiyonel).</summary>
    public string? Sort { get; set; }

    /// <summary>Azalan sıralama mı? Varsayılan artan.</summary>
    public bool Desc { get; set; }
}
