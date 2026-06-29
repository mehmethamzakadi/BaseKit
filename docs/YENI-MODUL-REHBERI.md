# BaseKit — Sıfırdan Yeni Modül & Rol/Yetki Rehberi

Bu rehber, mevcut altyapı üzerinde **sıfırdan yeni bir modül** oluşturmayı ve
**rolleri/yetkileri** baştan sona tanımlamayı adım adım anlatır. Örnek olarak
basit bir **Notlar (Notes)** modülü kuracağız. Tüm kod parçaları projedeki
gerçek konvansiyonlara birebir uyumludur (Catalog modülüyle aynı desen).

> Kısa özet: Bir modül = ayrı bir class library projesi. İçinde **Domain**
> (entity), **Persistence** (DbContext + EF config), **Endpoints** (REPR),
> bir **`IModule`** uygulaması ve isteğe bağlı bir **`IPermissionProvider`**
> bulunur. Modülü kaydetmek için tek yapılan, `Program.cs`'teki assembly
> listesine bir satır eklemektir.

---

## 0. Mimariyi Hatırla (neden böyle?)

| Kavram | Ne işe yarar | Nerede |
|---|---|---|
| `IModule` | Modülün servislerini kendi içinde kaydeder (self-registration) | `BaseKit.Shared/Modules` |
| `AddModuleDbContext<T>` | DbContext'i kaydeder **ve** otomatik migration kayıt defterine ekler | `BaseKit.Shared/Persistence` |
| `MigrateModulesAsync` | Açılışta tüm modüllerin migration'larını uygular | `Program.cs` çağırır |
| `IPermissionProvider` | Modülün sayfa/işlem yetkilerini katalog'a bildirir | `BaseKit.Shared/Authorization` |
| FastEndpoints `Permissions("...")` | Endpoint'i belirli bir yetkiyle korur | her endpoint'in `Configure()` metodu |
| `PermissionClaimsTransformation` | Her istekte güncel yetkileri claim olarak ekler (anında etki) | Users modülü |

**Altın kural:** Yeni modül eklemek için hiçbir merkezi dosyayı elle düzenlemen
gerekmez — yalnızca `Program.cs`'teki `moduleAssemblies` listesine modülünün
tipini eklersin. Yetkiler, migration'lar ve endpoint'ler otomatik keşfedilir.

---

## 1. Projeyi Oluştur ve Bağla

Solution kökünde (`D:\calismalarim\BaseKit`) çalıştır:

```bash
# 1) Class library oluştur
dotnet new classlib -n BaseKit.Modules.Notes -o src/Modules/BaseKit.Modules.Notes

# 2) Varsayılan boş sınıfı sil
rm src/Modules/BaseKit.Modules.Notes/Class1.cs

# 3) Solution'a ekle
dotnet sln add src/Modules/BaseKit.Modules.Notes/BaseKit.Modules.Notes.csproj

# 4) Shared'a referans ver (IModule, persistence, authorization buradan gelir)
dotnet add src/Modules/BaseKit.Modules.Notes/BaseKit.Modules.Notes.csproj `
  reference src/BaseKit.Shared/BaseKit.Shared.csproj

# 5) Api'nin bu modüle referans vermesini sağla (Program.cs görebilsin)
dotnet add src/BaseKit.Api/BaseKit.Api.csproj `
  reference src/Modules/BaseKit.Modules.Notes/BaseKit.Modules.Notes.csproj

# 6) Gerekli paketler
dotnet add src/Modules/BaseKit.Modules.Notes/BaseKit.Modules.Notes.csproj package FastEndpoints
dotnet add src/Modules/BaseKit.Modules.Notes/BaseKit.Modules.Notes.csproj package Npgsql.EntityFrameworkCore.PostgreSQL
```

> Not: `TargetFramework`, `Nullable`, `ImplicitUsings` ayarlarını yazmana gerek
> yok — bunlar kökteki `Directory.Build.props` üzerinden tüm projelere otomatik
> uygulanır.

---

## 2. Domain — Entity

`src/Modules/BaseKit.Modules.Notes/Domain/Note.cs`

```csharp
namespace BaseKit.Modules.Notes.Domain;

public sealed class Note
{
    public Guid Id { get; set; }
    public string Title { get; set; } = default!;
    public string? Content { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
}
```

---

## 3. Persistence — EF Config + DbContext

Her modül **kendi DbContext'ine ve kendi PostgreSQL şemasına** sahip olur.
Böylece modüller veritabanı düzeyinde izole kalır.

`src/Modules/BaseKit.Modules.Notes/Persistence/NoteConfiguration.cs`

```csharp
using BaseKit.Modules.Notes.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BaseKit.Modules.Notes.Persistence;

public sealed class NoteConfiguration : IEntityTypeConfiguration<Note>
{
    public void Configure(EntityTypeBuilder<Note> builder)
    {
        builder.ToTable("notes");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Title).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Content).HasMaxLength(4000);
    }
}
```

`src/Modules/BaseKit.Modules.Notes/Persistence/NotesDbContext.cs`

```csharp
using BaseKit.Modules.Notes.Domain;
using Microsoft.EntityFrameworkCore;

namespace BaseKit.Modules.Notes.Persistence;

public sealed class NotesDbContext(DbContextOptions<NotesDbContext> options) : DbContext(options)
{
    public const string Schema = "notes";

    public DbSet<Note> Notes => Set<Note>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(NotesDbContext).Assembly);
    }
}
```

---

## 4. Yetkiler — Permission Katalogu (sayfa + işlem)

Modül kendi yetkilerini bir `IPermissionProvider` ile bildirir. Bu, yönetim
ekranında "şu role şu yetkileri ver" listesinde otomatik görünür.

`src/Modules/BaseKit.Modules.Notes/NotesPermissions.cs`

```csharp
using BaseKit.Shared.Authorization;

namespace BaseKit.Modules.Notes;

public static class NotesPermissions
{
    public const string View   = "notes.view";     // sayfa görüntüleme
    public const string Create = "notes.create";   // işlem
    public const string Update = "notes.update";   // işlem
    public const string Delete = "notes.delete";   // işlem
}

public sealed class NotesPermissionProvider : IPermissionProvider
{
    private const string Group = "Notlar";

    public IReadOnlyList<PermissionDefinition> GetPermissions() =>
    [
        new(NotesPermissions.View,   "Notlar sayfasını görüntüle", Group),
        new(NotesPermissions.Create, "Not oluştur",                Group),
        new(NotesPermissions.Update, "Not güncelle",               Group),
        new(NotesPermissions.Delete, "Not sil",                    Group),
    ];
}
```

> **Yetki adlandırma kuralı:** `modul.sayfa` ya da `modul.kaynak.islem`. Sayfa
> görüntüleme yetkilerini `.view` ile bitir — seed sırasında "Standart
> Kullanıcı" rolü otomatik olarak tüm `.view` (admin hariç) yetkilerini alır.

---

## 5. Modül Kaydı — `IModule`

`src/Modules/BaseKit.Modules.Notes/NotesModule.cs`

```csharp
using BaseKit.Modules.Notes.Persistence;
using BaseKit.Shared.Authorization;
using BaseKit.Shared.Modules;
using BaseKit.Shared.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace BaseKit.Modules.Notes;

public sealed class NotesModule : IModule
{
    public void RegisterServices(IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Postgres");

        // AddModuleDbContext: hem DbContext'i kaydeder hem de otomatik
        // migration için kayıt defterine ekler.
        services.AddModuleDbContext<NotesDbContext>(options =>
            options.UseNpgsql(connectionString, npgsql =>
                npgsql.MigrationsHistoryTable("__ef_migrations_history", NotesDbContext.Schema)));

        // Modülün yetkilerini katalog'a bildir.
        services.AddSingleton<IPermissionProvider, NotesPermissionProvider>();
    }
}
```

---

## 6. Endpoint'ler — REPR + Yetki Koruması

Her endpoint kendi dosyasında (FastEndpoints konvansiyonu). `Configure()`
içinde `Permissions("...")` ile korunur. Aşağıda CRUD'un dördü.

`Endpoints/NoteResponse.cs`

```csharp
using BaseKit.Modules.Notes.Domain;

namespace BaseKit.Modules.Notes.Endpoints;

public sealed record NoteResponse(
    Guid Id, string Title, string? Content,
    DateTimeOffset CreatedAtUtc, DateTimeOffset UpdatedAtUtc)
{
    public static NoteResponse From(Note n) =>
        new(n.Id, n.Title, n.Content, n.CreatedAtUtc, n.UpdatedAtUtc);
}
```

`Endpoints/CreateNoteEndpoint.cs`

```csharp
using BaseKit.Modules.Notes.Domain;
using BaseKit.Modules.Notes.Persistence;
using FastEndpoints;

namespace BaseKit.Modules.Notes.Endpoints;

public sealed record CreateNoteRequest(string Title, string? Content);

public sealed class CreateNoteEndpoint(NotesDbContext db)
    : Endpoint<CreateNoteRequest, NoteResponse>
{
    public override void Configure()
    {
        Post("/notes");
        Permissions(NotesPermissions.Create);
    }

    public override async Task HandleAsync(CreateNoteRequest req, CancellationToken ct)
    {
        var now = DateTimeOffset.UtcNow;
        var note = new Note
        {
            Id = Guid.NewGuid(),
            Title = req.Title,
            Content = req.Content,
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
        };
        db.Notes.Add(note);
        await db.SaveChangesAsync(ct);

        await Send.OkAsync(NoteResponse.From(note), ct);
    }
}
```

`Endpoints/ListNotesEndpoint.cs`

```csharp
using BaseKit.Modules.Notes.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace BaseKit.Modules.Notes.Endpoints;

public sealed class ListNotesEndpoint(NotesDbContext db)
    : EndpointWithoutRequest<IReadOnlyList<NoteResponse>>
{
    public override void Configure()
    {
        Get("/notes");
        Permissions(NotesPermissions.View);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var notes = await db.Notes
            .AsNoTracking()
            .OrderByDescending(x => x.CreatedAtUtc)
            .ToListAsync(ct);

        await Send.OkAsync(notes.Select(NoteResponse.From).ToList(), ct);
    }
}
```

`Endpoints/UpdateNoteEndpoint.cs`

```csharp
using BaseKit.Modules.Notes.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace BaseKit.Modules.Notes.Endpoints;

public sealed record UpdateNoteRequest(Guid Id, string Title, string? Content);

public sealed class UpdateNoteEndpoint(NotesDbContext db)
    : Endpoint<UpdateNoteRequest, NoteResponse>
{
    public override void Configure()
    {
        Put("/notes/{id}");
        Permissions(NotesPermissions.Update);
    }

    public override async Task HandleAsync(UpdateNoteRequest req, CancellationToken ct)
    {
        var note = await db.Notes.FirstOrDefaultAsync(x => x.Id == req.Id, ct);
        if (note is null) { await Send.NotFoundAsync(ct); return; }

        note.Title = req.Title;
        note.Content = req.Content;
        note.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);

        await Send.OkAsync(NoteResponse.From(note), ct);
    }
}
```

`Endpoints/DeleteNoteEndpoint.cs`

```csharp
using BaseKit.Modules.Notes.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace BaseKit.Modules.Notes.Endpoints;

public sealed record DeleteNoteRequest(Guid Id);

public sealed class DeleteNoteEndpoint(NotesDbContext db) : Endpoint<DeleteNoteRequest>
{
    public override void Configure()
    {
        Delete("/notes/{id}");
        Permissions(NotesPermissions.Delete);
    }

    public override async Task HandleAsync(DeleteNoteRequest req, CancellationToken ct)
    {
        var deleted = await db.Notes.Where(x => x.Id == req.Id).ExecuteDeleteAsync(ct);
        if (deleted == 0) { await Send.NotFoundAsync(ct); return; }
        await Send.NoContentAsync(ct);
    }
}
```

> **İhtiyaç oldukça ekle:** Redis cache için `IDistributedCache` + `GetOrSetAsync`
> (bkz. Catalog `GetProductEndpoint`), dosya yükleme için `IFileStorage`
> (bkz. Catalog `UploadProductImageEndpoint`). Kuyruğa olay basmak için
> constructor'a `IPublishEndpoint` enjekte et ve `Publish(...)` çağır.

---

## 7. Modülü Sisteme Tanıt (TEK satır)

`src/BaseKit.Api/Program.cs` içindeki `moduleAssemblies` listesine ekle:

```csharp
var moduleAssemblies = new[]
{
    typeof(SystemModule).Assembly,
    typeof(UsersModule).Assembly,
    typeof(CatalogModule).Assembly,
    typeof(NotesModule).Assembly,   // <-- eklenen tek satır
};
```

Bu kadar. DI kayıtları, endpoint keşfi, yetki kataloğu ve migration otomatik
devreye girer.

---

## 8. Migration Oluştur ve Uygula

```bash
# Migration üret (modül projesine yazılır)
dotnet ef migrations add InitialNotes `
  --project src/Modules/BaseKit.Modules.Notes `
  --startup-project src/BaseKit.Api `
  --context NotesDbContext `
  --output-dir Persistence/Migrations
```

> **DİKKAT (önemli ders):** `dotnet ef migrations add` sonrası mutlaka
> `dotnet build` çalıştır. Aksi halde `dotnet run --no-build` ile çalıştırırken
> Api'nin `bin` klasöründeki **eski (migration'sız) modül DLL'i** kullanılır ve
> "No migrations were found" uyarısı alırsın.

Migration'ı **elle uygulamana gerek yok**: uygulama açılışında `Program.cs`
içindeki `MigrateModulesAsync()` tüm bekleyen migration'ları uygular ve
`notes` şemasını oluşturur. (İstersen elle: `dotnet ef database update ...`)

---

## 9. Derle, Çalıştır, Test Et

```bash
dotnet build
# (Api klasöründe) dotnet run
```

Token alıp test et (admin tüm yetkilere sahip):

```bash
BASE=http://localhost:5179
TOKEN=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@basekit.local","password":"Admin123!"}' \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).accessToken))")

# Not oluştur
curl -s -X POST $BASE/notes -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"title":"İlk not","content":"merhaba"}'

# Listele
curl -s $BASE/notes -H "Authorization: Bearer $TOKEN"
```

> Türkçe karakterli gövdeleri Git Bash/curl ile `-d` üzerinden gönderirken
> bozuk UTF-8 oluşabilir. Gerekirse gövdeyi bir dosyaya yazıp
> `--data-binary @dosya.json` kullan.

---

## 10. Rolleri ve Yetkileri Tanımlama (uçtan uca)

Yeni modülün yetkileri (`notes.*`) artık katalogda. Şimdi rollere bağlayalım.
Tüm işlemler `admin.roles.manage` / `admin.users.manage` yetkisi gerektirir
(admin kullanıcıda var).

### 10.1 Mevcut yetki kataloğunu gör
```bash
curl -s $BASE/admin/permissions -H "Authorization: Bearer $TOKEN"
# "Notlar" grubu altında notes.view/create/update/delete görünür
```

### 10.2 Yeni rol oluştur
```bash
# Örn. "Editör" rolü
curl -s -X POST $BASE/admin/roles -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Editor","description":"Not yonetimi"}'
# dönen id'yi sakla → ROLEID
```

### 10.3 Role yetki ata (tüm küme tek seferde set edilir)
```bash
curl -s -X PUT $BASE/admin/roles/$ROLEID/permissions -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"permissions":["notes.view","notes.create","notes.update"]}'
```

### 10.4 Kullanıcıya rol ata
```bash
# Kullanıcıları listele → hedef kullanıcı id'sini al
curl -s $BASE/admin/users -H "Authorization: Bearer $TOKEN"

# Rolleri eşitle (verilen küme neyse o olur)
curl -s -X PUT $BASE/admin/users/$USERID/roles -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"roles":["Editor"]}'
```

### 10.5 Anında etki
Kullanıcı **yeni token almadan** bile artık `notes.create` yapabilir; ama
`notes.delete` yetkisi vermediğin için silme isteği **403** döner. Rolün
yetkilerini değiştirirsen etki bir sonraki istekte görülür (Redis cache
otomatik invalidate edilir).

### 10.6 Seed ile kalıcı varsayılan (opsiyonel)
"Sistem Yöneticisi" zaten her açılışta **tüm** yetkileri (yeni `notes.*` dahil)
otomatik alır. Yeni bir rolü kod ile sabit kurmak istersen
`src/Modules/BaseKit.Modules.Users/Seed/UsersSeeder.cs` içine, mevcut
"Standart Kullanıcı" deseninin aynısını ekleyebilirsin.

---

## 11. Modülü Geçici Olarak Kapatma / Kaldırma

- **Geçici kapatma:** `Program.cs`'teki `moduleAssemblies` listesinden modülün
  satırını çıkar. Endpoint'ler, DI kayıtları ve migration devreye girmez.
  (Tablolar veritabanında kalır; veri kaybı olmaz.)
- **Tamamen kaldırma:** `dotnet sln remove ...` + Api referansını kaldır +
  klasörü sil. Şema/tabloları temizlemek istersen ayrı bir "drop schema"
  migration'ı ya da elle `DROP SCHEMA notes CASCADE;`.

---

## 12. Dış Entegrasyon Modülü (Spotify/Google Books gibi) Farkı

Veritabanı yerine bir dış API çağıran modüllerde DbContext yerine **typed
HttpClient** kullanılır:

```csharp
// IModule.RegisterServices içinde
services.AddHttpClient<IGoogleBooksClient, GoogleBooksClient>(c =>
    c.BaseAddress = new Uri("https://www.googleapis.com/books/v1/"));
services.AddSingleton<IPermissionProvider, GoogleBooksPermissionProvider>();
```

Aç/kapa için `appsettings`'e `"Integrations:GoogleBooks:Enabled": true` gibi bir
bayrak koyup endpoint başında kontrol edebilir ya da modülü doğrudan assembly
listesinden çıkarabilirsin.

---

## 13. Yeni Modül Kontrol Listesi ✅

- [ ] `dotnet new classlib` + sln add + Shared referansı + Api referansı
- [ ] Paketler: FastEndpoints (+ Npgsql.EntityFrameworkCore.PostgreSQL veya HttpClient)
- [ ] `Domain/` entity
- [ ] `Persistence/` EF config + DbContext (kendi `Schema`)
- [ ] `XxxPermissions` + `XxxPermissionProvider`
- [ ] `XxxModule : IModule` → `AddModuleDbContext` + `AddSingleton<IPermissionProvider, ...>`
- [ ] `Endpoints/` REPR endpoint'leri + her birine `Permissions("...")`
- [ ] `Program.cs` `moduleAssemblies` listesine **tek satır**
- [ ] `dotnet ef migrations add ...` → **`dotnet build`** → çalıştır
- [ ] Test: admin token ile CRUD; yetkisiz kullanıcıyla 403 doğrula
- [ ] (Gerekirse) rol oluştur → yetki ata → kullanıcıya ata

---

## 14. Sık Karşılaşılan Tuzaklar

| Belirti | Sebep | Çözüm |
|---|---|---|
| "No migrations were found" | `migrations add` sonrası build edilmedi, `--no-build` eski DLL kullandı | Önce `dotnet build`, sonra çalıştır |
| Endpoint 401 | Token yok/expired | `/auth/login` ile yeni access token al |
| Endpoint 403 | Kullanıcının ilgili `permission`'ı yok | Role yetkiyi ata, kullanıcıya rolü ata |
| Migration yanlış şemaya gidiyor | `MigrationsHistoryTable(... , Schema)` verilmedi | DbContext kaydında şemayı belirt |
| Türkçe gövde "invalid UTF-8" | Git Bash/curl `-d` kodlaması | Gövdeyi dosyaya yaz, `--data-binary @file` |
| Yetki değişikliği etki etmiyor | — | Etki anında olmalı; olmuyorsa Redis çalışıyor mu kontrol et |
```
