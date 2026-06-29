namespace BaseKit.Shared.Storage;

public sealed class MinioOptions
{
    public const string SectionName = "Minio";

    public string Endpoint { get; init; } = default!;
    public string AccessKey { get; init; } = default!;
    public string SecretKey { get; init; } = default!;
    public string Bucket { get; init; } = "basekit";
    public bool UseSSL { get; init; }
}
