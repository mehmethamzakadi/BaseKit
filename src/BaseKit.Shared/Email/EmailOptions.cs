namespace BaseKit.Shared.Email;

public sealed class EmailOptions
{
    public const string SectionName = "Email";

    /// <summary>"Logging" (varsayılan, geliştirme) veya "Smtp".</summary>
    public string Provider { get; init; } = "Logging";

    /// <summary>Gönderen adresi (From).</summary>
    public string FromAddress { get; init; } = "no-reply@basekit.local";
    public string FromName { get; init; } = "BaseKit";

    // SMTP ayarları (Provider = "Smtp" olduğunda kullanılır).
    public string Host { get; init; } = "localhost";
    public int Port { get; init; } = 1025;
    public bool UseSsl { get; init; }
    public string? Username { get; init; }
    public string? Password { get; init; }
}
