using BaseKit.Modules.Users.Authorization;
using BaseKit.Modules.Users.Domain;
using BaseKit.Shared.Audit;
using FastEndpoints;
using FluentValidation;
using Microsoft.AspNetCore.Identity;

namespace BaseKit.Modules.Users.Endpoints.Admin;

public sealed class AdminResetPasswordRequest
{
    public Guid Id { get; set; }
    public string NewPassword { get; set; } = default!;
}

public sealed record AdminResetPasswordResponse(string Message);

/// <summary>Yönetici, kullanıcının şifresini doğrudan sıfırlar (mevcut şifre gerekmez).</summary>
public sealed class AdminResetPasswordEndpoint(UserManager<AppUser> userManager, IAuditLogger audit)
    : Endpoint<AdminResetPasswordRequest, AdminResetPasswordResponse>
{
    public override void Configure()
    {
        Post("/admin/users/{id}/reset-password");
        Permissions(AdminPermissions.UsersManage);
    }

    public override async Task HandleAsync(AdminResetPasswordRequest req, CancellationToken ct)
    {
        var user = await userManager.FindByIdAsync(req.Id.ToString());
        if (user is null)
        {
            await Send.NotFoundAsync(ct);
            return;
        }

        var token = await userManager.GeneratePasswordResetTokenAsync(user);
        var result = await userManager.ResetPasswordAsync(user, token, req.NewPassword);
        if (!result.Succeeded)
        {
            foreach (var error in result.Errors) AddError(error.Description);
            await Send.ErrorsAsync(400, ct);
            return;
        }

        await audit.LogAsync("user.reset_password", "User", user.Id.ToString(), user.Email, ct);

        await Send.OkAsync(new AdminResetPasswordResponse("Kullanıcının şifresi güncellendi."), ct);
    }
}

public sealed class AdminResetPasswordRequestValidator : Validator<AdminResetPasswordRequest>
{
    public AdminResetPasswordRequestValidator()
    {
        RuleFor(x => x.NewPassword).NotEmpty().WithMessage("Yeni şifre zorunlu.")
            .MinimumLength(8).WithMessage("Yeni şifre en az 8 karakter olmalı.");
    }
}
