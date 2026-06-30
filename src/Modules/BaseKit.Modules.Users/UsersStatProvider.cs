using BaseKit.Modules.Users.Persistence;
using BaseKit.Shared.Dashboard;
using Microsoft.EntityFrameworkCore;

namespace BaseKit.Modules.Users;

/// <summary>Users modülünün dashboard istatistikleri (kullanıcı/aktif/rol sayıları).</summary>
public sealed class UsersStatProvider(UsersDbContext db) : IDashboardStatProvider
{
    public async Task<IReadOnlyList<DashboardStat>> GetStatsAsync(CancellationToken ct = default)
    {
        var now = DateTimeOffset.UtcNow;
        var totalUsers = await db.Users.CountAsync(ct);
        var activeUsers = await db.Users.CountAsync(u => u.LockoutEnd == null || u.LockoutEnd <= now, ct);
        var roleCount = await db.Roles.CountAsync(ct);

        return
        [
            new DashboardStat("users.total", "Kullanıcı", totalUsers, "users"),
            new DashboardStat("users.active", "Aktif kullanıcı", activeUsers, "user-check"),
            new DashboardStat("users.roles", "Rol", roleCount, "shield"),
        ];
    }
}
