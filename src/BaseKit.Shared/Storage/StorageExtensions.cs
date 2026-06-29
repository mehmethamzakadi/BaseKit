using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Minio;

namespace BaseKit.Shared.Storage;

public static class StorageExtensions
{
    /// <summary>MinIO tabanlı nesne deposunu kaydeder.</summary>
    public static IServiceCollection AddObjectStorage(
        this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<MinioOptions>(configuration.GetSection(MinioOptions.SectionName));

        var options = configuration.GetSection(MinioOptions.SectionName).Get<MinioOptions>()
                      ?? throw new InvalidOperationException("Minio yapılandırması bulunamadı.");

        services.AddSingleton<IMinioClient>(_ => new MinioClient()
            .WithEndpoint(options.Endpoint)
            .WithCredentials(options.AccessKey, options.SecretKey)
            .WithSSL(options.UseSSL)
            .Build());

        services.AddSingleton<IFileStorage, MinioFileStorage>();
        return services;
    }
}
