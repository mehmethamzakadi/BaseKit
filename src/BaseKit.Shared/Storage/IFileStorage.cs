namespace BaseKit.Shared.Storage;

/// <summary>
/// Nesne deposu (object storage) soyutlaması. Varsayılan uygulaması MinIO
/// (S3 uyumlu) üzerinedir; ileride başka bir sağlayıcıya geçmek için sadece
/// bu arabirimin uygulaması değiştirilir.
/// </summary>
public interface IFileStorage
{
    Task<string> UploadAsync(
        string objectKey, Stream content, long size, string contentType, CancellationToken ct = default);

    Task<string> GetPresignedUrlAsync(
        string objectKey, int expirySeconds = 3600, CancellationToken ct = default);

    /// <summary>Nesneyi siler. Nesne yoksa sessizce başarılı sayılır (idempotent).</summary>
    Task DeleteAsync(string objectKey, CancellationToken ct = default);
}
