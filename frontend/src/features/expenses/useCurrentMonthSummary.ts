import { useQuery } from "@tanstack/react-query";
import { getCurrentMonthSummary, summaryKeys } from "../../shared/api/summaries";

export function useCurrentMonthSummary() {
  return useQuery({
    queryKey: summaryKeys.currentMonth(),
    queryFn: getCurrentMonthSummary
  });
}
