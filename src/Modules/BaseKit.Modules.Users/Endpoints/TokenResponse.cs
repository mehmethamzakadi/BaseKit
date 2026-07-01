namespace BaseKit.Modules.Users.Endpoints;

/// <summary>
/// Kimlik uçlarının yanıt gövdesi. Yalnızca kısa ömürlü <b>access token</b>
/// döner; <b>refresh token</b> güvenlik için httpOnly cookie ile taşınır
/// (bkz. <see cref="Authentication.RefreshTokenCookie"/>) ve gövdede yer almaz.
/// </summary>
public sealed record TokenResponse(
    string AccessToken,
    DateTimeOffset AccessTokenExpiresAtUtc);
