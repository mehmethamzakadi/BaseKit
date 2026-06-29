using Microsoft.EntityFrameworkCore;

namespace BaseKit.Modules.Notes.Persistence;

public sealed class NotesDbContext(DbContextOptions<NotesDbContext> options) : DbContext(options)
{
    public const string Schema = "notes";

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(NotesDbContext).Assembly);
    }
}