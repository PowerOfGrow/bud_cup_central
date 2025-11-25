import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Award, Trophy, Medal, Star, ArrowLeft, TrendingUp, Sparkles, Download, FileText } from "lucide-react";
import { generateWinnerCertificate, type CertificateData } from "@/components/CertificateGenerator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { EntryBadges } from "@/components/EntryBadges";
import { ManageEntryBadges } from "@/components/ManageEntryBadges";
import { toast } from "sonner";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { useRealtimeResults } from "@/hooks/use-realtime-results";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ContestResults = () => {
  const { contestId } = useParams<{ contestId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isOrganizer = profile?.role === "organizer";
  const queryClient = useQueryClient();
  const [showAutoBadgeDialog, setShowAutoBadgeDialog] = useState(false);
  const [includePeopleChoice, setIncludePeopleChoice] = useState(true);
  const [generatingCertificate, setGeneratingCertificate] = useState<string | null>(null);

  // Fonction pour générer le certificat pour une entrée
  const handleGenerateCertificate = async (entry: any, rank: number) => {
    if (!contest) return;
    
    setGeneratingCertificate(entry.id);
    try {
      // Formater la date du concours
      const contestDate = contest.start_date
        ? new Date(contest.start_date).toLocaleDateString("fr-FR", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : new Date().toLocaleDateString("fr-FR", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });

      const certificateData: CertificateData = {
        contestName: contest.name,
        contestDate,
        entryName: entry.strain_name,
        producerName: entry.producer?.display_name || "Producteur inconnu",
        producerOrganization: entry.producer?.organization,
        rank,
        combinedScore: entry.combinedScore,
        judgeAverage: entry.judgeAverage,
        publicAverage: entry.publicAverage,
        badges: entry.badges?.map((b: any) => ({
          badge: b.badge,
          label: b.label,
        })),
      };

      await generateWinnerCertificate(certificateData);
      toast.success("Certificat généré avec succès !");
    } catch (error) {
      console.error("Error generating certificate:", error);
      toast.error("Erreur lors de la génération du certificat");
    } finally {
      setGeneratingCertificate(null);
    }
  };

  // Activer les mises à jour en temps réel
  useRealtimeResults(contestId);

  // Récupérer les informations du concours
  const { data: contest, isLoading: contestLoading } = useQuery({
    queryKey: ["contest", contestId],
    queryFn: async () => {
      if (!contestId) throw new Error("Contest ID manquant");
      const { data, error } = await supabase
        .from("contests")
        .select("*")
        .eq("id", contestId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!contestId,
  });

  // Récupérer les entrées avec leurs scores
  const { data: entries, isLoading: entriesLoading } = useQuery({
    queryKey: ["contest-results", contestId, contest?.id],
    queryFn: async () => {
      if (!contestId) return [];
      
      // Récupérer les entrées
      const { data, error } = await supabase
        .from("entries")
        .select(
          `
          *,
          producer:profiles!entries_producer_id_fkey (
            id,
            display_name,
            organization
          ),
          judge_scores (
            id,
            overall_score,
            appearance_score,
            aroma_score,
            taste_score,
            effect_score
          ),
          public_votes (
            id,
            score
          ),
          entry_badges (
            id,
            badge,
            label,
            description
          )
        `
        )
        .eq("contest_id", contestId)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Récupérer les poids du concours depuis la DB
      const { data: contestData } = await supabase
        .from("contests")
        .select("jury_weight, public_weight")
        .eq("id", contestId)
        .single();

      const juryWeight = contestData?.jury_weight ?? 0.7;
      const publicWeight = contestData?.public_weight ?? 0.3;

      // Calculer les scores moyens et classer les entrées
      return (
        data
          ?.map((entry) => {
            const judgeScores = entry.judge_scores || [];
            const publicVotes = entry.public_votes || [];

            const judgeAverage =
              judgeScores.length > 0
                ? judgeScores.reduce((sum, score) => sum + score.overall_score, 0) /
                  judgeScores.length
                : 0;

            const publicAverage =
              publicVotes.length > 0
                ? publicVotes.reduce((sum, vote) => sum + vote.score, 0) / publicVotes.length
                : 0;

            // Score combiné : pondération configurable par concours (par défaut 70% jury + 30% public)
            const normalizedPublicScore = (publicAverage / 5) * 100; // Normaliser 0-5 vers 0-100
            const combinedScore = judgeAverage * juryWeight + normalizedPublicScore * publicWeight;

            return {
              ...entry,
              judgeAverage: Math.round(judgeAverage * 10) / 10,
              publicAverage: Math.round(publicAverage * 10) / 10,
              combinedScore: Math.round(combinedScore * 10) / 10,
              judgeScoresCount: judgeScores.length,
              publicVotesCount: publicVotes.length,
              badges: entry.entry_badges || [],
            };
          })
          .sort((a, b) => b.combinedScore - a.combinedScore) || []
      );
    },
    enabled: !!contestId,
  });

  if (contestLoading || entriesLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="pt-28 pb-16">
          <div className="container mx-auto px-4">
            <LoadingState message="Chargement des résultats..." />
          </div>
        </div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="pt-28 pb-16">
          <div className="container mx-auto px-4">
            <ErrorState message="Concours introuvable" />
          </div>
        </div>
      </div>
    );
  }

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-4 py-2 text-lg">
            <Trophy className="mr-2 h-5 w-5" />
            1er
          </Badge>
        );
      case 2:
        return (
          <Badge className="bg-gradient-to-r from-gray-300 to-gray-400 text-gray-900 px-4 py-2 text-lg">
            <Medal className="mr-2 h-5 w-5" />
            2ème
          </Badge>
        );
      case 3:
        return (
          <Badge className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-4 py-2 text-lg">
            <Medal className="mr-2 h-5 w-5" />
            3ème
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="px-3 py-1">
            #{rank}
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <div className="pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>

          <div className="text-center mb-12">
            <Badge className="mb-4 bg-gradient-gold text-foreground/90 text-lg px-4 py-2">
              Résultats
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {contest.name}
            </h1>
            <p className="text-muted-foreground text-lg">
              Classement final des entrées
            </p>
            {contest && (
              <p className="text-sm text-muted-foreground mt-2">
                Pondération : {Math.round((contest.jury_weight ?? 0.7) * 100)}% Jury • {Math.round((contest.public_weight ?? 0.3) * 100)}% Public
              </p>
            )}
            {isOrganizer && contest?.status === "completed" && (
              <div className="mt-4">
                <Button
                  onClick={() => setShowAutoBadgeDialog(true)}
                  variant="outline"
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Attribuer les badges automatiquement
                </Button>
              </div>
            )}
          </div>

          {entries && entries.length > 0 ? (
            <div className="space-y-6">
              {/* Indicateur temps réel */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span>Mise à jour en temps réel activée</span>
              </div>
              
              {/* Podium */}
              {entries.length >= 3 && (
                <div className="grid grid-cols-3 gap-4 mb-12">
                  {/* 2ème place */}
                  <Card className="border-border/60 order-2">
                    <CardHeader className="text-center">
                      <div className="flex justify-center mb-2">
                        <Badge className="bg-gradient-to-r from-gray-300 to-gray-400 text-gray-900 px-4 py-2 text-lg">
                          <Medal className="mr-2 h-5 w-5" />
                          2ème
                        </Badge>
                      </div>
                      <CardTitle className="text-xl">{entries[1].strain_name}</CardTitle>
                      <CardDescription>{entries[1].producer?.display_name}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="text-3xl font-bold text-foreground mb-2">
                        {entries[1].combinedScore.toFixed(1)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Jury: {entries[1].judgeAverage}/100 • Public: {entries[1].publicAverage.toFixed(1)}/5
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4 gap-2"
                        onClick={() => handleGenerateCertificate(entries[1], 2)}
                        disabled={generatingCertificate === entries[1].id}
                      >
                        {generatingCertificate === entries[1].id ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Génération...
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4" />
                            Télécharger le certificat
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* 1ère place */}
                  <Card className="border-accent shadow-gold order-1">
                    <CardHeader className="text-center">
                      <div className="flex justify-center mb-2">
                        <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-4 py-2 text-xl">
                          <Trophy className="mr-2 h-6 w-6" />
                          1er
                        </Badge>
                      </div>
                      <CardTitle className="text-2xl">{entries[0].strain_name}</CardTitle>
                      <CardDescription>{entries[0].producer?.display_name}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="text-4xl font-bold text-accent mb-2">
                        {entries[0].combinedScore.toFixed(1)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Jury: {entries[0].judgeAverage}/100 • Public: {entries[0].publicAverage.toFixed(1)}/5
                      </div>
                      <Button
                        variant="default"
                        size="sm"
                        className="mt-4 gap-2"
                        onClick={() => handleGenerateCertificate(entries[0], 1)}
                        disabled={generatingCertificate === entries[0].id}
                      >
                        {generatingCertificate === entries[0].id ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Génération...
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4" />
                            Télécharger le certificat
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* 3ème place */}
                  <Card className="border-border/60 order-3">
                    <CardHeader className="text-center">
                      <div className="flex justify-center mb-2">
                        <Badge className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-4 py-2 text-lg">
                          <Medal className="mr-2 h-5 w-5" />
                          3ème
                        </Badge>
                      </div>
                      <CardTitle className="text-xl">{entries[2].strain_name}</CardTitle>
                      <CardDescription>{entries[2].producer?.display_name}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="text-3xl font-bold text-foreground mb-2">
                        {entries[2].combinedScore.toFixed(1)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Jury: {entries[2].judgeAverage}/100 • Public: {entries[2].publicAverage.toFixed(1)}/5
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4 gap-2"
                        onClick={() => handleGenerateCertificate(entries[2], 3)}
                        disabled={generatingCertificate === entries[2].id}
                      >
                        {generatingCertificate === entries[2].id ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Génération...
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4" />
                            Télécharger le certificat
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Classement complet */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground mb-4">Classement complet</h2>
                {entries.map((entry, index) => (
                  <Card
                    key={entry.id}
                    className={`border-border/60 hover:border-accent/50 transition-all ${
                      index < 3 ? "bg-muted/30" : ""
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          {getRankBadge(index + 1)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1">
                                  <h3 className="text-xl font-bold text-foreground mb-1">
                                    {entry.strain_name}
                                  </h3>
                                  <p className="text-muted-foreground">
                                    {entry.producer?.display_name}
                                    {entry.producer?.organization && ` • ${entry.producer.organization}`}
                                  </p>
                                </div>
                                {isOrganizer && (
                                  <ManageEntryBadges
                                    entryId={entry.id}
                                    entryName={entry.strain_name}
                                    existingBadges={entry.badges}
                                  />
                                )}
                              </div>
                              {entry.badges && entry.badges.length > 0 && (
                                <div className="mt-2">
                                  <EntryBadges badges={entry.badges} />
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-accent mb-1">
                                {entry.combinedScore.toFixed(1)}
                              </div>
                              <div className="text-xs text-muted-foreground">Score combiné</div>
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-3 mt-4">
                            <div className="bg-muted/40 rounded-xl p-3">
                              <p className="text-xs text-muted-foreground mb-1">Score jury</p>
                              <p className="text-lg font-semibold text-foreground">
                                {entry.judgeAverage}/100
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {entry.judgeScoresCount} évaluation(s)
                              </p>
                            </div>
                            <div className="bg-muted/40 rounded-xl p-3">
                              <p className="text-xs text-muted-foreground mb-1">Vote public</p>
                              <p className="text-lg font-semibold text-foreground">
                                {entry.publicAverage.toFixed(1)}/5
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {entry.publicVotesCount} vote(s)
                              </p>
                            </div>
                            <div className="bg-muted/40 rounded-xl p-3">
                              <p className="text-xs text-muted-foreground mb-1">Catégorie</p>
                              <Badge className="bg-accent/10 text-accent capitalize">
                                {entry.category}
                              </Badge>
                            </div>
                          </div>

                          {/* Bouton télécharger certificat pour toutes les entrées */}
                          {contest?.status === "completed" && (
                            <div className="mt-4 pt-4 border-t">
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={() => handleGenerateCertificate(entry, index + 1)}
                                disabled={generatingCertificate === entry.id}
                              >
                                {generatingCertificate === entry.id ? (
                                  <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    Génération...
                                  </>
                                ) : (
                                  <>
                                    <FileText className="h-4 w-4" />
                                    Télécharger le certificat
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground">
                Aucun résultat disponible pour le moment.
                {contest.status !== "completed" && (
                  <p className="mt-2 text-sm">
                    Le concours doit être terminé pour afficher les résultats.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialog pour attribution automatique des badges */}
      <AlertDialog open={showAutoBadgeDialog} onOpenChange={setShowAutoBadgeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Attribuer les badges automatiquement</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action va attribuer automatiquement les badges suivants selon les résultats :
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><strong>Or</strong> : 1ère place</li>
                <li><strong>Argent</strong> : 2ème place</li>
                <li><strong>Bronze</strong> : 3ème place</li>
                <li><strong>Choix du public</strong> : Meilleur score public (si coché)</li>
              </ul>
              <p className="mt-3 text-sm text-muted-foreground">
                Les badges existants ne seront pas dupliqués. Seuls les badges manquants seront attribués.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includePeopleChoice}
                onChange={(e) => setIncludePeopleChoice(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Inclure le badge "Choix du public"</span>
            </label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!contestId) return;
                try {
                  const { data, error } = await supabase.rpc("award_automatic_badges", {
                    p_contest_id: contestId,
                    p_auto_people_choice: includePeopleChoice,
                  });
                  
                  if (error) throw error;
                  
                  toast.success(`${data?.badges_awarded || 0} badge(s) attribué(s) avec succès !`);
                  queryClient.invalidateQueries({ queryKey: ["contest-results", contestId] });
                  queryClient.invalidateQueries({ queryKey: ["entry-badges"] });
                  setShowAutoBadgeDialog(false);
                } catch (error: any) {
                  toast.error(error.message || "Erreur lors de l'attribution des badges");
                }
              }}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Attribuer les badges
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ContestResults;

