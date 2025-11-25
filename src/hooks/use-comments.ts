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
  status?: 'pending' | 'approved' | 'rejected' | 'hidden';
  spam_score?: number;
  flagged_as_spam?: boolean;
  moderation_reason?: string;
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
        .in("status", ["approved", "pending"]) // Afficher seulement les commentaires approuvés ou en attente
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as EntryComment[];
    },
    enabled: !!entryId,
  });

  // Ajouter un commentaire (avec modération automatique)
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user?.id) throw new Error("Utilisateur non authentifié");
      if (!content.trim()) throw new Error("Le commentaire ne peut pas être vide");

      // Utiliser la fonction RPC avec modération automatique
      const { data, error } = await supabase.rpc("create_comment_with_moderation", {
        p_entry_id: entryId,
        p_user_id: user.id,
        p_content: content.trim(),
      });

      if (error) throw error;

      // Si rate limit dépassé
      if (!data.success) {
        throw new Error(data.message || "Limite de commentaires dépassée");
      }

      // Récupérer le commentaire créé
      const { data: commentData, error: fetchError } = await supabase
        .from("entry_comments")
        .select(`
          *,
          user:profiles!entry_comments_user_id_fkey(id, display_name, avatar_url)
        `)
        .eq("id", data.comment_id)
        .single();

      if (fetchError) throw fetchError;

      const comment = commentData as EntryComment;

      // Afficher un message différent selon le statut
      if (comment.status === "pending") {
        toast.info("Votre commentaire est en attente de modération");
      } else {
        toast.success("Commentaire ajouté !");
      }

      return comment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", entryId] });
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

  // Signaler un commentaire
  const reportCommentMutation = useMutation({
    mutationFn: async ({ commentId, reason }: { commentId: string; reason: string }) => {
      if (!user?.id) throw new Error("Utilisateur non authentifié");

      const { data, error } = await supabase.rpc("report_comment", {
        p_comment_id: commentId,
        p_reporter_id: user.id,
        p_reason: reason,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", entryId] });
      toast.success("Commentaire signalé. Merci pour votre vigilance !");
    },
    onError: (error: any) => {
      if (error.message?.includes("unique")) {
        toast.error("Vous avez déjà signalé ce commentaire");
      } else {
        toast.error(error.message || "Erreur lors du signalement");
      }
    },
  });

  return {
    comments: comments || [],
    isLoading,
    error,
    addComment: addCommentMutation.mutate,
    updateComment: updateCommentMutation.mutate,
    deleteComment: deleteCommentMutation.mutate,
    reportComment: async (commentId: string, reason: string) => {
      reportCommentMutation.mutate({ commentId, reason });
    },
    isAdding: addCommentMutation.isPending,
    isUpdating: updateCommentMutation.isPending,
    isDeleting: deleteCommentMutation.isPending,
    canEdit: (comment: EntryComment) => user?.id === comment.user_id,
  };
};

