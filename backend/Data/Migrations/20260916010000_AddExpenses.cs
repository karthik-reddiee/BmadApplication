using System;
using Backend.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Data.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260916010000_AddExpenses")]
public partial class AddExpenses : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "expenses",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                amount = table.Column<decimal>(type: "numeric(12,2)", nullable: false),
                category_id = table.Column<Guid>(type: "uuid", nullable: false),
                expense_date = table.Column<DateOnly>(type: "date", nullable: false),
                description = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: true),
                created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_expenses", x => x.id);
                table.ForeignKey(
                    name: "fk_expenses_categories_category_id",
                    column: x => x.category_id,
                    principalTable: "categories",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateIndex(
            name: "ix_expenses_category_id",
            table: "expenses",
            column: "category_id");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "expenses");
    }
}
