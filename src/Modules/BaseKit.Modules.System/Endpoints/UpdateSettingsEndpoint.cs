using BaseKit.Modules.System.Settings;
using BaseKit.Shared.Audit;
using FastEndpoints;
using FluentValidation.Results;

namespace BaseKit.Modules.System.Endpoints;

public sealed class UpdateSettingsRequest
{
    /// <summary>Güncellenecek ayarlar: anahtar → (string'e dönüştürülmüş) değer.</summary>
    public Dictionary<string, string> Values { get; init; } = new();
}

/// <summary>
/// Sistem ayarlarını toplu günceller. Yalnızca katalogda tanımlı anahtarlar
/// kabul edilir ve değerler tipe göre doğrulanır; hatalı değerlerde alan bazlı
/// 400 döner. Başarılı güncelleme denetim kaydına yazılır.
/// </summary>
public sealed class UpdateSettingsEndpoint(ISystemSettingsService settings, IAuditLogger audit)
    : Endpoint<UpdateSettingsRequest>
{
    public override void Configure()
    {
        Put("/system/settings");
        Permissions(SystemPermissions.SettingsManage);
    }

    public override async Task HandleAsync(UpdateSettingsRequest req, CancellationToken ct)
    {
        try
        {
            await settings.UpdateAsync(req.Values, ct);
        }
        catch (SettingsValidationException ex)
        {
            foreach (var (key, message) in ex.Errors)
            {
                ValidationFailures.Add(new ValidationFailure($"values.{key}", message));
            }
            await Send.ErrorsAsync(400, ct);
            return;
        }

        await audit.LogAsync(
            action: "system.settings.update",
            entityType: "SystemSetting",
            details: string.Join(", ", req.Values.Keys),
            ct: ct);

        await Send.NoContentAsync(ct);
    }
}
