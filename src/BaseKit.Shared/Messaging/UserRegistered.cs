namespace BaseKit.Shared.Messaging;

/// <summary>
/// Bir kullanıcı kaydolduğunda yayınlanan entegrasyon olayı. Kontratlar
/// modüller arası paylaşıldığı için Shared'da, sade POCO olarak durur.
/// </summary>
public sealed record UserRegistered(Guid UserId, string Email, DateTimeOffset OccurredAtUtc);
