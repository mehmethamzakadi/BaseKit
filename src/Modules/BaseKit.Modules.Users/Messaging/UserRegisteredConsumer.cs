using BaseKit.Shared.Messaging;
using MassTransit;
using Microsoft.Extensions.Logging;

namespace BaseKit.Modules.Users.Messaging;

/// <summary>
/// UserRegistered olayını işleyen örnek consumer. Gerçek bir projede burada
/// hoş geldin e-postası gönderme, varsayılan ayar oluşturma gibi işler yapılır.
/// </summary>
public sealed class UserRegisteredConsumer(ILogger<UserRegisteredConsumer> logger)
    : IConsumer<UserRegistered>
{
    public Task Consume(ConsumeContext<UserRegistered> context)
    {
        var message = context.Message;
        logger.LogInformation(
            "UserRegistered tüketildi: UserId={UserId}, Email={Email}",
            message.UserId, message.Email);
        return Task.CompletedTask;
    }
}
