using Microsoft.EntityFrameworkCore;

namespace BaseKit.Shared.Persistence;

/// <summary>
/// Modüllerin kaydettiği DbContext tiplerini tutar. Başlangıçta otomatik
/// migration uygulamak için kullanılır; böylece her modül kendi context'ini
/// bildirir, host tarafı hepsini tek noktadan migrate eder.
/// </summary>
public sealed class ModuleDbContextRegistry
{
    private readonly HashSet<Type> _contextTypes = [];

    public IReadOnlyCollection<Type> ContextTypes => _contextTypes;

    public void Register<TContext>() where TContext : DbContext => _contextTypes.Add(typeof(TContext));
}
