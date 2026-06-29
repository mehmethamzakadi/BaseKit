using BaseKit.Modules.Users.Authorization;
using BaseKit.Modules.Users.Domain;
using BaseKit.Shared.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace BaseKit.Modules.Users.Seed;

/// <summary>
/// Başlangıçta varsayılan rolleri, yetkilerini ve config'ten okunan admin
/// kullanıcısını oluşturur. İdempotenttir (tekrar tekrar çalıştırılabilir).
/// </summary>
public static class UsersSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider, CancellationToken ct = default)
    {
        using var scope = serviceProvider.CreateScope();
        var sp = scope.ServiceProvider;

        var roleManager = sp.GetRequiredService<RoleManager<AppRole>>();
        var userManager = sp.GetRequiredService<UserManager<AppUser>>();
        var permissionService = sp.GetRequiredService<IPermissionService>();
        var seedOptions = sp.GetRequiredService<IOptions<AdminSeedOptions>>().Value;
        var logger = sp.GetRequiredService<ILoggerFactory>().CreateLogger("UsersSeeder");

        var allPermissions = sp.GetServices<IPermissionProvider>()
            .SelectMany(p => p.GetPermissions())
            .Select(d => d.Name)
            .Distinct(StringComparer.Ordinal)
            .ToList();

        // Sistem Yöneticisi: her zaman TÜM yetkilere sahip (yeni modüllerin
        // yetkileri dahil otomatik senkronlanır).
        var (adminRole, _) = await EnsureRoleAsync(
            roleManager, DefaultRoles.SystemAdministrator, "Tüm yetkilere sahip yönetici rolü");
        await permissionService.SetRolePermissionsAsync(adminRole.Id, allPermissions, ct);

        // Standart Kullanıcı: yalnızca ilk oluşturulduğunda örnek yetkilerle
        // doldurulur (sonradan admin tarafından düzenlenebilir).
        var (standardRole, standardCreated) = await EnsureRoleAsync(
            roleManager, DefaultRoles.StandardUser, "Temel sayfa görüntüleme yetkilerine sahip standart rol");
        if (standardCreated)
        {
            var defaultViewPermissions = allPermissions
                .Where(p => p.EndsWith(".view", StringComparison.Ordinal)
                            && !p.StartsWith("admin.", StringComparison.Ordinal))
                .ToList();
            await permissionService.SetRolePermissionsAsync(standardRole.Id, defaultViewPermissions, ct);
        }

        // Config'ten admin kullanıcı.
        var admin = await userManager.FindByEmailAsync(seedOptions.AdminEmail);
        if (admin is null)
        {
            admin = new AppUser
            {
                Id = Guid.NewGuid(),
                UserName = seedOptions.AdminEmail,
                Email = seedOptions.AdminEmail,
                EmailConfirmed = true,
            };
            var result = await userManager.CreateAsync(admin, seedOptions.AdminPassword);
            if (!result.Succeeded)
            {
                logger.LogError("Admin kullanıcı oluşturulamadı: {Errors}",
                    string.Join("; ", result.Errors.Select(e => e.Description)));
                return;
            }

            logger.LogWarning(
                "Varsayılan admin kullanıcı oluşturuldu ({Email}). Üretimde parolayı MUTLAKA değiştirin.",
                seedOptions.AdminEmail);
        }

        if (!await userManager.IsInRoleAsync(admin, DefaultRoles.SystemAdministrator))
        {
            await userManager.AddToRoleAsync(admin, DefaultRoles.SystemAdministrator);
        }
    }

    private static async Task<(AppRole Role, bool Created)> EnsureRoleAsync(
        RoleManager<AppRole> roleManager, string name, string description)
    {
        var role = await roleManager.FindByNameAsync(name);
        if (role is not null)
        {
            return (role, false);
        }

        role = new AppRole(name) { Description = description };
        await roleManager.CreateAsync(role);
        return (role, true);
    }
}
