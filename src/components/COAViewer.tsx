/**
 * Composant pour afficher et télécharger les COA de manière sécurisée
 * Utilise des signed URLs avec expiration et logging
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Download, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { getCOASignedUrl, extractFilePathFromUrl, isSignedUrl } from "@/services/storage";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface COAViewerProps {
  entryId: string;
  coaUrl: string | null;
  variant?: "button" | "link" | "icon";
  className?: string;
  showDownloadButton?: boolean;
  entryName?: string; // Nom du produit/entrée pour le nom de fichier de téléchargement
}

export const COAViewer = ({
  entryId,
  coaUrl,
  variant = "button",
  className,
  showDownloadButton = true,
  entryName,
}: COAViewerProps) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [fileType, setFileType] = useState<"pdf" | "image" | "unknown">("unknown");

  useEffect(() => {
    // Si l'URL est déjà une signed URL ou une URL publique, on peut l'utiliser directement
    if (!coaUrl) {
      setSignedUrl(null);
      return;
    }

    if (isSignedUrl(coaUrl) || coaUrl.includes("/public/")) {
      setSignedUrl(coaUrl);
      return;
    }

    // Sinon, générer une signed URL
    const loadSignedUrl = async () => {
      const filePath = extractFilePathFromUrl(coaUrl);
      if (!filePath) {
        setError("Impossible d'extraire le chemin du fichier");
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const url = await getCOASignedUrl(entryId, filePath, 3600);
        if (url) {
          setSignedUrl(url);
        } else {
          setError("Impossible de générer l'URL sécurisée pour le COA");
        }
      } catch (err) {
        console.error("Error loading COA signed URL:", err);
        setError("Erreur lors du chargement du COA");
      } finally {
        setLoading(false);
      }
    };

    loadSignedUrl();
  }, [entryId, coaUrl]);

  const handleOpen = () => {
    if (signedUrl) {
      setIsOpen(true);
    }
  };

  // Déterminer le type de fichier à partir de l'URL
  const detectFileType = (url: string): "pdf" | "image" | "unknown" => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes(".pdf") || lowerUrl.includes("application/pdf")) {
      return "pdf";
    }
    if (
      lowerUrl.includes(".jpg") ||
      lowerUrl.includes(".jpeg") ||
      lowerUrl.includes("image/jpeg") ||
      lowerUrl.includes(".png") ||
      lowerUrl.includes("image/png") ||
      lowerUrl.includes(".webp") ||
      lowerUrl.includes("image/webp")
    ) {
      return "image";
    }
    return "unknown";
  };

  // Obtenir l'extension du fichier pour le téléchargement
  const getFileExtension = (url: string): string => {
    const match = url.match(/\.([a-z0-9]+)(?:\?|$)/i);
    return match ? match[1] : "pdf";
  };


  const handleDownload = async () => {
    if (!signedUrl) {
      toast.error("URL non disponible");
      return;
    }

    try {
      // Télécharger le fichier avec les bons headers
      const response = await fetch(signedUrl, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      // Récupérer le type MIME depuis les headers ou le détecter depuis l'URL
      const contentType = response.headers.get('Content-Type') || 
        (signedUrl.toLowerCase().includes('.pdf') ? 'application/pdf' :
         signedUrl.toLowerCase().includes('.jpg') || signedUrl.toLowerCase().includes('.jpeg') ? 'image/jpeg' :
         signedUrl.toLowerCase().includes('.png') ? 'image/png' :
         signedUrl.toLowerCase().includes('.webp') ? 'image/webp' :
         'application/octet-stream');

      // Créer le blob avec le bon type MIME
      const blob = await response.blob();
      const typedBlob = new Blob([blob], { type: contentType });
      
      const url = window.URL.createObjectURL(typedBlob);
      const a = document.createElement("a");
      a.href = url;
      
      // Générer un nom de fichier informatif
      const extension = getFileExtension(signedUrl);
      const sanitizedName = entryName
        ? entryName.replace(/[^a-z0-9]/gi, "_").toLowerCase()
        : entryId.substring(0, 8);
      const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      a.download = `COA_${sanitizedName}_${timestamp}.${extension}`;
      
      // Définir le type MIME pour le téléchargement
      a.type = contentType;
      
      document.body.appendChild(a);
      a.click();
      
      // Nettoyer après un court délai pour s'assurer que le téléchargement a démarré
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
      toast.success("COA téléchargé avec succès");
    } catch (err) {
      console.error("Error downloading COA:", err);
      toast.error("Erreur lors du téléchargement du COA");
    }
  };

  if (!coaUrl) {
    return null;
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-destructive text-sm">
        <AlertCircle className="h-4 w-4" />
        <span>{error}</span>
      </div>
    );
  }

  if (variant === "button") {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpen}
          disabled={loading || !signedUrl}
          className={className}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Chargement...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Voir le COA
            </>
          )}
        </Button>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Certificat d'Analyse (COA)</DialogTitle>
              <DialogDescription>
                Document confidentiel - CBD Flower Cup
                {entryName && ` - ${entryName}`}
              </DialogDescription>
            </DialogHeader>
            <div className="w-full h-[70vh] border rounded-lg overflow-hidden bg-muted/20">
              {signedUrl && (
                <>
                  {fileType === "pdf" ? (
                    <iframe
                      src={signedUrl}
                      className="w-full h-full"
                      title="COA"
                      style={{ border: "none" }}
                    />
                  ) : fileType === "image" ? (
                    <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
                      <img
                        src={signedUrl}
                        alt="Certificat d'Analyse"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground mb-4">
                          Format de fichier non reconnu
                        </p>
                        <Button variant="outline" asChild>
                          <a href={signedUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Ouvrir dans un nouvel onglet
                          </a>
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            {showDownloadButton && signedUrl && (
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger
                </Button>
                <Button variant="default" asChild>
                  <a href={signedUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Ouvrir dans un nouvel onglet
                  </a>
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (variant === "link") {
    return (
      <a
        href={signedUrl || undefined}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          if (!signedUrl || loading) {
            e.preventDefault();
            if (!signedUrl) {
              toast.error("COA non disponible");
            }
          }
        }}
        className={`text-sm text-accent hover:underline inline-flex items-center gap-1 ${className}`}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement...
          </>
        ) : (
          <>
            <FileText className="h-4 w-4" />
            Voir le COA
          </>
        )}
      </a>
    );
  }

  // variant === "icon"
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleOpen}
      disabled={loading || !signedUrl}
      className={className}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileText className="h-4 w-4" />
      )}
    </Button>
  );
};

