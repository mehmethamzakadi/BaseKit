using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BaseKit.Modules.Users.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddRolesAndPermissions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Description",
                schema: "users",
                table: "AspNetRoles",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "role_permissions",
                schema: "users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RoleId = table.Column<Guid>(type: "uuid", nullable: false),
                    Permission = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_role_permissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_role_permissions_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalSchema: "users",
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_role_permissions_RoleId_Permission",
                schema: "users",
                table: "role_permissions",
                columns: new[] { "RoleId", "Permission" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "role_permissions",
                schema: "users");

            migrationBuilder.DropColumn(
                name: "Description",
                schema: "users",
                table: "AspNetRoles");
        }
    }
}
