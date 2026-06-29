namespace BaseKit.Modules.Notes.Domain;

public sealed class Note
{
    public Guid Id { get; set; }
    public string Title { get; set; } = default!;
    public string? Content { get; set; }
    public bool Pinned { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
}