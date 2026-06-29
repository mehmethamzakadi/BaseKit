namespace BaseKit.Modules.Users.Endpoints.Admin;

public sealed record RoleDto(
    Guid Id,
    string Name,
    string? Description,
    IReadOnlyList<string> Permissions);
