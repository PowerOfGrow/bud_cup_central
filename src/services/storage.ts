/**
 * Service pour la gestion sécurisée du stockage Supabase
 * Inclut la génération de signed URLs pour les documents privés
 */

import { supabase } from "@/integrations/supabase/client";

export interface SignedUrlOptions {
  expiresIn?: number; // Durée de validité en secondes (par défaut : 3600 = 1h)
}

/**
 * Génère une URL signée pour accéder à un fichier privé dans un bucket
 * @param bucket Nom du bucket
 * @param filePath Chemin du fichier
 * @param expiresIn Durée de validité en secondes (défaut : 3600 = 1h)
 * @returns URL signée valide pendant expiresIn secondes
 */
export async function getSignedUrl(
  bucket: string,
  filePath: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error("Error creating signed URL:", error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error("Error in getSignedUrl:", error);
    return null;
  }
}

/**
 * Récupère une URL signée pour un document COA et log le téléchargement
 * @param entryId ID de l'entrée
 * @param filePath Chemin du fichier dans le bucket
 * @param expiresIn Durée de validité en secondes (défaut : 3600 = 1h)
 * @returns URL signée valide pendant expiresIn secondes
 */
export async function getCOASignedUrl(
  entryId: string,
  filePath: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("User not authenticated");
      return null;
    }

    // Vérifier la limite de téléchargements
    const { data: canDownload, error: limitError } = await supabase.rpc(
      "check_coa_download_limit",
      {
        p_user_id: user.id,
        p_max_downloads_per_day: 50,
      }
    );

    if (limitError) {
      console.error("Error checking download limit:", limitError);
      // On continue même en cas d'erreur sur la vérification de limite
    }

    if (canDownload === false) {
      console.error("Download limit exceeded");
      return null;
    }

    // Générer l'URL signée
    const signedUrl = await getSignedUrl("entry-documents", filePath, expiresIn);

    if (signedUrl) {
      // Logger le téléchargement (en arrière-plan, ne bloque pas si ça échoue)
      try {
        const { error: logError } = await supabase.rpc("log_coa_download", {
          p_entry_id: entryId,
          p_file_path: filePath,
          p_bucket_id: "entry-documents",
        });
        
        if (logError) {
          console.error("Error logging COA download:", logError);
          // On continue même si le logging échoue
        }
      } catch (logErr) {
        console.error("Error logging COA download:", logErr);
        // On continue même si le logging échoue
      }
    }

    return signedUrl;
  } catch (error) {
    console.error("Error in getCOASignedUrl:", error);
    return null;
  }
}

/**
 * Extrait le chemin du fichier depuis une URL complète de storage
 * @param url URL complète du fichier
 * @returns Chemin du fichier relatif au bucket
 */
export function extractFilePathFromUrl(url: string): string | null {
  try {
    // Formats possibles :
    // 1. https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
    // 2. https://[project].supabase.co/storage/v1/object/sign/[bucket]/[path]?token=...
    // 3. https://[project].supabase.co/storage/v1/object/[bucket]/[path]?...
    
    // Décoder l'URL au cas où elle serait encodée
    const decodedUrl = decodeURIComponent(url);
    
    // Pattern pour extraire le chemin après le nom du bucket
    const patterns = [
      /\/storage\/v1\/object\/(?:public|sign)\/[^/]+\/(.+?)(?:\?|$)/,
      /\/storage\/v1\/object\/[^/]+\/(.+?)(?:\?|$)/,
      // Pattern pour URLs qui ont déjà le chemin directement
      /\/entry-documents\/(.+?)(?:\?|$)/
    ];
    
    for (const pattern of patterns) {
      const match = decodedUrl.match(pattern);
      if (match && match[1]) {
        // Décoder le chemin au cas où il contiendrait des caractères encodés
        return decodeURIComponent(match[1]);
      }
    }
    
    console.error("Impossible d'extraire le chemin du fichier. URL:", url);
    return null;
  } catch (error) {
    console.error("Error extracting file path from URL:", error, "URL:", url);
    return null;
  }
}

/**
 * Vérifie si une URL est une URL signée (contient des paramètres de signature)
 */
export function isSignedUrl(url: string): boolean {
  return url.includes("sign") || url.includes("token=");
}

/**
 * Supprime un fichier COA du storage
 * @param coaUrl URL complète du fichier COA
 * @returns true si la suppression a réussi, false sinon
 */
export async function deleteCOAFile(coaUrl: string): Promise<boolean> {
  try {
    const filePath = extractFilePathFromUrl(coaUrl);
    if (!filePath) {
      console.error("Impossible d'extraire le chemin du fichier depuis l'URL:", coaUrl);
      return false;
    }

    console.log("Attempting to delete COA file from path:", filePath);
    
    // Vérifier que l'utilisateur est authentifié et a les permissions
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("User not authenticated when trying to delete COA file");
      return false;
    }

    // Vérifier que l'utilisateur est organisateur
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "organizer") {
      console.error("User is not an organizer, cannot delete COA file");
      return false;
    }

    const { data, error } = await supabase.storage
      .from("entry-documents")
      .remove([filePath]);

    if (error) {
      console.error("Error deleting COA file from storage:", error);
      console.error("File path attempted:", filePath);
      console.error("Original URL:", coaUrl);
      return false;
    }

    console.log("COA file deleted successfully:", filePath);
    return true;
  } catch (error) {
    console.error("Error in deleteCOAFile:", error);
    return false;
  }
}

/**
 * Cache pour les URLs signées (évite de régénérer trop souvent)
 */
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

/**
 * Récupère une URL signée avec cache (régénère seulement si expirée)
 * @param bucket Nom du bucket
 * @param filePath Chemin du fichier
 * @param expiresIn Durée de validité en secondes
 * @returns URL signée (depuis cache si valide, sinon générée)
 */
export async function getSignedUrlWithCache(
  bucket: string,
  filePath: string,
  expiresIn: number = 3600
): Promise<string | null> {
  const cacheKey = `${bucket}:${filePath}`;
  const cached = signedUrlCache.get(cacheKey);

  // Vérifier si l'URL en cache est encore valide (avec une marge de 5 minutes)
  if (cached && cached.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cached.url;
  }

  // Générer une nouvelle URL
  const url = await getSignedUrl(bucket, filePath, expiresIn);
  if (url) {
    signedUrlCache.set(cacheKey, {
      url,
      expiresAt: Date.now() + (expiresIn - 300) * 1000, // Expire 5 min avant pour sécurité
    });
  }

  return url;
}

