using BaseKit.Modules.Users.Domain;
using FastEndpoints;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace BaseKit.Modules.Users.Endpoints;

public sealed record ForgotPasswordRequest(string Email);

/// <summary>
/// Şifre sıfırlama token'ı talep eder. Güvenlik gereği, e-posta sistemde olsun
/// ya da olmasın <b>her zaman 200</b> ve aynı genel mesaj döner (kullanıcı
/// numaralandırma sızıntısını önler).
/// <para>
/// Üretimde token kullanıcıya e-posta ile gönderilmelidir. Bu projede henüz
/// SMTP yok; bu yüzden token sunucu loguna yazılır ve <b>yalnızca Development
/// ortamında</b> yanıt gövdesinde de döndürülür (geliştirme kolaylığı).
/// </para>
/// </summary>
public sealed class ForgotPasswordEndpoint(
    UserManager<AppUser> userManager,
    IHostEnvironment environment,
    ILogger<ForgotPasswordEndpoint> logger)
    : Endpoint<ForgotPasswordRequest, ForgotPasswordResponse>
{
    public override void Configure()
    {
        Post("/auth/forgot-password");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("auth"));
    }

    public override async Task HandleAsync(ForgotPasswordRequest req, CancellationToken ct)
    {
        const string genericMessage =
            "Eğer bu e-posta kayıtlıysa, şifre sıfırlama talimatları gönderildi.";

        var user = await userManager.FindByEmailAsync(req.Email);
        if (user is null)
        {
            await Send.OkAsync(new ForgotPasswordResponse(genericMessage, null), ct);
            return;
        }

        var token = await userManager.GeneratePasswordResetTokenAsync(user);

        // TODO: Üretimde token'ı e-posta ile gönder (örn. IEmailSender).
        logger.LogInformation(
            "Şifre sıfırlama token'ı üretildi. Kullanıcı: {Email}, Token: {Token}",
            user.Email, token);

        var devToken = environment.IsDevelopment() ? token : null;
        await Send.OkAsync(new ForgotPasswordResponse(genericMessage, devToken), ct);
    }
}

public sealed record ForgotPasswordResponse(string Message, string? ResetToken);
