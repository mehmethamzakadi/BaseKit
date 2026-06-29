using BaseKit.Modules.Catalog;
using BaseKit.Modules.System;
using BaseKit.Modules.Users;
using BaseKit.Modules.Users.Authorization;
using BaseKit.Modules.Users.Seed;
using BaseKit.Shared.Modules;
using BaseKit.Shared.Persistence;
using BaseKit.Shared.Storage;
using FastEndpoints;
using MassTransit;

var builder = WebApplication.CreateBuilder(args);

// === Modül kayıt noktası ===
// Yeni bir modül eklemek için tek yapılması gereken: modülün marker tipini
// (IModule uygulaması) aşağıdaki listeye eklemek. Hem DI kayıtları hem de
// FastEndpoints endpoint keşfi bu assembly listesi üzerinden yürür.
var moduleAssemblies = new[]
{
    typeof(SystemModule).Assembly,
    typeof(UsersModule).Assembly,
    typeof(CatalogModule).Assembly,
    typeof(BaseKit.Modules.Notes.NotesModule).Assembly,
    // >>> SCAFFOLD:MODULES <<< (bu satırı silmeyin; new-module.ps1 buraya ekler)
};

builder.Services.AddModules(builder.Configuration, moduleAssemblies);
builder.Services.AddFastEndpoints(options => options.Assemblies = moduleAssemblies);

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

app.UseCors("spa");

app.UseAuthentication();
app.UseAuthorization();

app.UseFastEndpoints(config =>
    config.Security.PermissionsClaimType = PermissionClaimsTransformation.PermissionClaimType);
app.MapHealthChecks("/health");

app.Run();
