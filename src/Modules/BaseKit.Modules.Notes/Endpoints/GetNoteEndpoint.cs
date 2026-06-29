using BaseKit.Modules.Notes.Domain;
using BaseKit.Modules.Notes.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace BaseKit.Modules.Notes.Endpoints;

public sealed record GetNoteRequest(Guid Id);

public sealed class GetNoteEndpoint(NotesDbContext db)
    : Endpoint<GetNoteRequest, NoteResponse>
{
    public override void Configure()
    {
        Get("/notes/{id}");
        Permissions(NotesPermissions.View);
    }

    public override async Task HandleAsync(GetNoteRequest req, CancellationToken ct)
    {
        var entity = await db.Set<Note>().AsNoTracking().FirstOrDefaultAsync(x => x.Id == req.Id, ct);
        if (entity is null) { await Send.NotFoundAsync(ct); return; }
        await Send.OkAsync(NoteResponse.From(entity), ct);
    }
}