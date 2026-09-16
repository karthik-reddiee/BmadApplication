import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteExpense, expenseKeys, ExpenseListItemDto } from "../../shared/api/expenses";
import { summaryKeys } from "../../shared/api/summaries";

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteExpense,
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: expenseKeys.detail(id) });
      queryClient.setQueryData<ExpenseListItemDto[]>(expenseKeys.lists(), (expenses) =>
        expenses?.filter((expense) => expense.id !== id) ?? expenses);
      void queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: summaryKeys.currentMonth() });
    }
  });
}
