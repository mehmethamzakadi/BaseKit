using BaseKit.Shared.Settings;
using FastEndpoints;

namespace BaseKit.Modules.System.Endpoints;

/// <summary>
/// İstemcinin kimlik doğrulaması olmadan (login/register sayfaları dahil)
/// uygulayabileceği güvenli ayarlar.
/// </summary>
public sealed record PublicSettingsResponse(
    string SiteName,
    bool RegistrationEnabled,
    bool MaintenanceMode,
    int DefaultPageSize,
    string DefaultTheme);

/// <summary>
/// Herkese açık (whitelist) sistem ayarlarını döndürür. İstemci marka adı,
/// kayıt durumu, bakım modu, varsayılan tema ve sayfa boyutunu buradan uygular.
/// </summary>
public sealed class GetPublicSettingsEndpoint(ISystemSettingsReader settings)
    : EndpointWithoutRequest<PublicSettingsResponse>
{
    public override void Configure()
    {
        Get("/system/settings/public");
        AllowAnonymous();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var siteName = await settings.GetValueAsync(SettingKeys.SiteName, ct) ?? "BaseKit";
        var registrationEnabled = await settings.GetBoolAsync(SettingKeys.RegistrationEnabled, true, ct);
        var maintenanceMode = await settings.GetBoolAsync(SettingKeys.MaintenanceMode, false, ct);
        var defaultPageSize = await settings.GetIntAsync(SettingKeys.DefaultPageSize, 20, ct);
        var defaultTheme = await settings.GetValueAsync(SettingKeys.DefaultTheme, ct) ?? "system";

        await Send.OkAsync(
            new PublicSettingsResponse(
                siteName, registrationEnabled, maintenanceMode, defaultPageSize, defaultTheme),
            ct);
    }
}
