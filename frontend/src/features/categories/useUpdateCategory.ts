import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CategoryDto, categoryKeys, updateCategory } from "../../shared/api/categories";
import { ExpenseDetailDto, ExpenseListItemDto, expenseKeys } from "../../shared/api/expenses";

type UpdateCategoryVariables = {
  id: string;
  name: string;
};

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: UpdateCategoryVariables) => updateCategory(id, { name }),
    onSuccess: (category) => {
      queryClient.setQueryData<CategoryDto[]>(categoryKeys.lists(), (categories) =>
        categories?.map((item) => item.id === category.id ? category : item) ?? [category]);
      queryClient.setQueryData<ExpenseListItemDto[]>(expenseKeys.lists(), (expenses) =>
        expenses?.map((expense) =>
          expense.categoryId === category.id ? { ...expense, categoryName: category.name } : expense) ?? expenses);
      queryClient.setQueriesData<ExpenseDetailDto>({ queryKey: expenseKeys.all }, (expense) =>
        expense?.categoryId === category.id ? { ...expense, categoryName: category.name } : expense);
      void queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: ["current-month-summary"] });
    }
  });
}
