using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace BaseKit.Modules.Notifications.Realtime;

/// <summary>
/// Bildirimler için SignalR hub'ı. Bağlanan her (kimliği doğrulanmış) kullanıcı
/// kendi kullanıcı-grubuna eklenir; sunucu yeni bildirimleri yalnızca o gruba
/// (ilgili kullanıcıya) push eder. İstemci yalnızca dinler — sunucuya çağrı yok.
/// </summary>
[Authorize]
public sealed class NotificationsHub : Hub
{
    /// <summary>Bir kullanıcıya ait SignalR grup adı.</summary>
    public static string GroupName(Guid userId) => $"user:{userId}";

    public override async Task OnConnectedAsync()
    {
        var userId = NotificationsUser.GetUserId(Context.User);
        if (userId is not null)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(userId.Value));
        }
        await base.OnConnectedAsync();
    }
}
