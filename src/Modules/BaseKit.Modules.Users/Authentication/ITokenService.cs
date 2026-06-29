using BaseKit.Modules.Users.Domain;

namespace BaseKit.Modules.Users.Authentication;

public readonly record struct AccessToken(string Value, DateTimeOffset ExpiresAtUtc);

public readonly record struct RefreshTokenResult(string RawValue, string Hash, DateTimeOffset ExpiresAtUtc);

public interface ITokenService
{
    AccessToken CreateAccessToken(AppUser user, IEnumerable<string> roles);
    RefreshTokenResult CreateRefreshToken();
    string Hash(string rawToken);
}
