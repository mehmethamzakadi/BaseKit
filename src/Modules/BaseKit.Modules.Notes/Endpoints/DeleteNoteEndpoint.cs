using BaseKit.Modules.Notes.Domain;
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
        var deleted = await db.Set<Note>().Where(x => x.Id == req.Id).ExecuteDeleteAsync(ct);
        if (deleted == 0) { await Send.NotFoundAsync(ct); return; }
        await Send.NoContentAsync(ct);
    }
}