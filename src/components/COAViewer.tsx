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
}

export const COAViewer = ({
  entryId,
  coaUrl,
  variant = "button",
  className,
  showDownloadButton = true,
}: COAViewerProps) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

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

  const handleDownload = async () => {
    if (!signedUrl) {
      toast.error("URL non disponible");
      return;
    }

    try {
      // Le téléchargement est déjà logué dans getCOASignedUrl
      const response = await fetch(signedUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `COA_${entryId}_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
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
              </DialogDescription>
            </DialogHeader>
            <div className="w-full h-[70vh] border rounded-lg overflow-hidden">
              {signedUrl && (
                <iframe
                  src={signedUrl}
                  className="w-full h-full"
                  title="COA"
                />
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

