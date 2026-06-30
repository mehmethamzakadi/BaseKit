using BaseKit.Modules.Users.Endpoints.Admin;
using BaseKit.Modules.Users.Endpoints.Profile;
using FastEndpoints;
using FluentValidation;

namespace BaseKit.Modules.Users.Endpoints;

// FastEndpoints, modül assembly'lerindeki Validator<TRequest> sınıflarını otomatik
// keşfeder ve ilgili endpoint'e bağlar. Doğrulama hataları RFC7807 ProblemDetails
// (400) olarak döner.

public sealed class LoginRequestValidator : Validator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().WithMessage("E-posta zorunlu.")
            .EmailAddress().WithMessage("Geçerli bir e-posta girin.");
        RuleFor(x => x.Password).NotEmpty().WithMessage("Şifre zorunlu.");
    }
}

public sealed class RegisterRequestValidator : Validator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().WithMessage("E-posta zorunlu.")
            .EmailAddress().WithMessage("Geçerli bir e-posta girin.");
        RuleFor(x => x.Password).NotEmpty().WithMessage("Şifre zorunlu.")
            .MinimumLength(8).WithMessage("Şifre en az 8 karakter olmalı.");
    }
}

public sealed class ForgotPasswordRequestValidator : Validator<ForgotPasswordRequest>
{
    public ForgotPasswordRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().WithMessage("E-posta zorunlu.")
            .EmailAddress().WithMessage("Geçerli bir e-posta girin.");
    }
}

public sealed class ResetPasswordRequestValidator : Validator<ResetPasswordRequest>
{
    public ResetPasswordRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().WithMessage("Geçerli bir e-posta girin.");
        RuleFor(x => x.Token).NotEmpty().WithMessage("Sıfırlama anahtarı zorunlu.");
        RuleFor(x => x.NewPassword).NotEmpty().WithMessage("Yeni şifre zorunlu.")
            .MinimumLength(8).WithMessage("Yeni şifre en az 8 karakter olmalı.");
    }
}

public sealed class CreateRoleRequestValidator : Validator<CreateRoleRequest>
{
    public CreateRoleRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("Rol adı zorunlu.")
            .MaximumLength(256).WithMessage("Rol adı en fazla 256 karakter olabilir.");
        RuleFor(x => x.Description).MaximumLength(512);
    }
}

public sealed class UpdateRoleRequestValidator : Validator<UpdateRoleRequest>
{
    public UpdateRoleRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("Rol adı zorunlu.")
            .MaximumLength(256).WithMessage("Rol adı en fazla 256 karakter olabilir.");
        RuleFor(x => x.Description).MaximumLength(512);
    }
}

public sealed class ChangePasswordRequestValidator : Validator<ChangePasswordRequest>
{
    public ChangePasswordRequestValidator()
    {
        RuleFor(x => x.CurrentPassword).NotEmpty().WithMessage("Mevcut şifre zorunlu.");
        RuleFor(x => x.NewPassword).NotEmpty().WithMessage("Yeni şifre zorunlu.")
            .MinimumLength(8).WithMessage("Yeni şifre en az 8 karakter olmalı.")
            .NotEqual(x => x.CurrentPassword).WithMessage("Yeni şifre mevcut şifreyle aynı olamaz.");
    }
}

public sealed class UpdateProfileRequestValidator : Validator<UpdateProfileRequest>
{
    public UpdateProfileRequestValidator()
    {
        RuleFor(x => x.DisplayName).MaximumLength(100)
            .WithMessage("Görünen ad en fazla 100 karakter olabilir.");
    }
}
