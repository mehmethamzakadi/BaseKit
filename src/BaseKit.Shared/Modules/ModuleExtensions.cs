using System.Reflection;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace BaseKit.Shared.Modules;

/// <summary>
/// Modül keşif ve kayıt yardımcıları. Verilen assembly'lerdeki tüm
/// <see cref="IModule"/> uygulamalarını bulur ve servislerini kaydeder.
/// </summary>
public static class ModuleExtensions
{
    /// <summary>
    /// Belirtilen assembly'lerdeki tüm modülleri keşfeder ve kaydeder.
    /// Yeni bir modül eklemek için modülün assembly'sini çağıran tarafta
    /// (Program.cs içindeki listeye) eklemek yeterlidir.
    /// </summary>
    public static IServiceCollection AddModules(
        this IServiceCollection services,
        IConfiguration configuration,
        params Assembly[] assemblies)
    {
        var moduleTypes = assemblies
            .SelectMany(assembly => assembly.GetTypes())
            .Where(type => typeof(IModule).IsAssignableFrom(type)
                           && type is { IsInterface: false, IsAbstract: false })
            .Distinct();

        foreach (var moduleType in moduleTypes)
        {
            var module = (IModule)Activator.CreateInstance(moduleType)!;
            module.RegisterServices(services, configuration);
        }

        return services;
    }
}
