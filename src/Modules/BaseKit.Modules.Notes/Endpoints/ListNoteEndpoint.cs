using BaseKit.Modules.Notes.Domain;
using BaseKit.Modules.Notes.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace BaseKit.Modules.Notes.Endpoints;

public sealed class ListNoteEndpoint(NotesDbContext db)
    : EndpointWithoutRequest<IReadOnlyList<NoteResponse>>
{
    public override void Configure()
    {
        Get("/notes");
        Permissions(NotesPermissions.View);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var items = await db.Set<Note>()
            .AsNoTracking()
            .OrderByDescending(x => x.CreatedAtUtc)
            .ToListAsync(ct);

        await Send.OkAsync(items.Select(NoteResponse.From).ToList(), ct);
    }
}