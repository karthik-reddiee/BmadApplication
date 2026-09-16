import { afterEach, describe, expect, it, vi } from "vitest";
import { CategoryApiError, createCategory, deleteCategory, getCategories, updateCategory } from "./categories";

describe("getCategories", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("gets categories from the category endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: "10000000-0000-0000-0000-000000000001",
          name: "Food",
          isDefault: true,
          isProtected: true
        }
      ]
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(getCategories()).resolves.toEqual([
      {
        id: "10000000-0000-0000-0000-000000000001",
        name: "Food",
        isDefault: true,
        isProtected: true
      }
    ]);
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:5000/api/categories");
  });

  it("throws an actionable failure when categories cannot be loaded", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false
    }));

    await expect(getCategories()).rejects.toThrow("Categories could not be loaded.");
  });
});

describe("createCategory", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts a create request to the category endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "30000000-0000-0000-0000-000000000001",
        name: "Coffee",
        isDefault: false,
        isProtected: false
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(createCategory({ name: "Coffee" })).resolves.toMatchObject({
      name: "Coffee",
      isDefault: false,
      isProtected: false
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:5000/api/categories",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: "Coffee" })
      })
    );
  });

  it("throws parsed validation details when the category endpoint returns ValidationProblemDetails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        title: "One or more validation errors occurred.",
        errors: {
          Name: ["Enter a category name."]
        }
      })
    }));

    const thrown = await createCategory({ name: "" }).catch((error: unknown) => error);

    expect(thrown).toBeInstanceOf(CategoryApiError);
    expect(thrown).toMatchObject({
      message: "One or more validation errors occurred.",
      fieldErrors: {
        Name: ["Enter a category name."]
      }
    });
  });
});

describe("updateCategory", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("puts an update request to the category endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "30000000-0000-0000-0000-000000000001",
        name: "Tea",
        isDefault: false,
        isProtected: false
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(updateCategory("30000000-0000-0000-0000-000000000001", { name: "Tea" })).resolves.toMatchObject({
      name: "Tea",
      isDefault: false
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:5000/api/categories/30000000-0000-0000-0000-000000000001",
      expect.objectContaining({
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: "Tea" })
      })
    );
  });

  it("throws parsed validation details when update returns ValidationProblemDetails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        title: "One or more validation errors occurred.",
        errors: {
          Name: ["Default categories cannot be renamed."]
        }
      })
    }));

    const thrown = await updateCategory("category-id", { name: "Food" }).catch((error: unknown) => error);

    expect(thrown).toBeInstanceOf(CategoryApiError);
    expect(thrown).toMatchObject({
      fieldErrors: {
        Name: ["Default categories cannot be renamed."]
      }
    });
  });
});

describe("deleteCategory", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("deletes a category through the category endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 204
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(deleteCategory("30000000-0000-0000-0000-000000000001")).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:5000/api/categories/30000000-0000-0000-0000-000000000001",
      { method: "DELETE" }
    );
  });

  it("throws blocker feedback when delete is rejected", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        detail: "This category is used by existing expenses. Reassign those expenses before deleting it."
      })
    }));

    await expect(deleteCategory("category-id")).rejects.toThrow(
      "This category is used by existing expenses. Reassign those expenses before deleting it."
    );
  });
});
