/**
 * Hook pour récupérer le nom de catégorie d'une entrée (custom ou globale)
 * Utilise la fonction SQL get_entry_category_name() pour unifier l'affichage
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useEntryCategoryName(entryId: string | undefined | null) {
  return useQuery({
    queryKey: ["entry-category-name", entryId],
    queryFn: async () => {
      if (!entryId) return null;
      
      const { data, error } = await supabase.rpc("get_entry_category_name", {
        p_entry_id: entryId,
      });

      if (error) {
        console.error("Error fetching entry category name:", error);
        return null;
      }

      return data as string | null;
    },
    enabled: !!entryId,
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
  });
}

