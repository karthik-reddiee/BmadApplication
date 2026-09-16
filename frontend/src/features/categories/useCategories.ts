import { useQuery } from "@tanstack/react-query";
import { categoryKeys, getCategories } from "../../shared/api/categories";

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.lists(),
    queryFn: getCategories
  });
}
