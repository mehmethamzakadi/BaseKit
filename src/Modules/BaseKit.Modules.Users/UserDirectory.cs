using BaseKit.Modules.Users.Persistence;
using BaseKit.Shared.Identity;
using Microsoft.EntityFrameworkCore;

namespace BaseKit.Modules.Users;

/// <summary>
/// <see cref="IUserDirectory"/>'nin uygulaması. Aktif kullanıcı = kilitli
/// olmayan (LockoutEnd boş veya geçmiş) kullanıcı. Pasifleştirme LockoutEnd'i
/// sonsuza ayarlar (bkz. SetUserActiveEndpoint).
/// </summary>
public sealed class UserDirectory(UsersDbContext db) : IUserDirectory
{
    public async Task<IReadOnlyList<Guid>> GetActiveUserIdsAsync(CancellationToken ct = default)
    {
        var now = DateTimeOffset.UtcNow;
        return await db.Users
            .Where(u => u.LockoutEnd == null || u.LockoutEnd <= now)
            .Select(u => u.Id)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<UserSummary>> SearchActiveUsersAsync(
        string? search, int take = 20, CancellationToken ct = default)
    {
        var now = DateTimeOffset.UtcNow;
        var query = db.Users.Where(u => u.LockoutEnd == null || u.LockoutEnd <= now);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(u =>
                (u.Email != null && EF.Functions.ILike(u.Email, $"%{term}%")) ||
                (u.DisplayName != null && EF.Functions.ILike(u.DisplayName, $"%{term}%")));
        }

        return await query
            .OrderBy(u => u.Email)
            .Take(Math.Clamp(take, 1, 50))
            .Select(u => new UserSummary(u.Id, u.Email, u.DisplayName))
            .ToListAsync(ct);
    }
}
