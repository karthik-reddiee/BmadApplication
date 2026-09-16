import { useMutation, useQueryClient } from "@tanstack/react-query";
import { expenseKeys, updateExpense, UpdateExpenseRequest } from "../../shared/api/expenses";
import { summaryKeys } from "../../shared/api/summaries";

type UpdateExpenseVariables = {
  id: string;
  request: UpdateExpenseRequest;
};

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: UpdateExpenseVariables) => updateExpense(id, request),
    onSuccess: (expense) => {
      queryClient.setQueryData(expenseKeys.detail(expense.id), expense);
      void queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: summaryKeys.currentMonth() });
    }
  });
}
