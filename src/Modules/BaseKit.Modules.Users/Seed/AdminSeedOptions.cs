namespace BaseKit.Modules.Users.Seed;

public sealed class AdminSeedOptions
{
    public const string SectionName = "Seed";

    public string AdminEmail { get; init; } = "admin@basekit.local";
    public string AdminPassword { get; init; } = "Admin123!";
}

public static class DefaultRoles
{
    public const string SystemAdministrator = "Sistem Yöneticisi";
    public const string StandardUser = "Standart Kullanıcı";
}
