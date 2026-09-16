namespace Backend.Domain;

public sealed class Category
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public bool IsDefault { get; private set; }
    public bool IsProtected { get; private set; }

    private Category()
    {
    }

    public Category(Guid id, string name, bool isDefault, bool isProtected)
    {
        Id = id;
        Name = string.IsNullOrWhiteSpace(name) ? throw new ArgumentException("Category name is required.", nameof(name)) : name.Trim();
        IsDefault = isDefault;
        IsProtected = isProtected;
    }

    public static Category CreateCustom(string name)
    {
        return new Category(Guid.NewGuid(), name, isDefault: false, isProtected: false);
    }

    public bool Rename(string name)
    {
        if (IsProtected || IsDefault)
        {
            return false;
        }

        Name = string.IsNullOrWhiteSpace(name) ? throw new ArgumentException("Category name is required.", nameof(name)) : name.Trim();
        return true;
    }
}
