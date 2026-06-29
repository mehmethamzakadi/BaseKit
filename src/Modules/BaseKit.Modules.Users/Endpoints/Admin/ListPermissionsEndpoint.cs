using BaseKit.Modules.Users.Authorization;
using BaseKit.Shared.Authorization;
using FastEndpoints;

namespace BaseKit.Modules.Users.Endpoints.Admin;

public sealed record PermissionItemDto(string Name, string DisplayName);
public sealed record PermissionGroupDto(string Group, IReadOnlyList<PermissionItemDto> Items);

/// <summary>Atanabilir tüm yetkileri (sayfa/işlem) gruplu olarak listeler.</summary>
public sealed class ListPermissionsEndpoint(IEnumerable<IPermissionProvider> providers)
    : EndpointWithoutRequest<IReadOnlyList<PermissionGroupDto>>
{
    public override void Configure()
    {
        Get("/admin/permissions");
        Permissions(AdminPermissions.RolesManage);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var groups = providers
            .SelectMany(p => p.GetPermissions())
            .GroupBy(d => d.Group)
            .Select(g => new PermissionGroupDto(
                g.Key,
                g.Select(d => new PermissionItemDto(d.Name, d.DisplayName)).ToList()))
            .ToList();

        await Send.OkAsync(groups, ct);
    }
}
