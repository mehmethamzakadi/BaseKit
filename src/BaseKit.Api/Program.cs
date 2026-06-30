using BaseKit.Modules.Catalog;
using BaseKit.Modules.System;
using BaseKit.Modules.Users;
using BaseKit.Modules.Users.Authorization;
using BaseKit.Modules.Users.Seed;
using BaseKit.Shared.Modules;
using BaseKit.Shared.Persistence;
using System.Threading.RateLimiting;
using BaseKit.Shared.Storage;
using FastEndpoints;
using FastEndpoints.Swagger;
using MassTransit;
using Microsoft.AspNetCore.RateLimiting;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Yapılandırılmış loglama: Serilog. Yapılandırma appsettings'ten okunur;
// LogContext zenginleştirmesi ile her log satırı request bağlamını taşır.
builder.Host.UseSerilog((context, services, configuration) => configuration
    .ReadFrom.Configuration(context.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext()
    .WriteTo.Console());

// === Modül kayıt noktası ===
// Yeni bir modül eklemek için tek yapılması gereken: modülün marker tipini
// (IModule uygulaması) aşağıdaki listeye eklemek. Hem DI kayıtları hem de
// FastEndpoints endpoint keşfi bu assembly listesi üzerinden yürür.
var moduleAssemblies = new[]
{
    typeof(SystemModule).Assembly,
    typeof(UsersModule).Assembly,
    typeof(CatalogModule).Assembly,
    // >>> SCAFFOLD:MODULES <<< (bu satırı silmeyin; new-module.ps1 buraya ekler)
};

builder.Services.AddModules(builder.Configuration, moduleAssemblies);
builder.Services.AddFastEndpoints(options => options.Assemblies = moduleAssemblies);

// İşlenmeyen istisnalar için RFC7807 ProblemDetails üretimi (UseExceptionHandler ile).
builder.Services.AddProblemDetails();

// Rate limiting: kimlik uçlarında (login/register/forgot/reset) IP başına sabit
// pencere — brute-force ve kötüye kullanımı sınırlar. Aşımda 429 döner.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("auth", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
            }));
});

// API dokümantasyonu: FastEndpoints + NSwag. Swagger UI /swagger adresinde sunulur.
// JWT bearer auth tanımı eklenir; UI'dan "Authorize" ile token girilebilir.
builder.Services.SwaggerDocument(o =>
{
    o.EnableJWTBearerAuth = true;
    o.DocumentSettings = s =>
    {
        s.Title = "BaseKit API";
        s.Version = "v1";
        s.Description = "Modüler monolit starter — REPR endpoint'leri, RBAC, JWT.";
    };
});

// Cross-cutting altyapı: Redis dağıtık cache + MinIO nesne deposu.
builder.Services.AddStackExchangeRedisCache(options =>
    options.Configuration = builder.Configuration.GetConnectionString("Redis"));
builder.Services.AddObjectStorage(builder.Configuration);

// Kuyruk: RabbitMQ + MassTransit. Consumer'lar modül assembly'lerinden keşfedilir.
builder.Services.AddMassTransit(bus =>
{
    bus.SetKebabCaseEndpointNameFormatter();
    bus.AddConsumers(moduleAssemblies);

    bus.UsingRabbitMq((context, cfg) =>
    {
        var rabbit = builder.Configuration.GetSection("RabbitMq");
        cfg.Host(rabbit["Host"], rabbit["VirtualHost"] ?? "/", host =>
        {
            host.Username(rabbit["Username"]!);
            host.Password(rabbit["Password"]!);
        });
        cfg.ConfigureEndpoints(context);
    });
});

// Altyapı sağlık kontrolleri (her servis için ayrı ayrı genişletilebilir).
builder.Services
    .AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("Postgres")!, name: "postgres");

// CORS: React SPA client'ı farklı origin'den (ör. Vite :5173) API'yi çağırabilsin.
// İzinli origin'ler appsettings "Cors:AllowedOrigins" üzerinden yönetilir.
var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                  ?? ["http://localhost:5173"];
builder.Services.AddCors(options =>
{
    options.AddPolicy("spa", policy =>
        policy.WithOrigins(corsOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

// Tüm modül DbContext'lerinin bekleyen migration'larını uygula, sonra seed et.
await app.Services.MigrateModulesAsync();
await UsersSeeder.SeedAsync(app.Services);

// İşlenmeyen istisnaları yakala → istemciye RFC7807 ProblemDetails döner
// (stack trace sızdırmadan). Boru hattının en başında olmalı.
app.UseExceptionHandler();

// Her HTTP isteğini tek satırda, süre ve durum koduyla özetler (request logging).
app.UseSerilogRequestLogging();

app.UseCors("spa");

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.UseFastEndpoints(config =>
{
    config.Security.PermissionsClaimType = PermissionClaimsTransformation.PermissionClaimType;
    // Doğrulama hataları tutarlı RFC7807 ProblemDetails biçiminde döner.
    config.Errors.UseProblemDetails();
});

// Swagger UI'ı yalnızca Development'ta aç (üretimde kapalı kalsın).
if (app.Environment.IsDevelopment())
{
    app.UseSwaggerGen();
}

app.MapHealthChecks("/health");

app.Run();
