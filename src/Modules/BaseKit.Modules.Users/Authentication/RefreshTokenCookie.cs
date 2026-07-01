using Microsoft.AspNetCore.Http;

namespace BaseKit.Modules.Users.Authentication;

/// <summary>
/// Refresh token'ı tarayıcıya <b>httpOnly</b> cookie olarak yazar/okur/siler.
/// httpOnly olduğu için JavaScript erişemez → XSS ile token çalınamaz.
/// <para>
/// Güvenlik bayrakları isteğe göre otomatik ayarlanır: HTTPS üzerinde
/// <c>Secure + SameSite=None</c> (farklı origin'deki SPA'nın cross-site XHR ile
/// gönderebilmesi için), düz HTTP (yerel geliştirme) üzerinde
/// <c>SameSite=Lax</c>. Cookie yalnızca <c>/auth</c> yoluna gönderilir; böylece
/// diğer API çağrılarında taşınmaz.
/// </para>
/// </summary>
public static class RefreshTokenCookie
{
    public const string Name = "basekit_rt";
    private const string Path = "/auth";

    /// <summary>Refresh token'ı cookie olarak yazar (kalıcı; süresi token ile aynı).</summary>
    public static void SetRefreshTokenCookie(
        this HttpContext http,
        string rawToken,
        DateTimeOffset expiresAtUtc)
    {
        http.Response.Cookies.Append(Name, rawToken, BuildOptions(http, expiresAtUtc));
    }

    /// <summary>Refresh cookie'sini siler (logout / geçersiz token).</summary>
    public static void ClearRefreshTokenCookie(this HttpContext http)
    {
        // Silme için geçmiş tarihli; bayraklar yazımdakiyle eşleşmeli.
        http.Response.Cookies.Delete(Name, BuildOptions(http, DateTimeOffset.UnixEpoch));
    }

    /// <summary>Gelen istekteki refresh token'ı okur (yoksa null).</summary>
    public static string? ReadRefreshTokenCookie(this HttpContext http)
        => http.Request.Cookies.TryGetValue(Name, out var value) && !string.IsNullOrEmpty(value)
            ? value
            : null;

    private static CookieOptions BuildOptions(HttpContext http, DateTimeOffset expiresAtUtc)
    {
        var secure = http.Request.IsHttps;
        return new CookieOptions
        {
            HttpOnly = true,
            Secure = secure,
            SameSite = secure ? SameSiteMode.None : SameSiteMode.Lax,
            Path = Path,
            Expires = expiresAtUtc,
            IsEssential = true,
        };
    }
}
