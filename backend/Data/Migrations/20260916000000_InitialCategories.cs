using System;
using Backend.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Data.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260916000000_InitialCategories")]
public partial class InitialCategories : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "categories",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                name = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                is_default = table.Column<bool>(type: "boolean", nullable: false),
                is_protected = table.Column<bool>(type: "boolean", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_categories", x => x.id);
            });

        migrationBuilder.InsertData(
            table: "categories",
            columns: ["id", "is_default", "is_protected", "name"],
            values: new object[,]
            {
                { new Guid("10000000-0000-0000-0000-000000000001"), true, true, "Food" },
                { new Guid("10000000-0000-0000-0000-000000000002"), true, true, "Transport" },
                { new Guid("10000000-0000-0000-0000-000000000003"), true, true, "Shopping" },
                { new Guid("10000000-0000-0000-0000-000000000004"), true, true, "Bills" },
                { new Guid("10000000-0000-0000-0000-000000000005"), true, true, "Entertainment" },
                { new Guid("10000000-0000-0000-0000-000000000006"), true, true, "Health" },
                { new Guid("10000000-0000-0000-0000-000000000007"), true, true, "Education" },
                { new Guid("10000000-0000-0000-0000-000000000008"), true, true, "Other" }
            });

        migrationBuilder.CreateIndex(
            name: "ix_categories_name",
            table: "categories",
            column: "name",
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "categories");
    }
}
