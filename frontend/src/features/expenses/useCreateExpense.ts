import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createExpense, expenseKeys } from "../../shared/api/expenses";
import { summaryKeys } from "../../shared/api/summaries";

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: expenseKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
      void queryClient.invalidateQueries({ queryKey: summaryKeys.currentMonth() });
    }
  });
}
