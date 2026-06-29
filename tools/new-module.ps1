<#
.SYNOPSIS
    BaseKit için sıfırdan yeni bir modül üretir (REPR CRUD + yetkiler + migration).

.DESCRIPTION
    Parametreleri sorar/alır, ardından:
      - class library projesini oluşturur, solution'a ekler, referansları/paketleri bağlar
      - Domain entity, EF config, DbContext (kendi şeması), permission katalogu,
        IModule ve CRUD endpoint'lerini üretir
      - Program.cs'teki modül listesine kaydeder
      - derler, EF migration üretir ve tekrar derler
    Migration uygulama açılışında otomatik uygulanır (MigrateModulesAsync).

.PARAMETER Name
    Modül adı (PascalCase, çoğul önerilir). Örn: Notes

.PARAMETER Entity
    Ana varlık adı (PascalCase, tekil). Örn: Note

.PARAMETER Properties
    Virgülle ayrılmış "Ad:tip" listesi. Tipler: string, string?, int, int?,
    decimal, decimal?, bool, bool?, Guid, Guid?, DateTimeOffset, DateTimeOffset?
    Örn: "Title:string,Content:string?,Pinned:bool"

.PARAMETER Schema
    PostgreSQL şema adı (varsayılan: modül adının küçük hali)

.PARAMETER RouteBase
    Endpoint kök yolu (varsayılan: /<modül-küçük>)

.PARAMETER SkipMigration
    Verilirse migration üretilmez.

.EXAMPLE
    powershell -File tools/new-module.ps1 -Name Notes -Entity Note -Properties "Title:string,Content:string?"
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)] [string] $Name,
    [Parameter(Mandatory = $true)] [string] $Entity,
    [Parameter(Mandatory = $false)] [string] $Properties = "Title:string,Content:string?",
    [Parameter(Mandatory = $false)] [string] $Schema = "",
    [Parameter(Mandatory = $false)] [string] $RouteBase = "",
    [switch] $SkipMigration
)

$ErrorActionPreference = "Stop"

function Write-Step($msg) { Write-Host "==> $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "  OK $msg" -ForegroundColor Green }

# --- Doğrulama ---
if ($Name -notmatch '^[A-Z][A-Za-z0-9]*$')   { throw "Name PascalCase olmalı (örn: Notes). Verilen: $Name" }
if ($Entity -notmatch '^[A-Z][A-Za-z0-9]*$') { throw "Entity PascalCase olmalı (örn: Note). Verilen: $Entity" }

# --- Değişkenler ---
$root        = Split-Path $PSScriptRoot -Parent
$lower       = $Name.ToLowerInvariant()
$entityLower = $Entity.ToLowerInvariant()
if ([string]::IsNullOrWhiteSpace($Schema))    { $schemaName = $lower }      else { $schemaName = $Schema }
if ([string]::IsNullOrWhiteSpace($RouteBase)) { $route = "/$lower" }        else { $route = $RouteBase }

$ns         = "BaseKit.Modules.$Name"
$projName   = "BaseKit.Modules.$Name"
$projDir    = Join-Path $root "src/Modules/$projName"
$csproj     = Join-Path $projDir "$projName.csproj"
$dbctx      = "${Name}DbContext"
$permClass  = "${Name}Permissions"
$provClass  = "${Name}PermissionProvider"
$moduleCls  = "${Name}Module"
$tableName  = "${entityLower}s"
$apiCsproj  = Join-Path $root "src/BaseKit.Api/BaseKit.Api.csproj"
$sharedCsproj = Join-Path $root "src/BaseKit.Shared/BaseKit.Shared.csproj"
$programCs  = Join-Path $root "src/BaseKit.Api/Program.cs"

# Solution dosyasını dinamik bul (.slnx veya .sln)
$slnFile = Get-ChildItem $root -File | Where-Object { $_.Extension -eq ".slnx" -or $_.Extension -eq ".sln" } | Select-Object -First 1
if ($null -eq $slnFile) { throw "Solution dosyası bulunamadı: $root" }
$sln = $slnFile.FullName

# BOM'suz UTF-8 (dosya yazımı için)
$utf8 = New-Object System.Text.UTF8Encoding($false)

if (Test-Path $projDir) { throw "Modül klasörü zaten var: $projDir" }

# --- Property ayrıştırma ---
$allowedTypes = @("string","string?","int","int?","long","long?","decimal","decimal?","bool","bool?","Guid","Guid?","DateTimeOffset","DateTimeOffset?")
$props = @()
foreach ($part in $Properties.Split(",")) {
    $p = $part.Trim()
    if ([string]::IsNullOrWhiteSpace($p)) { continue }
    $kv = $p.Split(":")
    $pName = $kv[0].Trim()
    if ($kv.Count -gt 1) { $pType = $kv[1].Trim() } else { $pType = "string" }
    if ($allowedTypes -notcontains $pType) { throw "Desteklenmeyen tip '$pType' ($pName). İzinli: $($allowedTypes -join ', ')" }
    if ($pName -notmatch '^[A-Z][A-Za-z0-9]*$') { throw "Property adı PascalCase olmalı: $pName" }
    $isString = ($pType -eq "string") -or ($pType -eq "string?")
    $nullable = $pType.EndsWith("?")
    $props += [pscustomobject]@{ Name = $pName; Type = $pType; IsString = $isString; Nullable = $nullable }
}
if ($props.Count -eq 0) { throw "En az bir property gerekli." }

$nl = [Environment]::NewLine

# Üretilen kod parçaları
$entityProps = ($props | ForEach-Object {
    if ($_.IsString -and -not $_.Nullable) { "    public $($_.Type) $($_.Name) { get; set; } = default!;" }
    else { "    public $($_.Type) $($_.Name) { get; set; }" }
}) -join $nl

$cfgLines = ($props | Where-Object { $_.IsString } | ForEach-Object {
    if (-not $_.Nullable) { "        builder.Property(x => x.$($_.Name)).HasMaxLength(500).IsRequired();" }
    else { "        builder.Property(x => x.$($_.Name)).HasMaxLength(500);" }
}) -join $nl
if ([string]::IsNullOrWhiteSpace($cfgLines)) { $cfgLines = "        // (string olmayan alanlar için ek kısıt gerekmez)" }

$reqParams   = ($props | ForEach-Object { "$($_.Type) $($_.Name)" }) -join ", "
$respParams  = (@("Guid Id") + ($props | ForEach-Object { "$($_.Type) $($_.Name)" }) + @("DateTimeOffset CreatedAtUtc","DateTimeOffset UpdatedAtUtc")) -join ", "
$fromArgs    = (@("e.Id") + ($props | ForEach-Object { "e.$($_.Name)" }) + @("e.CreatedAtUtc","e.UpdatedAtUtc")) -join ", "
$createAssign = ($props | ForEach-Object { "            $($_.Name) = req.$($_.Name)," }) -join $nl
$updateAssign = ($props | ForEach-Object { "        entity.$($_.Name) = req.$($_.Name);" }) -join $nl

# === Proje iskeleti ===
Write-Step "Proje oluşturuluyor: $projName"
dotnet new classlib -n $projName -o $projDir | Out-Null
Remove-Item (Join-Path $projDir "Class1.cs") -ErrorAction SilentlyContinue
dotnet sln $sln add $csproj | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Solution'a eklenemedi." }
dotnet add $csproj reference $sharedCsproj | Out-Null
dotnet add $apiCsproj reference $csproj | Out-Null
Write-Ok "proje + referanslar"

Write-Step "Paketler ekleniyor (FastEndpoints, Npgsql EF Core)"
dotnet add $csproj package FastEndpoints | Out-Null
dotnet add $csproj package Npgsql.EntityFrameworkCore.PostgreSQL | Out-Null
Write-Ok "paketler"

# === Klasörler ===
New-Item -ItemType Directory -Force (Join-Path $projDir "Domain") | Out-Null
New-Item -ItemType Directory -Force (Join-Path $projDir "Persistence") | Out-Null
New-Item -ItemType Directory -Force (Join-Path $projDir "Endpoints") | Out-Null

# === Dosya yazıcı ===
function Save([string]$relPath, [string]$content) {
    $full = Join-Path $projDir $relPath
    $dir = Split-Path $full -Parent
    New-Item -ItemType Directory -Force $dir | Out-Null
    [System.IO.File]::WriteAllText($full, $content, $utf8)
}

Write-Step "Kaynak dosyalar üretiliyor"

# Domain
Save "Domain/$Entity.cs" @"
namespace $ns.Domain;

public sealed class $Entity
{
    public Guid Id { get; set; }
$entityProps
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
}
"@

# EF Config
Save "Persistence/${Entity}Configuration.cs" @"
using $ns.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace $ns.Persistence;

public sealed class ${Entity}Configuration : IEntityTypeConfiguration<$Entity>
{
    public void Configure(EntityTypeBuilder<$Entity> builder)
    {
        builder.ToTable("$tableName");
        builder.HasKey(x => x.Id);
$cfgLines
    }
}
"@

# DbContext (DbSet yerine Set<T>() kullanılır; entity config ile keşfedilir)
Save "Persistence/$dbctx.cs" @"
using Microsoft.EntityFrameworkCore;

namespace $ns.Persistence;

public sealed class $dbctx(DbContextOptions<$dbctx> options) : DbContext(options)
{
    public const string Schema = "$schemaName";

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof($dbctx).Assembly);
    }
}
"@

# Permissions + Provider
Save "$permClass.cs" @"
using BaseKit.Shared.Authorization;

namespace $ns;

public static class $permClass
{
    public const string View   = "$lower.view";
    public const string Create = "$lower.create";
    public const string Update = "$lower.update";
    public const string Delete = "$lower.delete";
}

public sealed class $provClass : IPermissionProvider
{
    private const string Group = "$Name";

    public IReadOnlyList<PermissionDefinition> GetPermissions() =>
    [
        new($permClass.View,   "$Name sayfasını görüntüle", Group),
        new($permClass.Create, "$Entity oluştur",           Group),
        new($permClass.Update, "$Entity güncelle",          Group),
        new($permClass.Delete, "$Entity sil",               Group),
    ];
}
"@

# Module
Save "$moduleCls.cs" @"
using $ns.Persistence;
using BaseKit.Shared.Authorization;
using BaseKit.Shared.Modules;
using BaseKit.Shared.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace $ns;

public sealed class $moduleCls : IModule
{
    public void RegisterServices(IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Postgres");
        services.AddModuleDbContext<$dbctx>(options =>
            options.UseNpgsql(connectionString, npgsql =>
                npgsql.MigrationsHistoryTable("__ef_migrations_history", $dbctx.Schema)));

        services.AddSingleton<IPermissionProvider, $provClass>();
    }
}
"@

# Response DTO
Save "Endpoints/${Entity}Response.cs" @"
using $ns.Domain;

namespace $ns.Endpoints;

public sealed record ${Entity}Response($respParams)
{
    public static ${Entity}Response From($Entity e) => new($fromArgs);
}
"@

# Create
Save "Endpoints/Create${Entity}Endpoint.cs" @"
using $ns.Domain;
using $ns.Persistence;
using FastEndpoints;

namespace $ns.Endpoints;

public sealed record Create${Entity}Request($reqParams);

public sealed class Create${Entity}Endpoint($dbctx db)
    : Endpoint<Create${Entity}Request, ${Entity}Response>
{
    public override void Configure()
    {
        Post("$route");
        Permissions($permClass.Create);
    }

    public override async Task HandleAsync(Create${Entity}Request req, CancellationToken ct)
    {
        var now = DateTimeOffset.UtcNow;
        var entity = new $Entity
        {
            Id = Guid.NewGuid(),
$createAssign
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
        };
        db.Set<$Entity>().Add(entity);
        await db.SaveChangesAsync(ct);

        await Send.OkAsync(${Entity}Response.From(entity), ct);
    }
}
"@

# List
Save "Endpoints/List${Entity}Endpoint.cs" @"
using $ns.Domain;
using $ns.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace $ns.Endpoints;

public sealed class List${Entity}Endpoint($dbctx db)
    : EndpointWithoutRequest<IReadOnlyList<${Entity}Response>>
{
    public override void Configure()
    {
        Get("$route");
        Permissions($permClass.View);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var items = await db.Set<$Entity>()
            .AsNoTracking()
            .OrderByDescending(x => x.CreatedAtUtc)
            .ToListAsync(ct);

        await Send.OkAsync(items.Select(${Entity}Response.From).ToList(), ct);
    }
}
"@

# Get
Save "Endpoints/Get${Entity}Endpoint.cs" @"
using $ns.Domain;
using $ns.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace $ns.Endpoints;

public sealed record Get${Entity}Request(Guid Id);

public sealed class Get${Entity}Endpoint($dbctx db)
    : Endpoint<Get${Entity}Request, ${Entity}Response>
{
    public override void Configure()
    {
        Get("$route/{id}");
        Permissions($permClass.View);
    }

    public override async Task HandleAsync(Get${Entity}Request req, CancellationToken ct)
    {
        var entity = await db.Set<$Entity>().AsNoTracking().FirstOrDefaultAsync(x => x.Id == req.Id, ct);
        if (entity is null) { await Send.NotFoundAsync(ct); return; }
        await Send.OkAsync(${Entity}Response.From(entity), ct);
    }
}
"@

# Update
Save "Endpoints/Update${Entity}Endpoint.cs" @"
using $ns.Domain;
using $ns.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace $ns.Endpoints;

public sealed record Update${Entity}Request(Guid Id, $reqParams);

public sealed class Update${Entity}Endpoint($dbctx db)
    : Endpoint<Update${Entity}Request, ${Entity}Response>
{
    public override void Configure()
    {
        Put("$route/{id}");
        Permissions($permClass.Update);
    }

    public override async Task HandleAsync(Update${Entity}Request req, CancellationToken ct)
    {
        var entity = await db.Set<$Entity>().FirstOrDefaultAsync(x => x.Id == req.Id, ct);
        if (entity is null) { await Send.NotFoundAsync(ct); return; }

$updateAssign
        entity.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);

        await Send.OkAsync(${Entity}Response.From(entity), ct);
    }
}
"@

# Delete
Save "Endpoints/Delete${Entity}Endpoint.cs" @"
using $ns.Domain;
using $ns.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace $ns.Endpoints;

public sealed record Delete${Entity}Request(Guid Id);

public sealed class Delete${Entity}Endpoint($dbctx db) : Endpoint<Delete${Entity}Request>
{
    public override void Configure()
    {
        Delete("$route/{id}");
        Permissions($permClass.Delete);
    }

    public override async Task HandleAsync(Delete${Entity}Request req, CancellationToken ct)
    {
        var deleted = await db.Set<$Entity>().Where(x => x.Id == req.Id).ExecuteDeleteAsync(ct);
        if (deleted == 0) { await Send.NotFoundAsync(ct); return; }
        await Send.NoContentAsync(ct);
    }
}
"@

Write-Ok "kaynak dosyalar"

# === Program.cs kaydı ===
Write-Step "Program.cs modül listesine ekleniyor"
$sentinel = "// >>> SCAFFOLD:MODULES <<<"
$content = [System.IO.File]::ReadAllText($programCs)
if (-not $content.Contains($sentinel)) {
    throw "Program.cs içinde 'SCAFFOLD:MODULES' işareti bulunamadı. Modülü elle ekleyin: typeof($ns.$moduleCls).Assembly"
}
$content = $content.Replace($sentinel, "typeof($ns.$moduleCls).Assembly,$nl    $sentinel")
[System.IO.File]::WriteAllText($programCs, $content, $utf8)
Write-Ok "modül kaydedildi"

# === Derle ===
Write-Step "Derleniyor"
dotnet build $sln | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Build başarısız." }
Write-Ok "build"

# === Migration ===
if (-not $SkipMigration) {
    Write-Step "Migration üretiliyor: Initial$Name"
    dotnet ef migrations add "Initial$Name" --project $csproj --startup-project $apiCsproj --context $dbctx --output-dir "Persistence/Migrations" | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Migration üretimi başarısız." }
    dotnet build $sln | Out-Null
    Write-Ok "migration + rebuild"
}

Write-Host ""
Write-Host "BAŞARILI: $projName modülü hazır." -ForegroundColor Green
Write-Host ""
Write-Host "Üretilen yetkiler: $lower.view, $lower.create, $lower.update, $lower.delete"
Write-Host "Endpoint kökü     : $route  (GET/POST $route, GET/PUT/DELETE $route/{id})"
Write-Host ""
Write-Host "Sonraki adımlar:"
Write-Host "  1) Uygulamayı çalıştır (migration açılışta otomatik uygulanır): cd src/BaseKit.Api; dotnet run"
Write-Host "  2) Admin token ile test et veya bir role '$lower.*' yetkilerini ata."
Write-Host "  3) Kapatmak istersen Program.cs'ten ilgili 'typeof($moduleCls)...' satırını sil."
