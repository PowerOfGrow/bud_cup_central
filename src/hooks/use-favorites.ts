import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { toast } from "sonner";

export interface Favorite {
  id: string;
  user_id: string;
  entry_id: string;
  created_at: string;
}

export const useFavorites = (entryId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Récupérer tous les favoris de l'utilisateur
  const { data: favorites, isLoading } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("favorites")
        .select("*, entry:entries(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as Favorite[];
    },
    enabled: !!user?.id,
  });

  // Vérifier si une entrée spécifique est en favoris
  const { data: isFavorite } = useQuery({
    queryKey: ["favorite", entryId, user?.id],
    queryFn: async () => {
      if (!entryId || !user?.id) return false;

      const { data, error } = await supabase
        .from("favorites")
        .select("id")
        .eq("entry_id", entryId)
        .eq("user_id", user.id)
        .maybeSingle();

      // maybeSingle() retourne null si aucun résultat, pas d'erreur
      if (error) {
        // Si l'erreur n'est pas "aucun résultat", on la log mais on retourne false
        if (error.code !== "PGRST116") {
          console.error("Error checking favorite:", error);
        }
        return false;
      }
      return !!data;
    },
    enabled: !!entryId && !!user?.id,
  });

  // Ajouter aux favoris
  const addFavoriteMutation = useMutation({
    mutationFn: async (entryIdToAdd: string) => {
      if (!user?.id) throw new Error("Utilisateur non authentifié");

      const { error } = await supabase
        .from("favorites")
        .insert({
          user_id: user.id,
          entry_id: entryIdToAdd,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites", user?.id] });
      if (entryId) {
        queryClient.invalidateQueries({ queryKey: ["favorite", entryId, user?.id] });
      }
      toast.success("Ajouté aux favoris");
    },
    onError: (error: any) => {
      if (error.code === "23505") {
        toast.error("Cette entrée est déjà dans vos favoris");
      } else {
        toast.error(error.message || "Erreur lors de l'ajout aux favoris");
      }
    },
  });

  // Retirer des favoris
  const removeFavoriteMutation = useMutation({
    mutationFn: async (entryIdToRemove: string) => {
      if (!user?.id) throw new Error("Utilisateur non authentifié");

      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("entry_id", entryIdToRemove);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites", user?.id] });
      if (entryId) {
        queryClient.invalidateQueries({ queryKey: ["favorite", entryId, user?.id] });
      }
      toast.success("Retiré des favoris");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la suppression des favoris");
    },
  });

  const toggleFavorite = (entryIdToToggle: string) => {
    if (isFavorite) {
      removeFavoriteMutation.mutate(entryIdToToggle);
    } else {
      addFavoriteMutation.mutate(entryIdToToggle);
    }
  };

  return {
    favorites: favorites || [],
    isFavorite: isFavorite || false,
    isLoading,
    toggleFavorite,
    addFavorite: addFavoriteMutation.mutate,
    removeFavorite: removeFavoriteMutation.mutate,
    isToggling: addFavoriteMutation.isPending || removeFavoriteMutation.isPending,
  };
};

