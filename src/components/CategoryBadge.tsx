/**
 * Composant Badge pour afficher la catégorie d'une entrée
 * Utilise get_entry_category_name() pour afficher le nom correct (custom ou global)
 */

import { Badge } from "@/components/ui/badge";
import { useEntryCategoryName } from "@/hooks/use-entry-category";
import { cn } from "@/lib/utils";

interface CategoryBadgeProps {
  entryId: string;
  fallbackCategory?: string; // Catégorie enum en fallback pendant le chargement
  className?: string;
  variant?: "default" | "secondary" | "outline" | "destructive";
}

export const CategoryBadge = ({
  entryId,
  fallbackCategory,
  className,
  variant = "default",
}: CategoryBadgeProps) => {
  const { data: categoryName, isLoading } = useEntryCategoryName(entryId);

  // Utiliser le nom de catégorie depuis la fonction SQL, ou fallback sur l'enum
  const displayName = categoryName || fallbackCategory || "Autre";

  return (
    <Badge
      variant={variant}
      className={cn(
        variant === "default" && "bg-accent/10 text-accent",
        className
      )}
    >
      {isLoading ? (
        <span className="animate-pulse">...</span>
      ) : (
        <span className="capitalize">{displayName}</span>
      )}
    </Badge>
  );
};

