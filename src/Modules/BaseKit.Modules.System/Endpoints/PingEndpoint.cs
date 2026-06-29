using FastEndpoints;

namespace BaseKit.Modules.System.Endpoints;

public sealed class PingResponse
{
    public string Status { get; init; } = "ok";
    public DateTimeOffset ServerTimeUtc { get; init; }
    public string Module { get; init; } = "System";
}

/// <summary>
/// Farklı bir assembly'de (modül içinde) tanımlanmış örnek bir REPR
/// endpoint'i. Hem cross-assembly endpoint keşfini hem de modül DI
/// kaydının (ISystemClock) çalıştığını doğrular.
/// </summary>
public sealed class PingEndpoint(ISystemClock clock) : EndpointWithoutRequest<PingResponse>
{
    public override void Configure()
    {
        Get("/system/ping");
        AllowAnonymous();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        await Send.OkAsync(new PingResponse { ServerTimeUtc = clock.UtcNow }, ct);
    }
}
