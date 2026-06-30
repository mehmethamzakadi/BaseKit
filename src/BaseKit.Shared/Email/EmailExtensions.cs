using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace BaseKit.Shared.Email;

public static class EmailExtensions
{
    /// <summary>
    /// E-posta gönderici kaydeder. <c>Email:Provider</c> "Smtp" ise MailKit
    /// tabanlı SMTP, aksi halde (varsayılan) geliştirme için log uygulaması.
    /// </summary>
    public static IServiceCollection AddEmailSender(
        this IServiceCollection services, IConfiguration configuration)
    {
        var section = configuration.GetSection(EmailOptions.SectionName);
        services.Configure<EmailOptions>(section);

        var provider = section.GetValue<string>("Provider") ?? "Logging";
        if (string.Equals(provider, "Smtp", StringComparison.OrdinalIgnoreCase))
        {
            services.AddSingleton<IEmailSender, SmtpEmailSender>();
        }
        else
        {
            services.AddSingleton<IEmailSender, LoggingEmailSender>();
        }

        return services;
    }
}
