import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UseFileUploadOptions {
  bucket: "entry-photos" | "entry-documents";
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
}

export const useFileUpload = ({ bucket, onSuccess, onError }: UseFileUploadOptions) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    if (!file) return null;

    setUploading(true);
    setProgress(0);

    try {
      // Générer un nom de fichier unique avec timestamp
      const fileExt = file.name.split(".").pop();
      const fileName = `${path}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Upload du fichier
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // Récupérer l'URL publique
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      const publicUrl = urlData.publicUrl;

      setProgress(100);
      onSuccess?.(publicUrl);
      return publicUrl;
    } catch (error: any) {
      console.error("Error uploading file:", error);
      const errorMessage = error?.message || "Erreur lors de l'upload du fichier";
      toast.error(errorMessage);
      onError?.(error as Error);
      return null;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const deleteFile = async (filePath: string): Promise<boolean> => {
    try {
      // Extraire le chemin du fichier depuis l'URL complète
      const path = filePath.split(`${bucket}/`)[1];
      if (!path) {
        throw new Error("Chemin de fichier invalide");
      }

      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        throw error;
      }

      return true;
    } catch (error: any) {
      console.error("Error deleting file:", error);
      toast.error(error?.message || "Erreur lors de la suppression du fichier");
      return false;
    }
  };

  return {
    uploadFile,
    deleteFile,
    uploading,
    progress,
  };
};

