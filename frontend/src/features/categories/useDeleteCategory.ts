import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CategoryDto, categoryKeys, deleteCategory } from "../../shared/api/categories";
import { expenseKeys } from "../../shared/api/expenses";

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: (_result, id) => {
      queryClient.setQueryData<CategoryDto[]>(categoryKeys.lists(), (categories) =>
        categories?.filter((category) => category.id !== id) ?? categories);
      void queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: ["current-month-summary"] });
    }
  });
}
