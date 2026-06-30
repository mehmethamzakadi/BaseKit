namespace BaseKit.Shared.Email;

/// <summary>
/// E-posta gönderme soyutlaması. Varsayılan uygulama geliştirme için log'a
/// yazar; üretimde SMTP (MailKit) uygulamasına geçilir. Modüller yalnızca bu
/// arabirime bağımlıdır.
/// </summary>
public interface IEmailSender
{
    Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct = default);
}
