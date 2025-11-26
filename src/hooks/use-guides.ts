import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Guide {
  id: string;
  category: "producer" | "judge" | "viewer" | "organizer";
  title: string;
  description: string | null;
  file_path: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

const categoryLabels: Record<Guide["category"], string> = {
  producer: "Guide Producteur",
  judge: "Guide Juge",
  viewer: "Guide Utilisateur Gratuit",
  organizer: "Guide Organisateur",
};

export const getCategoryLabel = (category: Guide["category"]) => {
  return categoryLabels[category] || category;
};

// Récupérer tous les guides actifs
export const useGuides = () => {
  return useQuery({
    queryKey: ["guides"],
    queryFn: async (): Promise<Guide[]> => {
      const { data, error } = await supabase
        .from("guides")
        .select("*")
        .eq("is_active", true)
        .order("category", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};

// Récupérer un guide par catégorie
export const useGuideByCategory = (category: Guide["category"]) => {
  return useQuery({
    queryKey: ["guides", category],
    queryFn: async (): Promise<Guide | null> => {
      const { data, error } = await supabase
        .from("guides")
        .select("*")
        .eq("category", category)
        .eq("is_active", true)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // Aucun guide trouvé
          return null;
        }
        throw error;
      }
      return data;
    },
  });
};

// Récupérer tous les guides (y compris inactifs) - pour l'administration
export const useAllGuides = () => {
  return useQuery({
    queryKey: ["guides", "all"],
    queryFn: async (): Promise<Guide[]> => {
      const { data, error } = await supabase
        .from("guides")
        .select("*")
        .order("category", { ascending: true })
        .order("is_active", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};

// Créer un nouveau guide
export const useCreateGuide = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      category,
      title,
      description,
      file_path,
      file_name,
      file_size,
      mime_type,
    }: {
      category: Guide["category"];
      title: string;
      description?: string;
      file_path: string;
      file_name: string;
      file_size?: number;
      mime_type?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data, error } = await supabase
        .from("guides")
        .insert({
          category,
          title,
          description: description || null,
          file_path,
          file_name,
          file_size: file_size || null,
          mime_type: mime_type || "application/pdf",
          uploaded_by: user.id,
          is_active: true, // Le trigger désactivera automatiquement l'ancien
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guides"] });
    },
  });
};

// Mettre à jour un guide
export const useUpdateGuide = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      title,
      description,
      is_active,
    }: {
      id: string;
      title?: string;
      description?: string;
      is_active?: boolean;
    }) => {
      const { data, error } = await supabase
        .from("guides")
        .update({
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(is_active !== undefined && { is_active }),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guides"] });
    },
  });
};

// Supprimer un guide
export const useDeleteGuide = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Récupérer le guide pour supprimer le fichier du storage
      const { data: guide, error: fetchError } = await supabase
        .from("guides")
        .select("file_path")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      // Supprimer le fichier du storage
      if (guide?.file_path) {
        const { error: storageError } = await supabase.storage
          .from("guides")
          .remove([guide.file_path]);

        if (storageError) {
          console.error("Erreur lors de la suppression du fichier:", storageError);
          // On continue quand même la suppression de la DB
        }
      }

      // Supprimer de la base de données
      const { error } = await supabase.from("guides").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guides"] });
    },
  });
};

// Obtenir une URL signée pour télécharger un guide
export const getGuideDownloadUrl = async (guide: Guide): Promise<string | null> => {
  try {
    const { data, error } = await supabase.storage
      .from("guides")
      .createSignedUrl(guide.file_path, 3600); // URL valide 1 heure

    if (error) throw error;
    return data.signedUrl;
  } catch (error) {
    console.error("Erreur lors de la génération de l'URL signée:", error);
    return null;
  }
};

