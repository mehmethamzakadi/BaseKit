using Microsoft.EntityFrameworkCore;

namespace BaseKit.Modules.System.Persistence;

/// <summary>
/// System modülünün kendi DbContext'i. Her modül kendi şemasına ve
/// migration geçmişine sahip olur; böylece modüller veritabanı düzeyinde
/// birbirinden izole kalır (modüler monolit deseni).
/// </summary>
public sealed class SystemDbContext(DbContextOptions<SystemDbContext> options) : DbContext(options)
{
    public const string Schema = "system";

    public DbSet<SystemSetting> Settings => Set<SystemSetting>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(SystemDbContext).Assembly);
    }
}
