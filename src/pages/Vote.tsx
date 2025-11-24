import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";

const Vote = () => {
  const { entryId } = useParams<{ entryId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  // Récupérer l'entrée
  const { data: entry, isLoading, error } = useQuery({
    queryKey: ["entry", entryId],
    queryFn: async () => {
      if (!entryId) throw new Error("Entry ID manquant");
      const { data, error } = await supabase
        .from("entries")
        .select(
          `
          *,
          contest:contests(id, name, status),
          producer:profiles!entries_producer_id_fkey(display_name, organization)
        `
        )
        .eq("id", entryId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!entryId,
  });

  // Vérifier si l'utilisateur a déjà voté
  const { data: existingVote } = useQuery({
    queryKey: ["vote", entryId, user?.id],
    queryFn: async () => {
      if (!entryId || !user?.id) return null;
      const { data } = await supabase
        .from("public_votes")
        .select("*")
        .eq("entry_id", entryId)
        .eq("voter_profile_id", user.id)
        .single();

      return data;
    },
    enabled: !!entryId && !!user?.id,
  });

  const [score, setScore] = useState<number>(existingVote?.score ?? 0);
  const [comment, setComment] = useState<string>(existingVote?.comment ?? "");

  const voteMutation = useMutation({
    mutationFn: async (voteData: { score: number; comment: string }) => {
      if (!entryId || !user?.id) throw new Error("Données manquantes");

      if (existingVote) {
        // Mettre à jour le vote existant
        const { error } = await supabase
          .from("public_votes")
          .update({
            score: voteData.score,
            comment: voteData.comment,
          })
          .eq("id", existingVote.id);

        if (error) throw error;
      } else {
        // Créer un nouveau vote
        const { error } = await supabase.from("public_votes").insert({
          entry_id: entryId,
          voter_profile_id: user.id,
          score: voteData.score,
          comment: voteData.comment,
        });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vote", entryId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ["entry", entryId] });
      toast.success(existingVote ? "Vote mis à jour !" : "Vote enregistré !");
      navigate(-1);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de l'enregistrement du vote");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (score === 0) {
      toast.error("Veuillez sélectionner une note");
      return;
    }
    voteMutation.mutate({ score, comment });
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="pt-28 pb-16">
          <div className="container mx-auto px-4">
            <ErrorState message="Vous devez être connecté pour voter" />
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="pt-28 pb-16">
          <div className="container mx-auto px-4">
            <LoadingState message="Chargement de l'entrée…" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="pt-28 pb-16">
          <div className="container mx-auto px-4">
            <ErrorState message="Impossible de charger l'entrée" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{entry.strain_name}</CardTitle>
              <CardDescription>
                {entry.producer?.display_name}
                {entry.producer?.organization && ` • ${entry.producer.organization}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label>Note (1-5 étoiles)</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setScore(value)}
                        className={`transition-all ${
                          score >= value
                            ? "text-accent scale-110"
                            : "text-muted-foreground hover:text-accent/50"
                        }`}
                      >
                        <Star
                          className={`h-8 w-8 ${
                            score >= value ? "fill-current" : ""
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {score > 0 ? `${score} / 5` : "Sélectionnez une note"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comment">Commentaire (optionnel)</Label>
                  <Textarea
                    id="comment"
                    placeholder="Partagez votre avis sur cette variété..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={score === 0 || voteMutation.isPending}
                  >
                    {voteMutation.isPending
                      ? "Enregistrement..."
                      : existingVote
                        ? "Mettre à jour le vote"
                        : "Enregistrer le vote"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Vote;

