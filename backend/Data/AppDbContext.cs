using Backend.Domain;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Expense> Expenses => Set<Expense>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Category>(category =>
        {
            category.ToTable("categories");
            category.HasKey(item => item.Id).HasName("pk_categories");

            category.Property(item => item.Id).HasColumnName("id");
            category.Property(item => item.Name)
                .HasColumnName("name")
                .HasMaxLength(80)
                .IsRequired();
            category.Property(item => item.IsDefault).HasColumnName("is_default");
            category.Property(item => item.IsProtected).HasColumnName("is_protected");

            category.HasIndex(item => item.Name)
                .HasDatabaseName("ix_categories_name")
                .IsUnique();
            category.HasData(DefaultCategories.All);
        });

        modelBuilder.Entity<Expense>(expense =>
        {
            expense.ToTable("expenses");
            expense.HasKey(item => item.Id).HasName("pk_expenses");

            expense.Property(item => item.Id).HasColumnName("id");
            expense.Property(item => item.Amount)
                .HasColumnName("amount")
                .HasColumnType("numeric(12,2)")
                .IsRequired();
            expense.Property(item => item.CategoryId).HasColumnName("category_id");
            expense.Property(item => item.ExpenseDate)
                .HasColumnName("expense_date")
                .HasColumnType("date")
                .IsRequired();
            expense.Property(item => item.Description)
                .HasColumnName("description")
                .HasMaxLength(240);
            expense.Property(item => item.CreatedAt)
                .HasColumnName("created_at")
                .HasColumnType("timestamp with time zone")
                .IsRequired();
            expense.Property(item => item.UpdatedAt)
                .HasColumnName("updated_at")
                .HasColumnType("timestamp with time zone")
                .IsRequired();

            expense.HasOne<Category>()
                .WithMany()
                .HasForeignKey(item => item.CategoryId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_expenses_categories_category_id")
                .IsRequired();

            expense.HasIndex(item => item.CategoryId).HasDatabaseName("ix_expenses_category_id");
        });
    }
}
