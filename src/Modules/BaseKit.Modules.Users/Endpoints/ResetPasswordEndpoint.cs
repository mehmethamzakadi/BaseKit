using BaseKit.Modules.Users.Domain;
using FastEndpoints;
using Microsoft.AspNetCore.Identity;

namespace BaseKit.Modules.Users.Endpoints;

public sealed record ResetPasswordRequest(string Email, string Token, string NewPassword);

/// <summary>
/// <see cref="ForgotPasswordEndpoint"/> ile üretilen token'ı ve yeni şifreyi
/// alarak kullanıcının şifresini sıfırlar. Geçersiz token ya da kurallara
/// uymayan şifre 400 ile döner. E-posta/token uyuşmazlığında kullanıcı
/// numaralandırmasını önlemek için genel hata mesajı verilir.
/// </summary>
public sealed class ResetPasswordEndpoint(UserManager<AppUser> userManager)
    : Endpoint<ResetPasswordRequest, ResetPasswordResponse>
{
    public override void Configure()
    {
        Post("/auth/reset-password");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("auth"));
    }

    public override async Task HandleAsync(ResetPasswordRequest req, CancellationToken ct)
    {
        var user = await userManager.FindByEmailAsync(req.Email);
        if (user is null)
        {
            AddError("Şifre sıfırlama isteği geçersiz veya süresi dolmuş.");
            await Send.ErrorsAsync(400, ct);
            return;
        }

        var result = await userManager.ResetPasswordAsync(user, req.Token, req.NewPassword);
        if (!result.Succeeded)
        {
            foreach (var error in result.Errors)
            {
                AddError(error.Description);
            }

            await Send.ErrorsAsync(400, ct);
            return;
        }

        await Send.OkAsync(new ResetPasswordResponse("Şifreniz başarıyla güncellendi."), ct);
    }
}

public sealed record ResetPasswordResponse(string Message);
