using BaseKit.Modules.Users.Domain;
using BaseKit.Modules.Users.Seed;
using BaseKit.Shared.Messaging;
using FastEndpoints;
using MassTransit;
using Microsoft.AspNetCore.Identity;

namespace BaseKit.Modules.Users.Endpoints;

public sealed record RegisterRequest(string Email, string Password);

public sealed record RegisterResponse(Guid Id, string Email);

public sealed class RegisterEndpoint(UserManager<AppUser> userManager, IPublishEndpoint publishEndpoint)
    : Endpoint<RegisterRequest, RegisterResponse>
{
    public override void Configure()
    {
        Post("/auth/register");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("auth"));
    }

    public override async Task HandleAsync(RegisterRequest req, CancellationToken ct)
    {
        var user = new AppUser { Id = Guid.NewGuid(), UserName = req.Email, Email = req.Email };
        var result = await userManager.CreateAsync(user, req.Password);

        if (!result.Succeeded)
        {
            foreach (var error in result.Errors)
            {
                AddError(error.Description);
            }

            await Send.ErrorsAsync(400, ct);
            return;
        }

        // Yeni kullanıcı varsayılan olarak "Standart Kullanıcı" rolünü alır
        // (temel .view yetkileri). Rol açılışta seed edilir; her zaman vardır.
        await userManager.AddToRoleAsync(user, DefaultRoles.StandardUser);

        await publishEndpoint.Publish(
            new UserRegistered(user.Id, user.Email!, DateTimeOffset.UtcNow), ct);

        await Send.OkAsync(new RegisterResponse(user.Id, user.Email!), ct);
    }
}
