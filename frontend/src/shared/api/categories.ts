export type CategoryDto = {
  id: string;
  name: string;
  isDefault: boolean;
  isProtected: boolean;
};

export type CreateCategoryRequest = {
  name: string;
};

export type UpdateCategoryRequest = {
  name: string;
};

export class CategoryApiError extends Error {
  fieldErrors: Record<string, string[]>;

  constructor(message: string, fieldErrors: Record<string, string[]> = {}) {
    super(message);
    this.name = "CategoryApiError";
    this.fieldErrors = fieldErrors;
  }
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

export const categoryKeys = {
  lists: () => ["categories"] as const
};

export async function getCategories(): Promise<CategoryDto[]> {
  const response = await fetch(`${apiBaseUrl}/api/categories`);

  if (!response.ok) {
    throw new Error("Categories could not be loaded.");
  }

  return response.json() as Promise<CategoryDto[]>;
}

export async function createCategory(request: CreateCategoryRequest): Promise<CategoryDto> {
  const response = await fetch(`${apiBaseUrl}/api/categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    let problem: { errors?: Record<string, string[]>; title?: string } | null = null;

    try {
      problem = await response.json() as { errors?: Record<string, string[]>; title?: string };
    } catch {
      problem = null;
    }

    throw new CategoryApiError(
      problem?.title ?? "Category could not be saved. Try again.",
      problem?.errors ?? {}
    );
  }

  return response.json() as Promise<CategoryDto>;
}

export async function updateCategory(id: string, request: UpdateCategoryRequest): Promise<CategoryDto> {
  const response = await fetch(`${apiBaseUrl}/api/categories/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    let problem: { errors?: Record<string, string[]>; title?: string } | null = null;

    try {
      problem = await response.json() as { errors?: Record<string, string[]>; title?: string };
    } catch {
      problem = null;
    }

    throw new CategoryApiError(
      problem?.title ?? "Category could not be updated. Try again.",
      problem?.errors ?? {}
    );
  }

  return response.json() as Promise<CategoryDto>;
}

export async function deleteCategory(id: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/categories/${id}`, {
    method: "DELETE"
  });

  if (response.status === 404) {
    throw new CategoryApiError("Category was not found. It may have already been deleted.");
  }

  if (!response.ok) {
    let problem: { detail?: string; title?: string } | null = null;

    try {
      problem = await response.json() as { detail?: string; title?: string };
    } catch {
      problem = null;
    }

    throw new CategoryApiError(problem?.detail ?? problem?.title ?? "Category could not be deleted. Try again.");
  }
}
