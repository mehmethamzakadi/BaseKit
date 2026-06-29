using BaseKit.Modules.Notes.Domain;

namespace BaseKit.Modules.Notes.Endpoints;

public sealed record NoteResponse(Guid Id, string Title, string? Content, bool Pinned, DateTimeOffset CreatedAtUtc, DateTimeOffset UpdatedAtUtc)
{
    public static NoteResponse From(Note e) => new(e.Id, e.Title, e.Content, e.Pinned, e.CreatedAtUtc, e.UpdatedAtUtc);
}