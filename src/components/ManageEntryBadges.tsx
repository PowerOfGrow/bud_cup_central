import { useState } from "react";
import { Award, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EntryBadges } from "./EntryBadges";
import type { Database } from "@/integrations/supabase/types";

type BadgeType = Database["public"]["Enums"]["badge_type"];

interface EntryBadge {
  id: string;
  badge: BadgeType;
  label: string;
  description: string | null;
}

interface ManageEntryBadgesProps {
  entryId: string;
  entryName: string;
  existingBadges?: EntryBadge[];
}

const badgeTypes: { value: BadgeType; label: string; description: string }[] = [
  { value: "gold", label: "🏆 Or", description: "Première place" },
  { value: "silver", label: "🥈 Argent", description: "Deuxième place" },
  { value: "bronze", label: "🥉 Bronze", description: "Troisième place" },
  {
    value: "people_choice",
    label: "❤️ Choix du public",
    description: "Meilleur score public",
  },
  {
    value: "innovation",
    label: "✨ Innovation",
    description: "Produit innovant",
  },
  {
    value: "terpene",
    label: "⭐ Meilleur terpène",
    description: "Meilleur profil terpénique",
  },
  {
    value: "compliance",
    label: "🛡️ Conformité",
    description: "Excellente conformité réglementaire",
  },
];

export const ManageEntryBadges = ({
  entryId,
  entryName,
  existingBadges = [],
}: ManageEntryBadgesProps) => {
  const [open, setOpen] = useState(false);
  const [badgeType, setBadgeType] = useState<BadgeType | "">("");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const queryClient = useQueryClient();

  // Récupérer les badges actuels
  const { data: badges, refetch } = useQuery({
    queryKey: ["entry-badges", entryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entry_badges")
        .select("*")
        .eq("entry_id", entryId)
        .order("awarded_at", { ascending: false });

      if (error) throw error;
      return (data || []) as EntryBadge[];
    },
    enabled: open,
  });

  const addBadgeMutation = useMutation({
    mutationFn: async () => {
      if (!badgeType || !label.trim()) {
        throw new Error("Veuillez remplir tous les champs obligatoires");
      }

      const { error } = await supabase.from("entry_badges").insert({
        entry_id: entryId,
        badge: badgeType as BadgeType,
        label: label.trim(),
        description: description.trim() || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Badge attribué avec succès !");
      setBadgeType("");
      setLabel("");
      setDescription("");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["contest-results"] });
      queryClient.invalidateQueries({ queryKey: ["entry-badges", entryId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de l'attribution du badge");
    },
  });

  const deleteBadgeMutation = useMutation({
    mutationFn: async (badgeId: string) => {
      const { error } = await supabase
        .from("entry_badges")
        .delete()
        .eq("id", badgeId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Badge retiré avec succès");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["contest-results"] });
      queryClient.invalidateQueries({ queryKey: ["entry-badges", entryId] });
    },
    onError: () => {
      toast.error("Erreur lors de la suppression du badge");
    },
  });

  const selectedBadgeInfo = badgeTypes.find((bt) => bt.value === badgeType);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addBadgeMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Award className="mr-2 h-4 w-4" />
          Gérer les badges
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gérer les badges - {entryName}</DialogTitle>
          <DialogDescription>
            Attribuez des badges pour récompenser cette entrée
          </DialogDescription>
        </DialogHeader>

        {/* Badges existants */}
        {badges && badges.length > 0 && (
          <div className="space-y-3">
            <Label>Badges actuels</Label>
            <div className="flex flex-wrap gap-2">
              <EntryBadges badges={badges} />
            </div>
            <div className="space-y-2">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center justify-between p-2 bg-muted/40 rounded-lg"
                >
                  <div>
                    <Badge variant="outline">{badge.label}</Badge>
                    {badge.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {badge.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteBadgeMutation.mutate(badge.id)}
                    disabled={deleteBadgeMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Formulaire d'ajout */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="badge-type">Type de badge *</Label>
            <Select
              value={badgeType}
              onValueChange={(value) => {
                setBadgeType(value as BadgeType);
                const badgeInfo = badgeTypes.find((bt) => bt.value === value);
                if (badgeInfo && !label) {
                  setLabel(badgeInfo.label);
                  setDescription(badgeInfo.description);
                }
              }}
            >
              <SelectTrigger id="badge-type">
                <SelectValue placeholder="Sélectionnez un type de badge" />
              </SelectTrigger>
              <SelectContent>
                {badgeTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label} - {type.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="badge-label">Label *</Label>
            <Input
              id="badge-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: Médaille d'or"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="badge-description">Description (optionnel)</Label>
            <Textarea
              id="badge-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Prix du meilleur produit..."
              rows={3}
            />
          </div>

          {selectedBadgeInfo && (
            <div className="p-3 bg-muted/40 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Description par défaut :</strong>{" "}
                {selectedBadgeInfo.description}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={addBadgeMutation.isPending || !badgeType || !label.trim()}
            >
              {addBadgeMutation.isPending ? "Ajout..." : "Ajouter le badge"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

