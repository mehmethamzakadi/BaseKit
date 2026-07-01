using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;

namespace BaseKit.Shared.Persistence;

public static class SoftDeleteModelBuilderExtensions
{
    /// <summary>
    /// <see cref="ISoftDeletable"/> uygulayan tüm varlıklara
    /// <c>e =&gt; !e.IsDeleted</c> global sorgu filtresi ekler. Böylece soft-silinmiş
    /// kayıtlar normal sorgulardan otomatik dışlanır (gerekirse
    /// <c>IgnoreQueryFilters()</c> ile aşılabilir). Modül DbContext'lerinin
    /// <c>OnModelCreating</c> sonunda çağrılır.
    /// </summary>
    public static void ApplySoftDeleteQueryFilters(this ModelBuilder modelBuilder)
    {
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (!typeof(ISoftDeletable).IsAssignableFrom(entityType.ClrType))
            {
                continue;
            }

            var parameter = Expression.Parameter(entityType.ClrType, "e");
            var propertyAccess = Expression.Property(parameter, nameof(ISoftDeletable.IsDeleted));
            var filter = Expression.Lambda(Expression.Not(propertyAccess), parameter);

            modelBuilder.Entity(entityType.ClrType).HasQueryFilter(filter);
        }
    }
}
