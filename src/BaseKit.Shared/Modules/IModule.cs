using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace BaseKit.Shared.Modules;

/// <summary>
/// Kendi kendini kaydeden uygulama modülü. Her modül; kendi servislerini,
/// EF Core yapılandırmasını ve dış entegrasyonlarını burada bağlar.
/// Endpoint'ler FastEndpoints tarafından otomatik keşfedildiği için burada
/// tanımlanmaz — bu arabirim yalnızca DI kayıtları içindir.
/// </summary>
public interface IModule
{
    /// <summary>Modülün servislerini DI konteynerine kaydeder.</summary>
    void RegisterServices(IServiceCollection services, IConfiguration configuration);
}
