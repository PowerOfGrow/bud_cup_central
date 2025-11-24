import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { toast } from "sonner";

export interface EntryComment {
  id: string;
  entry_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
}

export const useComments = (entryId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Récupérer tous les commentaires d'une entrée
  const { data: comments, isLoading, error } = useQuery({
    queryKey: ["comments", entryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entry_comments")
        .select(`
          *,
          user:profiles!entry_comments_user_id_fkey(id, display_name, avatar_url)
        `)
        .eq("entry_id", entryId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as EntryComment[];
    },
    enabled: !!entryId,
  });

  // Ajouter un commentaire
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user?.id) throw new Error("Utilisateur non authentifié");
      if (!content.trim()) throw new Error("Le commentaire ne peut pas être vide");

      const { data, error } = await supabase
        .from("entry_comments")
        .insert({
          entry_id: entryId,
          user_id: user.id,
          content: content.trim(),
        })
        .select(`
          *,
          user:profiles!entry_comments_user_id_fkey(id, display_name, avatar_url)
        `)
        .single();

      if (error) throw error;
      return data as EntryComment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", entryId] });
      toast.success("Commentaire ajouté !");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de l'ajout du commentaire");
    },
  });

  // Modifier un commentaire
  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      if (!user?.id) throw new Error("Utilisateur non authentifié");
      if (!content.trim()) throw new Error("Le commentaire ne peut pas être vide");

      const { error } = await supabase
        .from("entry_comments")
        .update({
          content: content.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", commentId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", entryId] });
      toast.success("Commentaire modifié !");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la modification du commentaire");
    },
  });

  // Supprimer un commentaire
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      if (!user?.id) throw new Error("Utilisateur non authentifié");

      const { error } = await supabase
        .from("entry_comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", entryId] });
      toast.success("Commentaire supprimé !");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la suppression du commentaire");
    },
  });

  return {
    comments: comments || [],
    isLoading,
    error,
    addComment: addCommentMutation.mutate,
    updateComment: updateCommentMutation.mutate,
    deleteComment: deleteCommentMutation.mutate,
    isAdding: addCommentMutation.isPending,
    isUpdating: updateCommentMutation.isPending,
    isDeleting: deleteCommentMutation.isPending,
    canEdit: (comment: EntryComment) => user?.id === comment.user_id,
  };
};

