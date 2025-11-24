import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/use-favorites";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { Heart, ArrowLeft, Share2, Vote } from "lucide-react";
import Header from "@/components/Header";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { usePagination } from "@/hooks/use-pagination";
import { PaginationControls } from "@/components/PaginationControls";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const Favorites = () => {
  const { favorites, isLoading, removeFavorite, isToggling } = useFavorites();

  // Récupérer les détails des entrées favorites
  const entryIds = favorites.map((f) => f.entry_id);
  const { data: entries, isLoading: entriesLoading } = useQuery({
    queryKey: ["favorite-entries", entryIds],
    queryFn: async () => {
      if (entryIds.length === 0) return [];

      const { data, error } = await supabase
        .from("entries")
        .select(`
          *,
          contest:contests(id, name, status),
          producer:profiles!entries_producer_id_fkey(id, display_name, organization)
        `)
        .in("id", entryIds)
        .eq("status", "approved");

      if (error) throw error;

      // Calculer les scores moyens
      const entriesWithScores = await Promise.all(
        (data || []).map(async (entry) => {
          // Votes publics
          const { data: votes } = await supabase
            .from("public_votes")
            .select("score")
            .eq("entry_id", entry.id);

          const publicAverage =
            votes && votes.length > 0
              ? votes.reduce((sum, v) => sum + (v.score || 0), 0) / votes.length
              : null;

          // Scores jury
          const { data: scores } = await supabase
            .from("judge_scores")
            .select("overall_score")
            .eq("entry_id", entry.id);

          const judgeAverage =
            scores && scores.length > 0
              ? scores.reduce((sum, s) => sum + (s.overall_score || 0), 0) / scores.length
              : null;

          return {
            ...entry,
            publicAverage: publicAverage ? Math.round(publicAverage * 10) / 10 : null,
            publicVotesCount: votes?.length || 0,
            judgeAverage: judgeAverage ? Math.round(judgeAverage * 10) / 10 : null,
            judgeScoresCount: scores?.length || 0,
            producerName: (entry.producer as any)?.display_name || "Producteur",
            producerOrganization: (entry.producer as any)?.organization || null,
          };
        })
      );

      return entriesWithScores;
    },
    enabled: entryIds.length > 0,
  });

  const {
    paginatedData: paginatedEntries,
    currentPage,
    totalPages,
    goToPage,
  } = usePagination({
    data: entries || [],
    itemsPerPage: 6,
  });

  const handleShare = (entryName: string) => {
    const url = `${window.location.origin}/contests`;
    const text = `Découvrez ${entryName} sur CBD Flower Cup !`;
    
    if (navigator.share) {
      navigator.share({
        title: entryName,
        text: text,
        url: url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text} ${url}`);
      toast.success("Lien copié dans le presse-papiers !");
    }
  };

  if (isLoading || entriesLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="pt-28 pb-16">
          <LoadingState message="Chargement de vos favoris..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="pt-28 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <Link to="/contests">
                  <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                    <Heart className="h-8 w-8 text-red-500 fill-red-500" />
                    Mes favoris
                  </h1>
                  <p className="text-muted-foreground">
                    {favorites.length} entrée{favorites.length > 1 ? "s" : ""} favorite{favorites.length > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Liste des favoris */}
            {paginatedEntries.length > 0 ? (
              <>
                <div className="grid gap-4">
                  {paginatedEntries.map((entry: any) => (
                    <Card key={entry.id} className="border-border/80 hover:border-accent/50 transition-all">
                      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-2xl text-foreground">{entry.strain_name}</CardTitle>
                          <CardDescription>
                            {entry.producerName} {entry.producerOrganization ? `• ${entry.producerOrganization}` : ""}
                            {entry.contest && ` • ${(entry.contest as any).name}`}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-accent/10 text-accent capitalize">{entry.category}</Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFavorite(entry.id)}
                            disabled={isToggling}
                            className="h-8 w-8"
                          >
                            <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleShare(entry.strain_name)}
                            className="h-8 w-8"
                          >
                            <Share2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-3">
                        <div className="bg-muted/40 rounded-xl p-4">
                          <p className="text-sm text-muted-foreground mb-1">Profil Cannabinoïde</p>
                          <p className="text-lg font-semibold text-foreground">
                            THC {entry.thc_percent ?? "—"}% · CBD {entry.cbd_percent ?? "—"}%
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                            {entry.terpene_profile ?? "Profil terpènes non communiqué"}
                          </p>
                        </div>
                        <div className="bg-muted/40 rounded-xl p-4">
                          <p className="text-sm text-muted-foreground mb-1">Score jury</p>
                          <p className="text-lg font-semibold text-foreground">
                            {entry.judgeAverage ? `${entry.judgeAverage}/100` : "En attente"}
                          </p>
                          <p className="text-xs text-muted-foreground">{entry.judgeScoresCount} fiche(s) reçue(s)</p>
                        </div>
                        <div className="bg-muted/40 rounded-xl p-4">
                          <p className="text-sm text-muted-foreground mb-1">Vote public</p>
                          <p className="text-lg font-semibold text-foreground">
                            {entry.publicAverage ? `${entry.publicAverage}/5` : "Aucun vote"}
                          </p>
                          <p className="text-xs text-muted-foreground">{entry.publicVotesCount} vote(s)</p>
                        </div>
                      </CardContent>
                      <CardContent className="pt-0 border-t">
                        <Button variant="outline" className="w-full" asChild>
                          <Link to={`/vote/${entry.id}`}>
                            <Vote className="mr-2 h-4 w-4" />
                            Voter pour cette entrée
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="mt-8">
                    <PaginationControls
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={goToPage}
                    />
                  </div>
                )}
              </>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <CardTitle className="mb-2">Aucun favori</CardTitle>
                  <CardDescription className="mb-4">
                    Vous n'avez pas encore ajouté d'entrées à vos favoris.
                  </CardDescription>
                  <Button asChild>
                    <Link to="/contests">Découvrir les entrées</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrapper avec ProtectedRoute
const FavoritesPage = () => (
  <ProtectedRoute>
    <Favorites />
  </ProtectedRoute>
);

export default FavoritesPage;

