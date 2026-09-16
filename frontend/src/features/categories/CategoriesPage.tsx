import { FormEvent, useId, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CategoryApiError } from "../../shared/api/categories";
import { expenseKeys, getExpenses } from "../../shared/api/expenses";
import { Button } from "../../shared/ui/Button";
import { Surface } from "../../shared/ui/Surface";
import { useCategories } from "./useCategories";
import { useCreateCategory } from "./useCreateCategory";
import { useDeleteCategory } from "./useDeleteCategory";
import { useUpdateCategory } from "./useUpdateCategory";

export function CategoriesPage() {
  const titleId = useId();
  const nameId = useId();
  const nameErrorId = useId();
  const formErrorId = useId();
  const { data: categories = [], isError, isLoading } = useCategories();
  const { data: expenses = [] } = useQuery({
    queryKey: expenseKeys.lists(),
    queryFn: getExpenses
  });
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const updateCategory = useUpdateCategory();
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingNameError, setEditingNameError] = useState("");
  const [editingFormError, setEditingFormError] = useState("");
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);
  const [deleteBlockMessage, setDeleteBlockMessage] = useState("");

  const defaultCategories = useMemo(
    () => categories.filter((category) => category.isDefault),
    [categories]
  );
  const customCategories = useMemo(
    () => categories.filter((category) => !category.isDefault),
    [categories]
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccessMessage("");
    setFormError("");

    if (!name.trim()) {
      setNameError("Enter a category name.");
      return;
    }

    createCategory.mutate(
      { name: name.trim() },
      {
        onSuccess: () => {
          setName("");
          setNameError("");
          setFormError("");
          setSuccessMessage("Category added.");
        },
        onError: (error) => {
          setSuccessMessage("");
          if (error instanceof CategoryApiError) {
            setNameError(error.fieldErrors.Name?.[0] ?? "");
            setFormError(error.fieldErrors.Name?.[0] ? "" : error.message);
            return;
          }

          setFormError("Category could not be saved. Try again.");
        }
      }
    );
  }

  function startEditing(categoryId: string, currentName: string) {
    setEditingCategoryId(categoryId);
    setEditingName(currentName);
    setEditingNameError("");
    setEditingFormError("");
    setSuccessMessage("");
    setDeleteBlockMessage("");
  }

  function cancelEditing() {
    setEditingCategoryId(null);
    setEditingName("");
    setEditingNameError("");
    setEditingFormError("");
  }

  function handleRenameSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccessMessage("");
    setEditingFormError("");

    if (!editingName.trim()) {
      setEditingNameError("Enter a category name.");
      return;
    }

    if (!editingCategoryId) {
      return;
    }

    updateCategory.mutate(
      { id: editingCategoryId, name: editingName.trim() },
      {
        onSuccess: () => {
          setEditingCategoryId(null);
          setEditingName("");
          setEditingNameError("");
          setEditingFormError("");
          setSuccessMessage("Category updated.");
        },
        onError: (error) => {
          setSuccessMessage("");
          if (error instanceof CategoryApiError) {
            setEditingNameError(error.fieldErrors.Name?.[0] ?? "");
            setEditingFormError(error.fieldErrors.Name?.[0] ? "" : error.message);
            return;
          }

          setEditingFormError("Category could not be updated. Try again.");
        }
      }
    );
  }

  function requestDelete(categoryId: string) {
    setSuccessMessage("");
    setDeleteBlockMessage("");

    if (expenses.some((expense) => expense.categoryId === categoryId)) {
      setDeleteBlockMessage("This category is used by existing expenses. Reassign those expenses before deleting it.");
      return;
    }

    deleteCategory.reset();
    setDeleteCandidateId(categoryId);
  }

  function cancelDelete() {
    setDeleteCandidateId(null);
    deleteCategory.reset();
  }

  function confirmDelete() {
    if (!deleteCandidateId) {
      return;
    }

    deleteCategory.mutate(deleteCandidateId, {
      onSuccess: () => {
        setDeleteCandidateId(null);
        setSuccessMessage("Category deleted.");
      },
      onError: () => {
        setDeleteCandidateId(null);
        setDeleteBlockMessage("This category is used by existing expenses. Reassign those expenses before deleting it.");
      }
    });
  }

  const deleteCandidate = customCategories.find((category) => category.id === deleteCandidateId);

  return (
    <main className="categories-page" aria-labelledby={titleId}>
      <Surface className="categories-surface">
        <div className="section-heading">
          <p className="eyebrow">Categories</p>
          <h1 id={titleId}>Manage categories</h1>
        </div>

        {isLoading ? <p className="inline-note">Loading categories...</p> : null}
        {isError ? <p className="inline-error">Categories could not be loaded. Try refreshing.</p> : null}

        <section className="category-management-section" aria-labelledby="default-categories-title">
          <div className="section-heading compact-heading">
            <h2 id="default-categories-title">Default Categories</h2>
            <p className="supporting-copy">Protected starter choices</p>
          </div>
          <ul className="category-management-list" aria-label="Default Categories">
            {defaultCategories.map((category) => (
              <li className="category-management-row" key={category.id}>
                <span>{category.name}</span>
                <span className="protected-label">Protected</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="category-management-section" aria-labelledby="custom-categories-title">
          <div className="section-heading compact-heading">
            <h2 id="custom-categories-title">Custom Categories</h2>
          </div>

          <form className="category-form" aria-label="Add custom category" onSubmit={handleSubmit}>
            <label className="field" htmlFor={nameId}>
              <span>Name</span>
              <input
                id={nameId}
                aria-describedby={nameError ? nameErrorId : undefined}
                aria-invalid={nameError ? "true" : "false"}
                className={nameError ? "invalid-control" : undefined}
                onChange={(event) => {
                  setName(event.target.value);
                  setNameError("");
                  setFormError("");
                  setSuccessMessage("");
                }}
                placeholder="e.g. Coffee"
                type="text"
                value={name}
              />
              {nameError ? <span className="field-error" id={nameErrorId}>{nameError}</span> : null}
            </label>

            {successMessage ? <p className="inline-success" role="status">{successMessage}</p> : null}
            {formError ? <p className="inline-error" id={formErrorId} role="alert">{formError}</p> : null}
            {deleteBlockMessage ? <p className="inline-error" role="alert">{deleteBlockMessage}</p> : null}

            <Button aria-describedby={formError ? formErrorId : undefined} disabled={createCategory.isPending} type="submit">
              {createCategory.isPending ? "Adding..." : "Add category"}
            </Button>
          </form>

          {!isLoading && !isError && customCategories.length === 0 ? (
            <p className="empty-review">No custom categories yet. Add one to get started.</p>
          ) : null}

          {customCategories.length > 0 ? (
            <ul className="category-management-list" aria-label="Custom Categories">
              {customCategories.map((category) => (
                <li className="category-management-row" key={category.id}>
                  {editingCategoryId === category.id ? (
                    <form className="category-row-form" aria-label={`Rename ${category.name}`} onSubmit={handleRenameSubmit}>
                      <label className="field compact-field">
                        <span>Name</span>
                        <input
                          aria-invalid={editingNameError ? "true" : "false"}
                          className={editingNameError ? "invalid-control" : undefined}
                          onChange={(event) => {
                            setEditingName(event.target.value);
                            setEditingNameError("");
                            setEditingFormError("");
                            setSuccessMessage("");
                          }}
                          type="text"
                          value={editingName}
                        />
                        {editingNameError ? <span className="field-error">{editingNameError}</span> : null}
                      </label>
                      {editingFormError ? <p className="inline-error" role="alert">{editingFormError}</p> : null}
                      <div className="category-row-actions">
                        <Button disabled={updateCategory.isPending} type="submit">
                          {updateCategory.isPending ? "Saving..." : "Save"}
                        </Button>
                        <button className="button button-ghost" onClick={cancelEditing} type="button">Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <span>{category.name}</span>
                      <div className="category-row-actions">
                        <button
                          className="button button-ghost"
                          onClick={() => startEditing(category.id, category.name)}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="button danger-action"
                          onClick={() => requestDelete(category.id)}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          ) : null}

          {deleteCandidate ? (
            <div className="dialog-backdrop" role="presentation">
              <section
                aria-describedby="delete-category-description"
                aria-labelledby="delete-category-title"
                aria-modal="true"
                className="confirm-dialog"
                role="dialog"
              >
                <div>
                  <h2 id="delete-category-title">Delete this category?</h2>
                  <p className="supporting-copy" id="delete-category-description">
                    This permanently removes {deleteCandidate.name} from your custom categories.
                  </p>
                </div>
                {deleteCategory.isError ? (
                  <p className="inline-error" role="alert">
                    {deleteCategory.error instanceof Error ? deleteCategory.error.message : "Category could not be deleted. Try again."}
                  </p>
                ) : null}
                <div className="dialog-actions">
                  <button className="button button-ghost" disabled={deleteCategory.isPending} onClick={cancelDelete} type="button">
                    Cancel
                  </button>
                  <button className="button danger-action danger-action-solid" disabled={deleteCategory.isPending} onClick={confirmDelete} type="button">
                    {deleteCategory.isPending ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </section>
            </div>
          ) : null}
        </section>
      </Surface>
    </main>
  );
}
