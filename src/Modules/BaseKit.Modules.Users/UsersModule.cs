using System.Text;
using BaseKit.Modules.Users.Authentication;
using BaseKit.Modules.Users.Authorization;
using BaseKit.Modules.Users.Domain;
using BaseKit.Modules.Users.Persistence;
using BaseKit.Modules.Users.Seed;
using BaseKit.Modules.Users.Audit;
using BaseKit.Shared.Audit;
using BaseKit.Shared.Authorization;
using BaseKit.Shared.Dashboard;
using BaseKit.Shared.Identity;
using BaseKit.Shared.Modules;
using BaseKit.Shared.Persistence;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace BaseKit.Modules.Users;

/// <summary>
/// Kullanıcı yönetimi modülü: ASP.NET Core Identity + JWT access token +
/// rotasyonlu refresh token. Kimlik doğrulama şemasını da kendi içinde kurar.
/// </summary>
public sealed class UsersModule : IModule
{
    public void RegisterServices(IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Postgres");
        services.AddModuleDbContext<UsersDbContext>(options =>
            options.UseNpgsql(connectionString, npgsql =>
                npgsql.MigrationsHistoryTable("__ef_migrations_history", UsersDbContext.Schema)));

        services
            .AddIdentityCore<AppUser>(options =>
            {
                options.Password.RequiredLength = 8;
                options.User.RequireUniqueEmail = true;

                // Hesap kilitleme: 5 başarısız denemeden sonra 5 dakika kilit.
                options.Lockout.AllowedForNewUsers = true;
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
            })
            .AddRoles<AppRole>()
            .AddEntityFrameworkStores<UsersDbContext>()
            .AddDefaultTokenProviders(); // şifre sıfırlama / e-posta onay token'ları için

        services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));
        services.Configure<AdminSeedOptions>(configuration.GetSection(AdminSeedOptions.SectionName));
        services.AddScoped<ITokenService, TokenService>();

        // Rol/yetki yönetimi (RBAC).
        services.AddScoped<IPermissionService, PermissionService>();
        services.AddScoped<IClaimsTransformation, PermissionClaimsTransformation>();
        services.AddSingleton<IPermissionProvider, AdminPermissionProvider>();
        services.AddScoped<IDashboardStatProvider, UsersStatProvider>();

        // Modüller arası kullanıcı dizini (ör. Notifications duyuru gönderirken).
        services.AddScoped<IUserDirectory, UserDirectory>();

        // Denetim kaydı (audit) — geçerli kullanıcı/IP için HttpContext erişimi.
        services.AddHttpContextAccessor();
        services.AddScoped<IAuditLogger, AuditLogger>();

        var jwt = configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>()
                  ?? throw new InvalidOperationException("Jwt yapılandırması bulunamadı.");

        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwt.Issuer,
                    ValidAudience = jwt.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.SigningKey)),
                    ClockSkew = TimeSpan.FromSeconds(30),
                };

                // SignalR WebSocket'lerinde tarayıcı Authorization başlığı gönderemez;
                // token'ı query string'den (?access_token=...) okuyup /hubs uçlarında kabul et.
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["access_token"];
                        var path = context.HttpContext.Request.Path;
                        if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                        {
                            context.Token = accessToken;
                        }
                        return Task.CompletedTask;
                    },
                };
            });

        services.AddAuthorization();
    }
}
