using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace BaseKit.Shared.Persistence;

/// <summary>
/// Change-tracker üzerinden silinen (<see cref="EntityState.Deleted"/>)
/// <see cref="ISoftDeletable"/> varlıkları gerçek silme yerine
/// <c>IsDeleted = true</c> olarak işaretler. Böylece Identity'nin
/// <c>UserManager/RoleManager.DeleteAsync</c> gibi izlemeli silmeleri otomatik
/// olarak soft-delete'e dönüşür.
///
/// Not: Küme tabanlı <c>ExecuteDeleteAsync</c> change-tracker'ı atladığından bu
/// interceptor tarafından yakalanmaz; bu tür silmeler <c>ExecuteUpdateAsync</c>
/// ile soft-delete yazacak şekilde uyarlanmalıdır.
/// </summary>
public sealed class SoftDeleteInterceptor : SaveChangesInterceptor
{
    /// <summary>Durumsuz olduğundan paylaşılan tek örnek kullanılabilir.</summary>
    public static readonly SoftDeleteInterceptor Instance = new();

    public override InterceptionResult<int> SavingChanges(
        DbContextEventData eventData, InterceptionResult<int> result)
    {
        ApplySoftDelete(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        ApplySoftDelete(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private static void ApplySoftDelete(DbContext? context)
    {
        if (context is null)
        {
            return;
        }

        foreach (var entry in context.ChangeTracker.Entries<ISoftDeletable>())
        {
            if (entry.State != EntityState.Deleted)
            {
                continue;
            }

            entry.State = EntityState.Modified;
            entry.Entity.IsDeleted = true;
            entry.Entity.DeletedAtUtc = DateTimeOffset.UtcNow;
        }
    }
}
