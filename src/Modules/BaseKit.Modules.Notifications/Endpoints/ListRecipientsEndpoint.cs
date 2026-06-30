using BaseKit.Shared.Identity;
using FastEndpoints;

namespace BaseKit.Modules.Notifications.Endpoints;

public sealed class ListRecipientsRequest
{
    /// <summary>E-posta/görünen ad araması (?search=...).</summary>
    public string? Search { get; init; }
}

public sealed record RecipientDto(Guid Id, string? Email, string? DisplayName);

/// <summary>
/// Bildirim/duyuru göndermek için aktif kullanıcıları (alıcı adayları) arar.
/// Yalnızca gönderme yetkisi olanlar erişebilir.
/// </summary>
public sealed class ListRecipientsEndpoint(IUserDirectory users)
    : Endpoint<ListRecipientsRequest, IReadOnlyList<RecipientDto>>
{
    public override void Configure()
    {
        Get("/notifications/recipients");
        Permissions(NotificationsPermissions.Send);
    }

    public override async Task HandleAsync(ListRecipientsRequest req, CancellationToken ct)
    {
        var results = await users.SearchActiveUsersAsync(req.Search, 20, ct);
        var dto = results.Select(u => new RecipientDto(u.Id, u.Email, u.DisplayName)).ToList();
        await Send.OkAsync(dto, ct);
    }
}
