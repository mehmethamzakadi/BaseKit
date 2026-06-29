using BaseKit.Modules.Notes.Domain;
using BaseKit.Modules.Notes.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace BaseKit.Modules.Notes.Endpoints;

public sealed record UpdateNoteRequest(Guid Id, string Title, string? Content, bool Pinned);

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
        var entity = await db.Set<Note>().FirstOrDefaultAsync(x => x.Id == req.Id, ct);
        if (entity is null) { await Send.NotFoundAsync(ct); return; }

        entity.Title = req.Title;
        entity.Content = req.Content;
        entity.Pinned = req.Pinned;
        entity.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);

        await Send.OkAsync(NoteResponse.From(entity), ct);
    }
}