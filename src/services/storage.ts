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
      supabase.rpc("log_coa_download", {
        p_entry_id: entryId,
        p_file_path: filePath,
        p_bucket_id: "entry-documents",
      }).catch((err) => {
        console.error("Error logging COA download:", err);
        // On continue même si le logging échoue
      });
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
    // Format Supabase Storage URL : https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
    // ou : https://[project].supabase.co/storage/v1/object/sign/[bucket]/[path]?...
    const match = url.match(/\/storage\/v1\/object\/(?:public|sign)\/[^/]+\/(.+?)(?:\?|$)/);
    return match ? match[1] : null;
  } catch {
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

