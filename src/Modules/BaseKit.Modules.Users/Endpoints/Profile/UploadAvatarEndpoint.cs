using BaseKit.Modules.Users.Domain;
using BaseKit.Shared.Storage;
using FastEndpoints;
using Microsoft.AspNetCore.Identity;

namespace BaseKit.Modules.Users.Endpoints.Profile;

/// <summary>
/// Geçerli kullanıcının profil fotoğrafını MinIO'ya yükler, nesne anahtarını
/// saklar ve geçici (presigned) erişim URL'i ile profil bilgisini döner.
/// </summary>
public sealed class UploadAvatarEndpoint(UserManager<AppUser> userManager, IFileStorage storage)
    : EndpointWithoutRequest<ProfileResponse>
{
    private const long MaxBytes = 5 * 1024 * 1024; // 5 MB
    private static readonly string[] AllowedContentTypes =
        ["image/jpeg", "image/png", "image/webp", "image/gif"];

    public override void Configure()
    {
        Post("/profile/avatar");
        AllowFileUploads();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = ProfileClaims.GetUserId(User);
        if (userId is null) { await Send.UnauthorizedAsync(ct); return; }

        var user = await userManager.FindByIdAsync(userId.Value.ToString());
        if (user is null) { await Send.UnauthorizedAsync(ct); return; }

        if (Files.Count == 0)
        {
            AddError("Yüklenecek dosya bulunamadı.");
            await Send.ErrorsAsync(400, ct);
            return;
        }

        var file = Files[0];
        if (file.Length > MaxBytes)
        {
            AddError("Dosya boyutu 5 MB sınırını aşıyor.");
            await Send.ErrorsAsync(400, ct);
            return;
        }

        if (!AllowedContentTypes.Contains(file.ContentType))
        {
            AddError("Yalnızca JPEG, PNG, WEBP veya GIF görseller yüklenebilir.");
            await Send.ErrorsAsync(400, ct);
            return;
        }

        var oldKey = user.AvatarObjectKey;
        var objectKey = $"avatars/{user.Id}/{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
        await using (var stream = file.OpenReadStream())
        {
            await storage.UploadAsync(objectKey, stream, file.Length, file.ContentType, ct);
        }

        user.AvatarObjectKey = objectKey;
        await userManager.UpdateAsync(user);

        // Eski avatarı depodan temizle (orphan önleme).
        if (!string.IsNullOrEmpty(oldKey) && oldKey != objectKey)
        {
            await storage.DeleteAsync(oldKey, ct);
        }

        var avatarUrl = await storage.GetPresignedUrlAsync(objectKey, ct: ct);
        await Send.OkAsync(new ProfileResponse(user.Email, user.DisplayName, avatarUrl), ct);
    }
}
