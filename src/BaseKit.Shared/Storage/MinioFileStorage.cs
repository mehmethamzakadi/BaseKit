using Microsoft.Extensions.Options;
using Minio;
using Minio.DataModel.Args;

namespace BaseKit.Shared.Storage;

public sealed class MinioFileStorage(IMinioClient client, IOptions<MinioOptions> options) : IFileStorage
{
    private readonly MinioOptions _options = options.Value;

    public async Task<string> UploadAsync(
        string objectKey, Stream content, long size, string contentType, CancellationToken ct = default)
    {
        await EnsureBucketAsync(ct);

        await client.PutObjectAsync(
            new PutObjectArgs()
                .WithBucket(_options.Bucket)
                .WithObject(objectKey)
                .WithStreamData(content)
                .WithObjectSize(size)
                .WithContentType(contentType),
            ct);

        return objectKey;
    }

    public Task<string> GetPresignedUrlAsync(
        string objectKey, int expirySeconds = 3600, CancellationToken ct = default)
        => client.PresignedGetObjectAsync(
            new PresignedGetObjectArgs()
                .WithBucket(_options.Bucket)
                .WithObject(objectKey)
                .WithExpiry(expirySeconds));

    public Task DeleteAsync(string objectKey, CancellationToken ct = default)
        => client.RemoveObjectAsync(
            new RemoveObjectArgs()
                .WithBucket(_options.Bucket)
                .WithObject(objectKey),
            ct);

    private async Task EnsureBucketAsync(CancellationToken ct)
    {
        var exists = await client.BucketExistsAsync(
            new BucketExistsArgs().WithBucket(_options.Bucket), ct);

        if (!exists)
        {
            await client.MakeBucketAsync(
                new MakeBucketArgs().WithBucket(_options.Bucket), ct);
        }
    }
}
