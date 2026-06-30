using BaseKit.Modules.Users.Authorization;
using BaseKit.Modules.Users.Domain;
using BaseKit.Shared.Audit;
using FastEndpoints;
using FluentValidation;
using Microsoft.AspNetCore.Identity;

namespace BaseKit.Modules.Users.Endpoints.Admin;

public sealed record CreateUserRequest(
    string Email, string Password, string? DisplayName, List<string>? Roles);

/// <summary>Admin tarafından yeni kullanıcı oluşturur (rolleriyle birlikte).</summary>
public sealed class CreateUserEndpoint(
    UserManager<AppUser> userManager, RoleManager<AppRole> roleManager, IAuditLogger audit)
    : Endpoint<CreateUserRequest, UserDto>
{
    public override void Configure()
    {
        Post("/admin/users");
        Permissions(AdminPermissions.UsersManage);
    }

    public override async Task HandleAsync(CreateUserRequest req, CancellationToken ct)
    {
        if (await userManager.FindByEmailAsync(req.Email) is not null)
        {
            AddError(r => r.Email, "Bu e-posta ile bir kullanıcı zaten var.");
            await Send.ErrorsAsync(409, ct);
            return;
        }

        var desiredRoles = (req.Roles ?? []).Distinct(StringComparer.Ordinal).ToList();
        var unknown = new List<string>();
        foreach (var role in desiredRoles)
        {
            if (!await roleManager.RoleExistsAsync(role)) unknown.Add(role);
        }
        if (unknown.Count > 0)
        {
            AddError($"Tanımsız rol(ler): {string.Join(", ", unknown)}");
            await Send.ErrorsAsync(400, ct);
            return;
        }

        var user = new AppUser
        {
            Id = Guid.NewGuid(),
            UserName = req.Email,
            Email = req.Email,
            EmailConfirmed = true,
            DisplayName = string.IsNullOrWhiteSpace(req.DisplayName) ? null : req.DisplayName.Trim(),
        };

        var result = await userManager.CreateAsync(user, req.Password);
        if (!result.Succeeded)
        {
            foreach (var error in result.Errors) AddError(error.Description);
            await Send.ErrorsAsync(400, ct);
            return;
        }

        if (desiredRoles.Count > 0)
        {
            await userManager.AddToRolesAsync(user, desiredRoles);
        }

        await audit.LogAsync("user.create", "User", user.Id.ToString(), user.Email, ct);

        await Send.OkAsync(
            new UserDto(user.Id, user.Email, user.DisplayName, desiredRoles, IsActive: true), ct);
    }
}

public sealed class CreateUserRequestValidator : Validator<CreateUserRequest>
{
    public CreateUserRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().WithMessage("E-posta zorunlu.")
            .EmailAddress().WithMessage("Geçerli bir e-posta girin.");
        RuleFor(x => x.Password).NotEmpty().WithMessage("Şifre zorunlu.")
            .MinimumLength(8).WithMessage("Şifre en az 8 karakter olmalı.");
        RuleFor(x => x.DisplayName).MaximumLength(100);
    }
}
