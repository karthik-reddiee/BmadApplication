import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CategoryDto, categoryKeys, createCategory } from "../../shared/api/categories";

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCategory,
    onSuccess: (category) => {
      queryClient.setQueryData<CategoryDto[]>(categoryKeys.lists(), (categories) =>
        categories ? [...categories, category] : [category]);
      void queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    }
  });
}
