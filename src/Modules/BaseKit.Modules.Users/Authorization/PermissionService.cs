using BaseKit.Modules.Users.Domain;
using BaseKit.Modules.Users.Persistence;
using BaseKit.Shared.Caching;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;

namespace BaseKit.Modules.Users.Authorization;

public sealed class PermissionService(UsersDbContext db, IDistributedCache cache) : IPermissionService
{
    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(30);

    private static string RoleCacheKey(Guid roleId) => $"perm:role:{roleId}";

    public async Task<IReadOnlyCollection<string>> GetUserPermissionsAsync(
        Guid userId, CancellationToken ct = default)
    {
        var roleIds = await db.UserRoles
            .Where(ur => ur.UserId == userId)
            .Select(ur => ur.RoleId)
            .ToListAsync(ct);

        var permissions = new HashSet<string>(StringComparer.Ordinal);
        foreach (var roleId in roleIds)
        {
            permissions.UnionWith(await GetRolePermissionsAsync(roleId, ct));
        }

        return permissions;
    }

    public async Task<IReadOnlyCollection<string>> GetRolePermissionsAsync(
        Guid roleId, CancellationToken ct = default)
    {
        var list = await cache.GetOrSetAsync(
            RoleCacheKey(roleId),
            async () => await db.RolePermissions
                .Where(rp => rp.RoleId == roleId)
                .Select(rp => rp.Permission)
                .ToListAsync(ct),
            CacheTtl,
            ct);

        return list;
    }

    public async Task SetRolePermissionsAsync(
        Guid roleId, IEnumerable<string> permissions, CancellationToken ct = default)
    {
        var desired = permissions.Distinct(StringComparer.Ordinal).ToHashSet(StringComparer.Ordinal);

        var existing = await db.RolePermissions
            .Where(rp => rp.RoleId == roleId)
            .ToListAsync(ct);

        var existingNames = existing.Select(x => x.Permission).ToHashSet(StringComparer.Ordinal);

        // Kaldırılacaklar
        var toRemove = existing.Where(x => !desired.Contains(x.Permission)).ToList();
        db.RolePermissions.RemoveRange(toRemove);

        // Eklenecekler
        foreach (var permission in desired.Where(p => !existingNames.Contains(p)))
        {
            db.RolePermissions.Add(new RolePermission
            {
                Id = Guid.NewGuid(),
                RoleId = roleId,
                Permission = permission,
            });
        }

        await db.SaveChangesAsync(ct);
        await InvalidateRoleAsync(roleId, ct);
    }

    public Task InvalidateRoleAsync(Guid roleId, CancellationToken ct = default)
        => cache.RemoveAsync(RoleCacheKey(roleId), ct);
}
