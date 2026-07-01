using BaseKit.Modules.Users.Domain;
using BaseKit.Shared.Persistence;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace BaseKit.Modules.Users.Persistence;

/// <summary>
/// Users modülünün DbContext'i. ASP.NET Core Identity şemasını, refresh
/// token ve rol-yetki tablolarını 'users' şemasında barındırır.
/// </summary>
public sealed class UsersDbContext(DbContextOptions<UsersDbContext> options)
    : IdentityDbContext<AppUser, AppRole, Guid>(options)
{
    public const string Schema = "users";

    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        base.OnConfiguring(optionsBuilder);
        // Identity'nin UserManager/RoleManager.DeleteAsync izlemeli silmelerini
        // soft-delete'e çevirir.
        optionsBuilder.AddInterceptors(SoftDeleteInterceptor.Instance);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.HasDefaultSchema(Schema);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(UsersDbContext).Assembly);
        modelBuilder.ApplySoftDeleteQueryFilters();
    }
}
