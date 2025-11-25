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
import { CommentsSection } from "@/components/CommentsSection";
import { ErrorState } from "@/components/ErrorState";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";

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

      // Récupérer l'IP et user agent pour anti-fraude
      // Note: L'IP réelle sera capturée côté serveur, on envoie juste le user agent
      const userAgent = navigator.userAgent;

      // Utiliser la fonction PostgreSQL qui inclut le rate limiting et les vérifications anti-fraude
      const { data, error } = await supabase.rpc("create_public_vote", {
        p_entry_id: entryId,
        p_voter_profile_id: user.id,
        p_score: voteData.score as number,
        p_comment: voteData.comment || null,
        p_ip_address: null, // L'IP sera capturée automatiquement côté serveur via Supabase
        p_user_agent: userAgent,
      });

      if (error) {
        // Gérer les erreurs de rate limiting de manière conviviale
        if (error.message.includes("Rate limit exceeded")) {
          throw new Error(
            "Vous avez atteint la limite de votes. Veuillez patienter avant de voter à nouveau."
          );
        }
        if (error.message.includes("Suspicious activity")) {
          throw new Error(
            "Activité suspecte détectée. Si vous pensez qu'il s'agit d'une erreur, contactez le support."
          );
        }
        throw error;
      }

      return data;
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
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-2xl">{entry.strain_name}</CardTitle>
                  <CardDescription>
                    {entry.producer?.display_name}
                    {entry.producer?.organization && ` • ${entry.producer.organization}`}
                  </CardDescription>
                </div>
                <QRCodeDisplay
                  entryId={entry.id}
                  entryName={entry.strain_name}
                  variant="icon"
                />
              </div>
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

          {/* Section des commentaires */}
          <div className="mt-8">
            <CommentsSection entryId={entryId || ""} entryName={entry?.strain_name} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Vote;

