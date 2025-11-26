/**
 * Composant pour afficher un QR code permettant de partager une entrée
 * Génère le QR code dynamiquement pour l'URL de l'entrée
 */

import { useState, useEffect } from "react";
import { QRCodeSVG } from "react-qr-code";
import { QrCode, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface QRCodeDisplayProps {
  entryId: string;
  entryName?: string;
  variant?: "button" | "inline" | "icon";
  className?: string;
}

export const QRCodeDisplay = ({
  entryId,
  entryName,
  variant = "button",
  className = "",
}: QRCodeDisplayProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Vérifier que entryId est défini (après les hooks pour respecter les règles de React)
  if (!entryId) {
    console.error("QRCodeDisplay: entryId is required but was undefined");
    return null;
  }

  // Générer l'URL complète de l'entrée
  const entryUrl = entryId ? `${window.location.origin}/vote/${entryId}` : "";

  // Fonction pour télécharger le QR code
  const handleDownload = () => {
    // Trouver le SVG dans le DOM
    const svgElement = document.querySelector(`#qr-code-${entryId} svg`) as SVGSVGElement;
    if (!svgElement) return;

    // Convertir SVG en image
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 512; // Taille fixe pour une bonne qualité
      canvas.height = 512;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const sanitizedName = entryName
              ? entryName.replace(/[^a-z0-9]/gi, "_").toLowerCase()
              : entryId.substring(0, 8);
            a.download = `QRCode_${sanitizedName}.png`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }, 100);
          }
        }, "image/png");
      }
    };

    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    img.src = url;
  };

  if (variant === "inline") {
    if (!entryUrl) return null;
    return (
      <div className={`flex flex-col items-center gap-2 p-4 bg-muted/50 rounded-lg ${className}`}>
        <div id={`qr-code-${entryId}`} className="bg-white p-3 rounded-lg">
          {QRCodeSVG && (
            <QRCodeSVG
              value={entryUrl}
              size={128}
              level="M"
              includeMargin={false}
            />
          )}
        </div>
        <p className="text-xs text-muted-foreground text-center max-w-[128px] break-words">
          Scannez pour voir l'entrée
        </p>
      </div>
    );
  }

  if (variant === "icon") {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(true)}
          className={className}
          title="Voir le QR code"
        >
          <QrCode className="h-4 w-4" />
        </Button>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>QR Code pour partager</DialogTitle>
              <DialogDescription>
                Scannez ce code pour accéder directement à {entryName || "cette entrée"}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              <div id={`qr-code-${entryId}`} className="bg-white p-4 rounded-lg border-2 border-border">
                {entryUrl ? (
                  <QRCodeSVG
                    value={entryUrl}
                    size={256}
                    level="M"
                    includeMargin={false}
                  />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center text-muted-foreground">
                    Chargement du QR code...
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center gap-2 w-full">
                <p className="text-xs text-muted-foreground text-center break-all">
                  {entryUrl}
                </p>
                <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
                  <Download className="h-4 w-4" />
                  Télécharger le QR code
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // variant === "button"
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={`gap-2 ${className}`}
      >
        <QrCode className="h-4 w-4" />
        QR Code
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code pour partager</DialogTitle>
            <DialogDescription>
              Scannez ce code pour accéder directement à {entryName || "cette entrée"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div id={`qr-code-${entryId}`} className="bg-white p-4 rounded-lg border-2 border-border">
              {entryUrl ? (
                <QRCodeSVG
                  value={entryUrl}
                  size={256}
                  level="M"
                  includeMargin={false}
                />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center text-muted-foreground">
                  Impossible de générer le QR code
                </div>
              )}
            </div>
            <div className="flex flex-col items-center gap-2 w-full">
              <p className="text-xs text-muted-foreground text-center break-all px-4">
                {entryUrl}
              </p>
              <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
                <Download className="h-4 w-4" />
                Télécharger le QR code
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

