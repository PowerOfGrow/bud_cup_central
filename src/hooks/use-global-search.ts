import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SearchResult {
  type: "contest" | "producer" | "entry";
  id: string;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface GlobalSearchResults {
  contests: Array<{
    id: string;
    name: string;
    description?: string;
    location?: string;
    status: string;
    start_date?: string;
  }>;
  producers: Array<{
    id: string;
    display_name: string;
    organization?: string;
    role: string;
  }>;
  entries: Array<{
    id: string;
    strain_name: string;
    category: string;
    producerName?: string;
    producerOrganization?: string;
    contestName?: string;
  }>;
}

export const useGlobalSearch = (query: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["global-search", query],
    queryFn: async (): Promise<GlobalSearchResults> => {
      if (!query.trim()) {
        return { contests: [], producers: [], entries: [] };
      }

      const searchTerm = query.toLowerCase().trim();

      // Recherche dans les concours
      const { data: contests, error: contestsError } = await supabase
        .from("contests")
        .select("id, name, description, location, status, start_date")
        .or(
          `name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`
        )
        .order("start_date", { ascending: false })
        .limit(20);

      if (contestsError) throw contestsError;

      // Recherche dans les producteurs (profiles avec rôle producer)
      const { data: producers, error: producersError } = await supabase
        .from("profiles")
        .select("id, display_name, organization, role")
        .eq("role", "producer")
        .or(
          `display_name.ilike.%${searchTerm}%,organization.ilike.%${searchTerm}%`
        )
        .order("display_name", { ascending: true })
        .limit(20);

      if (producersError) throw producersError;

      // Recherche dans les entrées approuvées
      const { data: entries, error: entriesError } = await supabase
        .from("entries")
        .select(
          `
          id,
          strain_name,
          category,
          producer:profiles!entries_producer_id_fkey(display_name, organization),
          contest:contests(name)
        `
        )
        .eq("status", "approved")
        .or(
          `strain_name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%,terpene_profile.ilike.%${searchTerm}%`
        )
        .order("created_at", { ascending: false })
        .limit(20);

      if (entriesError) throw entriesError;

      // Formater les résultats
      const formattedEntries = (entries || []).map((entry: any) => ({
        id: entry.id,
        strain_name: entry.strain_name,
        category: entry.category,
        producerName: entry.producer?.display_name,
        producerOrganization: entry.producer?.organization,
        contestName: entry.contest?.name,
      }));

      return {
        contests: contests || [],
        producers: producers || [],
        entries: formattedEntries,
      };
    },
    enabled: enabled && query.trim().length >= 2, // Recherche seulement si au moins 2 caractères
    staleTime: 30000, // Cache pendant 30 secondes
  });
};

