using BaseKit.Modules.Users.Authorization;
using BaseKit.Shared.Dashboard;
using FastEndpoints;

namespace BaseKit.Modules.Users.Endpoints.Admin;

public sealed record StatItemDto(string Key, string Label, long Value, string Icon);

/// <summary>
/// Dashboard özet istatistiklerini tüm modüllerin <see cref="IDashboardStatProvider"/>
/// sağlayıcılarından toplayarak döner.
/// </summary>
public sealed class StatsEndpoint(IEnumerable<IDashboardStatProvider> providers)
    : EndpointWithoutRequest<IReadOnlyList<StatItemDto>>
{
    public override void Configure()
    {
        Get("/admin/stats");
        Permissions(AdminPermissions.View);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var stats = new List<StatItemDto>();
        foreach (var provider in providers)
        {
            foreach (var stat in await provider.GetStatsAsync(ct))
            {
                stats.Add(new StatItemDto(stat.Key, stat.Label, stat.Value, stat.Icon));
            }
        }

        await Send.OkAsync(stats, ct);
    }
}
