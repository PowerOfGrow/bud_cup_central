import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "./use-auth";

export interface UserOnboardingStatus {
  id: string;
  user_id: string;
  display_name?: string;
  role: "organizer" | "producer" | "judge" | "viewer";
  onboarding_completed: boolean;
  current_step: number;
  completed_steps: number[];
  skipped: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  completed_steps_count: number | null;
}

export const useOnboarding = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  // Récupérer l'état de l'onboarding
  const { data: onboardingStatus, isLoading } = useQuery({
    queryKey: ["onboarding", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Utiliser la table directement et joindre avec profiles pour obtenir les infos supplémentaires
      const { data, error } = await supabase
        .from("user_onboarding")
        .select(`
          *,
          profiles!user_onboarding_user_id_fkey (
            display_name,
            role
          )
        `)
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        throw error;
      }

      if (!data) return null;

      // Transformer les données pour correspondre à l'interface
      const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
      
      return {
        id: data.id,
        user_id: data.user_id,
        display_name: profile?.display_name,
        role: profile?.role || data.role,
        onboarding_completed: data.onboarding_completed,
        current_step: data.current_step,
        completed_steps: Array.isArray(data.completed_steps) 
          ? data.completed_steps.map((s: unknown) => typeof s === 'number' ? s : parseInt(String(s)))
          : [],
        skipped: data.skipped,
        completed_at: data.completed_at,
        created_at: data.created_at,
        updated_at: data.updated_at,
        completed_steps_count: Array.isArray(data.completed_steps) ? data.completed_steps.length : 0,
      } as UserOnboardingStatus;
    },
    enabled: !!user?.id,
  });

  // Marquer une étape comme complétée
  const completeStepMutation = useMutation({
    mutationFn: async (stepNumber: number) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase.rpc("complete_onboarding_step", {
        p_user_id: user.id,
        p_step_number: stepNumber,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding", user?.id] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la sauvegarde : ${error.message}`);
    },
  });

  // Compléter tout l'onboarding
  const completeOnboardingMutation = useMutation({
    mutationFn: async (skip: boolean = false) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase.rpc("complete_onboarding", {
        p_user_id: user.id,
        p_skip: skip,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["onboarding", user?.id] });
      if (!variables) {
        toast.success("Onboarding terminé ! Bienvenue sur la plateforme 🎉");
      }
    },
    onError: (error: Error) => {
      toast.error(`Erreur : ${error.message}`);
    },
  });

  // Réinitialiser l'onboarding (pour tests ou réaffichage)
  const resetOnboardingMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase.rpc("reset_onboarding", {
        p_user_id: user.id,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding", user?.id] });
      toast.success("Onboarding réinitialisé");
    },
    onError: (error: Error) => {
      toast.error(`Erreur : ${error.message}`);
    },
  });

  // Déterminer si l'onboarding doit être affiché
  const shouldShowOnboarding = () => {
    if (!onboardingStatus || isLoading) return false;
    return !onboardingStatus.onboarding_completed && !onboardingStatus.skipped;
  };

  return {
    onboardingStatus,
    isLoading,
    shouldShowOnboarding: shouldShowOnboarding(),
    completeStep: completeStepMutation.mutate,
    completeOnboarding: (skip?: boolean) => completeOnboardingMutation.mutate(skip),
    resetOnboarding: resetOnboardingMutation.mutate,
    isCompleting: completeOnboardingMutation.isPending,
    isCompletingStep: completeStepMutation.isPending,
  };
};

