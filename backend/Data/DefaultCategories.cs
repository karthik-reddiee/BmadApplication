using Backend.Domain;

namespace Backend.Data;

public static class DefaultCategories
{
    public static readonly Category[] All =
    [
        new(new Guid("10000000-0000-0000-0000-000000000001"), "Food", true, true),
        new(new Guid("10000000-0000-0000-0000-000000000002"), "Transport", true, true),
        new(new Guid("10000000-0000-0000-0000-000000000003"), "Shopping", true, true),
        new(new Guid("10000000-0000-0000-0000-000000000004"), "Bills", true, true),
        new(new Guid("10000000-0000-0000-0000-000000000005"), "Entertainment", true, true),
        new(new Guid("10000000-0000-0000-0000-000000000006"), "Health", true, true),
        new(new Guid("10000000-0000-0000-0000-000000000007"), "Education", true, true),
        new(new Guid("10000000-0000-0000-0000-000000000008"), "Other", true, true)
    ];
}

