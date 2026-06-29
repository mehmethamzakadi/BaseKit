using BaseKit.Modules.Notes.Domain;
using BaseKit.Modules.Notes.Persistence;
using FastEndpoints;

namespace BaseKit.Modules.Notes.Endpoints;

public sealed record CreateNoteRequest(string Title, string? Content, bool Pinned);

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
        var entity = new Note
        {
            Id = Guid.NewGuid(),
            Title = req.Title,
            Content = req.Content,
            Pinned = req.Pinned,
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
        };
        db.Set<Note>().Add(entity);
        await db.SaveChangesAsync(ct);

        await Send.OkAsync(NoteResponse.From(entity), ct);
    }
}