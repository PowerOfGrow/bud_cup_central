import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AdminUserStats {
  id: string;
  display_name: string;
  email: string | null;
  role: "organizer" | "producer" | "judge" | "viewer";
  created_at: string;
  is_verified: boolean;
  entries_count: number | null;
  evaluations_count: number | null;
  votes_count: number | null;
  contests_created_count: number | null;
  last_activity_at: string | null;
  is_banned: boolean;
  sanctions_count: number;
}

export interface SanctionHistory {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string | null;
  user_role: string;
  sanction_type: "warning" | "temporary_ban" | "permanent_ban" | "account_deletion";
  reason: string;
  reason_details: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  sanctioned_by: string;
  sanctioned_by_name: string;
}

// Hook pour récupérer tous les utilisateurs avec stats
export function useAdminUsers(roleFilter?: string) {
  return useQuery({
    queryKey: ["admin", "users", roleFilter],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_user_stats");

      if (error) throw error;
      
      let filtered = data as AdminUserStats[];
      
      if (roleFilter && roleFilter !== "all") {
        filtered = filtered.filter((u) => u.role === roleFilter);
      }
      
      // Trier par date de création décroissante
      filtered.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      });
      
      return filtered;
    },
  });
}

// Hook pour récupérer l'historique des sanctions
export function useSanctionsHistory(userId?: string) {
  return useQuery({
    queryKey: ["admin", "sanctions", userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_sanctions_history", {
        p_user_id: userId || null,
      });

      if (error) throw error;
      return (data || []) as SanctionHistory[];
    },
  });
}

// Hook pour bannir un utilisateur
export function useBanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      sanctionType,
      reason,
      reasonDetails,
      expiresAt,
    }: {
      userId: string;
      sanctionType: "warning" | "temporary_ban" | "permanent_ban";
      reason: string;
      reasonDetails?: string;
      expiresAt?: string;
    }) => {
      const { data, error } = await supabase.rpc("ban_user", {
        p_user_id: userId,
        p_sanction_type: sanctionType,
        p_reason: reason,
        p_reason_details: reasonDetails || null,
        p_expires_at: expiresAt || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Utilisateur banni avec succès");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors du bannissement");
    },
  });
}

// Hook pour dé-bannir un utilisateur
export function useUnbanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.rpc("unban_user", {
        p_user_id: userId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Utilisateur dé-banni avec succès");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors du dé-bannissement");
    },
  });
}

// Hook pour supprimer un compte utilisateur
export function useDeleteUserAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      reason,
      reasonDetails,
    }: {
      userId: string;
      reason: string;
      reasonDetails?: string;
    }) => {
      const { data, error } = await supabase.rpc("delete_user_account", {
        p_user_id: userId,
        p_reason: reason,
        p_reason_details: reasonDetails || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Compte utilisateur supprimé avec succès");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la suppression du compte");
    },
  });
}

// Hook pour récupérer les KPIs globaux
export function useAdminKPIs() {
  return useQuery({
    queryKey: ["admin", "kpis"],
    queryFn: async () => {
      const { data: globalStats, error: globalError } = await supabase
        .from("kpi_global_stats")
        .select("*")
        .single();

      if (globalError) throw globalError;

      const { data: engagementMetrics, error: engagementError } = await supabase
        .from("kpi_engagement_metrics")
        .select("*")
        .single();

      if (engagementError) throw engagementError;

      return {
        global: globalStats,
        engagement: engagementMetrics,
      };
    },
  });
}

// Interface pour les entrées avec COA
export interface EntryWithCOA {
  id: string;
  strain_name: string;
  category: string;
  status: string;
  coa_url: string | null;
  thc_percent: number | null;
  cbd_percent: number | null;
  created_at: string;
  coa_validated: boolean;
  coa_validated_at: string | null;
  producer_id: string;
  producer_name: string;
  producer_organization: string | null;
  contest_id: string;
  contest_name: string;
}

// Hook pour récupérer toutes les entrées avec COA
export function useEntriesWithCOA(statusFilter?: string) {
  return useQuery({
    queryKey: ["admin", "entries-coa", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("entries")
        .select(`
          id,
          strain_name,
          category,
          status,
          coa_url,
          thc_percent,
          cbd_percent,
          created_at,
          coa_validated,
          coa_validated_at,
          producer_id,
          producer:profiles!entries_producer_id_fkey (
            display_name,
            organization
          ),
          contest_id,
          contest:contests!entries_contest_id_fkey (
            name
          )
        `)
        .not("coa_url", "is", null)
        .order("created_at", { ascending: false });

      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((entry: any) => ({
        id: entry.id,
        strain_name: entry.strain_name,
        category: entry.category,
        status: entry.status,
        coa_url: entry.coa_url,
        thc_percent: entry.thc_percent,
        cbd_percent: entry.cbd_percent,
        created_at: entry.created_at,
        coa_validated: entry.coa_validated,
        coa_validated_at: entry.coa_validated_at,
        producer_id: entry.producer_id,
        producer_name: entry.producer?.display_name || "Producteur inconnu",
        producer_organization: entry.producer?.organization || null,
        contest_id: entry.contest_id,
        contest_name: entry.contest?.name || "Concours inconnu",
      })) as EntryWithCOA[];
    },
  });
}

