import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { toast } from "sonner";

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_enabled: boolean;
  email_contest_created: boolean;
  email_entry_approved: boolean;
  email_judge_assigned: boolean;
  email_results_published: boolean;
  email_vote_received: boolean;
  email_score_received: boolean;
  in_app_enabled: boolean;
  in_app_contest_created: boolean;
  in_app_entry_approved: boolean;
  in_app_judge_assigned: boolean;
  in_app_results_published: boolean;
  in_app_vote_received: boolean;
  in_app_score_received: boolean;
  created_at: string;
  updated_at: string;
}

export const useNotificationPreferences = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Récupérer les préférences
  const { data: preferences, isLoading, error } = useQuery({
    queryKey: ["notification-preferences", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      
      // Si aucune préférence n'existe, créer les préférences par défaut
      if (!data) {
        const { data: newPrefs, error: insertError } = await supabase
          .from("notification_preferences")
          .insert({ user_id: user.id })
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newPrefs as NotificationPreferences;
      }

      return data as NotificationPreferences;
    },
    enabled: !!user?.id,
  });

  // Mettre à jour les préférences
  const updatePreferencesMutation = useMutation({
    mutationFn: async (updates: Partial<NotificationPreferences>) => {
      if (!user?.id) throw new Error("Utilisateur non authentifié");

      const { data, error } = await supabase
        .from("notification_preferences")
        .update(updates)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data as NotificationPreferences;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences", user?.id] });
      toast.success("Préférences mises à jour !");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la mise à jour des préférences");
    },
  });

  return {
    preferences,
    isLoading,
    error,
    updatePreferences: updatePreferencesMutation.mutate,
    isUpdating: updatePreferencesMutation.isPending,
  };
};

