using System.Security.Claims;
using BaseKit.Modules.Users.Domain;
using BaseKit.Modules.Users.Persistence;
using BaseKit.Shared.Audit;
using Microsoft.AspNetCore.Http;
using Microsoft.IdentityModel.JsonWebTokens;

namespace BaseKit.Modules.Users.Audit;

/// <summary>
/// <see cref="IAuditLogger"/>'ın veritabanı uygulaması. Geçerli kullanıcı ve IP
/// bilgisini <see cref="IHttpContextAccessor"/> üzerinden çözer.
/// </summary>
public sealed class AuditLogger(UsersDbContext db, IHttpContextAccessor httpContextAccessor)
    : IAuditLogger
{
    public async Task LogAsync(
        string action,
        string? entityType = null,
        string? entityId = null,
        string? details = null,
        CancellationToken ct = default)
    {
        var httpContext = httpContextAccessor.HttpContext;
        var user = httpContext?.User;

        Guid? userId = null;
        var idValue = user?.FindFirstValue(JwtRegisteredClaimNames.Sub)
                      ?? user?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (Guid.TryParse(idValue, out var parsed)) userId = parsed;

        var email = user?.FindFirstValue(JwtRegisteredClaimNames.Email)
                    ?? user?.FindFirstValue(ClaimTypes.Email);

        db.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            UserEmail = email,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            Details = details,
            IpAddress = httpContext?.Connection.RemoteIpAddress?.ToString(),
            CreatedAtUtc = DateTimeOffset.UtcNow,
        });
        await db.SaveChangesAsync(ct);
    }
}
