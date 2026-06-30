using BaseKit.Modules.System.Settings;
using FastEndpoints;

namespace BaseKit.Modules.System.Endpoints;

public sealed record SettingOptionDto(string Value, string Label);

public sealed record SettingItemDto(
    string Key,
    string Label,
    string? Description,
    string Type,
    string Value,
    IReadOnlyList<SettingOptionDto>? Options);

public sealed record SettingGroupDto(string Group, IReadOnlyList<SettingItemDto> Items);

/// <summary>
/// Bilinen tüm sistem ayarlarını grup grup, etkin değerleriyle ve istemcinin
/// uygun giriş alanını seçebilmesi için tip/metadata bilgisiyle döndürür.
/// </summary>
public sealed class GetSettingsEndpoint(ISystemSettingsService settings)
    : EndpointWithoutRequest<IReadOnlyList<SettingGroupDto>>
{
    public override void Configure()
    {
        Get("/system/settings");
        Permissions(SystemPermissions.SettingsView);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var values = await settings.GetEffectiveValuesAsync(ct);

        var groups = SystemSettingsCatalog.All
            .GroupBy(d => d.Group)
            .Select(g => new SettingGroupDto(
                g.Key,
                g.Select(d => new SettingItemDto(
                    d.Key,
                    d.Label,
                    d.Description,
                    d.Type.ToString().ToLowerInvariant(),
                    values.TryGetValue(d.Key, out var v) ? v : d.DefaultValue,
                    d.Options?.Select(o => new SettingOptionDto(o.Value, o.Label)).ToList()))
                    .ToList()))
            .ToList();

        await Send.OkAsync(groups, ct);
    }
}
