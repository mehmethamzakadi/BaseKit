using System.Net;
using BaseKit.Modules.Users.Domain;
using BaseKit.Shared.Email;
using FastEndpoints;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Hosting;

namespace BaseKit.Modules.Users.Endpoints;

public sealed record ForgotPasswordRequest(string Email);

/// <summary>
/// Şifre sıfırlama token'ı talep eder. Güvenlik gereği, e-posta sistemde olsun
/// ya da olmasın <b>her zaman 200</b> ve aynı genel mesaj döner (kullanıcı
/// numaralandırma sızıntısını önler).
/// <para>
/// Token kullanıcıya <see cref="IEmailSender"/> ile e-posta olarak gönderilir
/// (geliştirmede log uygulaması, üretimde SMTP). Yalnızca Development ortamında
/// token yanıt gövdesinde de döner (geliştirme kolaylığı).
/// </para>
/// </summary>
public sealed class ForgotPasswordEndpoint(
    UserManager<AppUser> userManager,
    IEmailSender emailSender,
    IHostEnvironment environment)
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

        var html = $"""
            <p>Merhaba,</p>
            <p>Şifrenizi sıfırlamak için aşağıdaki sıfırlama anahtarını kullanın:</p>
            <pre>{WebUtility.HtmlEncode(token)}</pre>
            <p>Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.</p>
            """;
        await emailSender.SendAsync(user.Email!, "Şifre sıfırlama", html, ct);

        var devToken = environment.IsDevelopment() ? token : null;
        await Send.OkAsync(new ForgotPasswordResponse(genericMessage, devToken), ct);
    }
}

public sealed record ForgotPasswordResponse(string Message, string? ResetToken);
