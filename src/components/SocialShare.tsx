/**
 * Composant de partage social amélioré
 * Propose des boutons spécifiques pour Facebook, Twitter, LinkedIn
 * avec fallback sur l'API native du navigateur
 */

import { useState } from "react";
import { Share2, Facebook, Twitter, Linkedin, Link2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
  variant?: "button" | "icon";
  className?: string;
}

export const SocialShare = ({
  url,
  title,
  description = "",
  variant = "icon",
  className = "",
}: SocialShareProps) => {
  const [copied, setCopied] = useState(false);

  // Encoder les paramètres pour les URLs
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description || title);

  // URLs de partage pour chaque plateforme
  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}${description ? `&via=CBDFlowerCup` : ""}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  };

  const handleShare = (platform: "facebook" | "twitter" | "linkedin" | "native" | "copy") => {
    if (platform === "native" && navigator.share) {
      // Utiliser l'API native du navigateur
      navigator
        .share({
          title: title,
          text: description || title,
          url: url,
        })
        .catch(() => {
          // L'utilisateur a annulé ou une erreur est survenue
        });
      return;
    }

    if (platform === "copy") {
      // Copier dans le presse-papiers
      navigator.clipboard
        .writeText(url)
        .then(() => {
          setCopied(true);
          toast.success("Lien copié dans le presse-papiers !");
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {
          toast.error("Impossible de copier le lien");
        });
      return;
    }

    // Ouvrir la fenêtre de partage de la plateforme
    const width = 600;
    const height = 400;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(
      shareLinks[platform],
      "share",
      `width=${width},height=${height},left=${left},top=${top},toolbar=0,status=0`
    );
  };

  const triggerButton = variant === "icon" ? (
    <Button variant="ghost" size="icon" className={`h-8 w-8 ${className}`} title="Partager">
      <Share2 className="h-4 w-4 text-muted-foreground" />
    </Button>
  ) : (
    <Button variant="outline" size="sm" className={`gap-2 ${className}`}>
      <Share2 className="h-4 w-4" />
      Partager
    </Button>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{triggerButton}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {navigator.share && (
          <>
            <DropdownMenuItem onClick={() => handleShare("native")} className="cursor-pointer">
              <Share2 className="mr-2 h-4 w-4" />
              Partager via...
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={() => handleShare("facebook")} className="cursor-pointer">
          <Facebook className="mr-2 h-4 w-4 text-[#1877F2]" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare("twitter")} className="cursor-pointer">
          <Twitter className="mr-2 h-4 w-4 text-[#1DA1F2]" />
          Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare("linkedin")} className="cursor-pointer">
          <Linkedin className="mr-2 h-4 w-4 text-[#0077B5]" />
          LinkedIn
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleShare("copy")} className="cursor-pointer">
          {copied ? (
            <>
              <Copy className="mr-2 h-4 w-4 text-green-500" />
              <span className="text-green-500">Copié !</span>
            </>
          ) : (
            <>
              <Link2 className="mr-2 h-4 w-4" />
              Copier le lien
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

