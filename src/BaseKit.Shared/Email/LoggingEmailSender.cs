using Microsoft.Extensions.Logging;

namespace BaseKit.Shared.Email;

/// <summary>
/// Geliştirme uygulaması: e-postayı göndermek yerine log'a yazar. SMTP
/// kurulumu olmadan akışların (şifre sıfırlama vb.) test edilmesini sağlar.
/// </summary>
public sealed class LoggingEmailSender(ILogger<LoggingEmailSender> logger) : IEmailSender
{
    public Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct = default)
    {
        logger.LogInformation(
            "E-POSTA (log modu) → Alıcı: {To} | Konu: {Subject}\n{Body}",
            to, subject, htmlBody);
        return Task.CompletedTask;
    }
}
