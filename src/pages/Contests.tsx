import { useEffect, useMemo, useState } from "react";
import { Award, CalendarDays, MapPin, Users, Scale, Search, X, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useContests, useContestEntries } from "@/hooks/use-contests";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { usePagination } from "@/hooks/use-pagination";
import { PaginationControls } from "@/components/PaginationControls";
import { useFavorites } from "@/hooks/use-favorites";
import { Heart, MessageSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { useRealtimeEntries } from "@/hooks/use-realtime-results";
import { CategoryBadge } from "@/components/CategoryBadge";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { SocialShare } from "@/components/SocialShare";
import { useGuideByCategory, getGuideDownloadUrl } from "@/hooks/use-guides";
import { toast } from "sonner";

const statusLabel: Record<string, string> = {
  registration: "Inscriptions ouvertes",
  judging: "En cours d'évaluation",
  completed: "Terminé",
  archived: "Archivé",
};

const statusTone: Record<string, string> = {
  registration: "bg-accent/10 text-accent dark:bg-accent/20",
  judging: "bg-secondary/20 text-secondary-foreground",
  completed: "bg-primary/10 text-primary dark:bg-primary/20",
  archived: "bg-muted text-muted-foreground",
};

// Composant pour une carte d'entrée avec favoris et partage
const EntryCard = ({ entry, profile }: { entry: any; profile: any }) => {
  const { isFavorite, toggleFavorite, isToggling } = useFavorites(entry.id);
  
  // Récupérer le nombre de commentaires
  const { data: commentsCount } = useQuery({
    queryKey: ["comments-count", entry.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("entry_comments")
        .select("*", { count: "exact", head: true })
        .eq("entry_id", entry.id);
      if (error) return 0;
      return count || 0;
    },
  });

  // URL de partage pour cette entrée spécifique
  const entryShareUrl = `${window.location.origin}/vote/${entry.id}`;
  const entryShareText = `Découvrez ${entry.strain_name} sur CBD Flower Cup !`;

  return (
    <Card className="border-border/80 hover:border-accent/50 transition-all">
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <CardTitle className="text-2xl text-foreground">{entry.strain_name}</CardTitle>
          <CardDescription>
            {entry.producerName} {entry.producerOrganization ? `• ${entry.producerOrganization}` : ""}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <CategoryBadge entryId={entry.id} fallbackCategory={entry.category} />
          {commentsCount !== undefined && commentsCount > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {commentsCount}
            </Badge>
          )}
          {profile && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleFavorite(entry.id)}
                disabled={isToggling}
                className="h-8 w-8"
              >
                <Heart
                  className={`h-4 w-4 ${
                    isFavorite
                      ? "fill-red-500 text-red-500"
                      : "text-muted-foreground"
                  }`}
                />
              </Button>
              <SocialShare
                url={entryShareUrl}
                title={entry.strain_name}
                description={entryShareText}
                variant="icon"
              />
              <QRCodeDisplay
                entryId={entry.id}
                entryName={entry.strain_name}
                variant="icon"
              />
            </>
          )}
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
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            asChild
          >
            <Link to={`/vote/${entry.id}`}>
              Voter
            </Link>
          </Button>
          {(profile?.role === "judge" || profile?.role === "organizer") && (
            <Button
              variant="default"
              className="flex-1"
              asChild
            >
              <Link to={`/judge-evaluation/${entry.id}`}>
                <Scale className="mr-2 h-4 w-4" />
                Évaluer
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const Contests = () => {
  const { data: contests, isLoading, error } = useContests();
  const { profile } = useAuth();
  const [selectedContestId, setSelectedContestId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");


  useEffect(() => {
    if (!selectedContestId && contests?.length) {
      setSelectedContestId(contests[0].id);
    }
  }, [contests, selectedContestId]);

  const selectedContest = useMemo(
    () => contests?.find((contest) => contest.id === selectedContestId),
    [contests, selectedContestId],
  );

  const {
    data: entries,
    isLoading: isLoadingEntries,
    error: entriesError,
  } = useContestEntries(selectedContestId ?? undefined);

  // Récupérer le guide producteur actif
  const { data: producerGuide } = useGuideByCategory("producer");

  // Charger les catégories disponibles pour le concours sélectionné (custom ou globales)
  const { data: availableCategories } = useQuery({
    queryKey: ["available-categories", selectedContestId],
    queryFn: async () => {
      if (!selectedContestId) return [];
      
      const { data, error } = await supabase
        .from("available_categories_for_contest")
        .select("*")
        .eq("contest_id", selectedContestId)
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedContestId,
  });

  // Activer les mises à jour en temps réel pour les entrées
  useRealtimeEntries(selectedContestId ?? undefined);

  // Filtrer et trier les entrées
  const filteredAndSortedEntries = useMemo(() => {
    if (!entries) return [];

    let filtered = [...entries];

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (entry) =>
          entry.strain_name.toLowerCase().includes(query) ||
          entry.producerName?.toLowerCase().includes(query) ||
          entry.producerOrganization?.toLowerCase().includes(query) ||
          entry.terpene_profile?.toLowerCase().includes(query)
      );
    }

    // Filtre par catégorie (gère les catégories custom et globales)
    if (categoryFilter !== "all") {
      filtered = filtered.filter((entry) => {
        // Vérifier si c'est une catégorie custom
        if (entry.contest_category_id && entry.contest_category_id === categoryFilter) {
          return true;
        }
        // Sinon vérifier l'enum global
        if (entry.category === categoryFilter) {
          return true;
        }
        return false;
      });
    }

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "judge-score":
          return (b.judgeAverage ?? 0) - (a.judgeAverage ?? 0);
        case "public-vote":
          return (b.publicAverage ?? 0) - (a.publicAverage ?? 0);
        case "name":
        default:
          return a.strain_name.localeCompare(b.strain_name);
      }
    });

    return filtered;
  }, [entries, searchQuery, categoryFilter, sortBy]);

  const {
    paginatedData: paginatedEntries,
    currentPage,
    totalPages,
    goToPage,
  } = usePagination({
    data: filteredAndSortedEntries,
    itemsPerPage: 6,
  });

  // Réinitialiser la pagination quand les filtres changent
  useEffect(() => {
    goToPage(1);
  }, [searchQuery, categoryFilter, sortBy, goToPage]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" tabIndex={-1} className="focus:outline-none pt-28 pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <Badge className="mb-4 bg-gradient-gold text-foreground/90">Concours</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Concours CBD Flower Cup</h1>
          <p className="text-muted-foreground text-lg">
            Retrouvez les éditions en cours et passées, suivez les jurés, les entrées validées et les résultats
            en temps réel.
          </p>
        </div>

        {isLoading && <LoadingState message="Chargement des concours…" />}

        {error && (
          <ErrorState
            message={`Impossible de charger les concours : ${error.message}`}
            onRetry={() => window.location.reload()}
          />
        )}

        {!isLoading && !error && (
          <div className="grid gap-6 md:grid-cols-2">
            {contests?.map((contest) => (
              <Card
                key={contest.id}
                className={`transition-all duration-300 hover:border-accent/60 ${
                  selectedContestId === contest.id ? "border-accent shadow-gold" : ""
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <CardTitle className="text-2xl text-foreground">{contest.name}</CardTitle>
                    <Badge className={statusTone[contest.status] ?? "bg-muted text-muted-foreground"}>
                      {statusLabel[contest.status] ?? contest.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-base text-muted-foreground leading-relaxed">
                    {contest.description ?? "Description non fournie"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-accent" />
                      {contest.location ?? "Lieu à confirmer"}
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-accent" />
                      {contest.start_date
                        ? new Date(contest.start_date).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "Date à confirmer"}
                      {" — "}
                      {contest.end_date
                        ? new Date(contest.end_date).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "Date à confirmer"}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                      <Award className="h-4 w-4 text-accent" />
                      <div>
                        <p className="font-semibold text-foreground">{contest.entriesCount}</p>
                        <p className="text-muted-foreground text-xs">Entrées approuvées</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                      <Users className="h-4 w-4 text-accent" />
                      <div>
                        <p className="font-semibold text-foreground">{contest.judgesCount}</p>
                        <p className="text-muted-foreground text-xs">Jurés confirmés</p>
                      </div>
                    </div>
                  </div>

                         <div className="flex gap-2">
                           <Button
                             variant={selectedContestId === contest.id ? "default" : "outline"}
                             className="flex-1"
                             onClick={() => {
                               setSelectedContestId(contest.id);
                               // Attendre un peu que le state se mette à jour, puis scroller
                               setTimeout(() => {
                                 const entriesSection = document.getElementById('entries-section');
                                 if (entriesSection) {
                                   entriesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                 }
                               }, 100);
                             }}
                           >
                             Voir les entrées
                           </Button>
                           {contest.status === "completed" && (
                             <Button
                               variant="default"
                               className="bg-gradient-gold"
                               asChild
                             >
                               <Link to={`/contests/${contest.id}/results`}>
                                 <Trophy className="mr-2 h-4 w-4" />
                                 Résultats
                               </Link>
                             </Button>
                           )}
                         </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedContest && (
          <section id="entries-section" className="mt-16">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <p className="text-sm uppercase tracking-wide text-muted-foreground">Entrées officielles</p>
                <h2 className="text-3xl font-bold text-foreground">{selectedContest.name}</h2>
                <p className="text-muted-foreground">
                  {selectedContest.entriesCount} entrées validées — {selectedContest.judgesCount} jurés
                </p>
              </div>
              <Button 
                variant="secondary" 
                className="self-start md:self-auto"
                onClick={async () => {
                  try {
                    // Utiliser le guide depuis la base de données si disponible
                    if (producerGuide) {
                      const url = await getGuideDownloadUrl(producerGuide);
                      if (!url) {
                        throw new Error("Impossible de générer l'URL de téléchargement");
                      }

                      const response = await fetch(url);
                      if (!response.ok) {
                        throw new Error(`Erreur HTTP: ${response.status}`);
                      }

                      const blob = await response.blob();
                      const downloadUrl = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = downloadUrl;
                      a.download = producerGuide.file_name;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(downloadUrl);

                      toast.success('Guide producteur téléchargé avec succès');
                    } else {
                      // Fallback vers l'URL externe si aucun guide n'est uploadé
                      const guideUrl = 'https://www.gardeauarbres.fr/docs_cbd/guide_producteurs.pdf';
                      const response = await fetch(guideUrl);
                      
                      if (!response.ok) {
                        throw new Error(`Erreur HTTP: ${response.status}`);
                      }

                      const blob = await response.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `guide-producteur-${selectedContest.name.replace(/[^a-z0-9]/gi, '_')}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);

                      toast.success('Guide producteur téléchargé avec succès');
                    }
                  } catch (error) {
                    console.error('Erreur lors du téléchargement du guide:', error);
                    toast.error('Erreur lors du téléchargement du guide. Veuillez réessayer.');
                  }
                }}
                disabled={isLoadingGuide}
              >
                Télécharger le guide producteur
              </Button>
            </div>

            {isLoadingEntries && <LoadingState message="Chargement des entrées…" />}

            {entriesError && (
              <ErrorState
                message={`Impossible de charger les entrées : ${entriesError.message}`}
                onRetry={() => window.location.reload()}
              />
            )}

            {!isLoadingEntries && !entriesError && (
              <div className="space-y-6">
                {/* Barre de recherche et filtres */}
                <Card className="border-border/60">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                      {/* Recherche */}
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Rechercher par nom, producteur, terpènes..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 pr-10"
                        />
                        {searchQuery && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                            onClick={() => setSearchQuery("")}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {/* Filtre catégorie */}
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-full md:w-[180px]">
                          <Filter className="mr-2 h-4 w-4" />
                          <SelectValue placeholder="Catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes les catégories</SelectItem>
                          {availableCategories && availableCategories.length > 0 ? (
                            availableCategories.map((cat) => (
                              <SelectItem 
                                key={cat.category_id || cat.slug} 
                                value={cat.category_id || cat.slug || ""}
                              >
                                {cat.name}
                              </SelectItem>
                            ))
                          ) : (
                            // Fallback : catégories globales par défaut
                            <>
                              <SelectItem value="indica">Indica</SelectItem>
                              <SelectItem value="sativa">Sativa</SelectItem>
                              <SelectItem value="hybrid">Hybrid</SelectItem>
                              <SelectItem value="outdoor">Outdoor</SelectItem>
                              <SelectItem value="hash">Hash</SelectItem>
                              <SelectItem value="other">Autre</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>

                      {/* Tri */}
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-full md:w-[180px]">
                          <SelectValue placeholder="Trier par" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name">Nom (A-Z)</SelectItem>
                          <SelectItem value="judge-score">Score jury (↓)</SelectItem>
                          <SelectItem value="public-vote">Vote public (↓)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Résultats */}
                    <div className="mt-4 text-sm text-muted-foreground">
                      {filteredAndSortedEntries.length === 0 ? (
                        <span>Aucune entrée ne correspond à vos critères</span>
                      ) : (
                        <span>
                          {filteredAndSortedEntries.length} entrée{filteredAndSortedEntries.length > 1 ? "s" : ""} trouvée{filteredAndSortedEntries.length > 1 ? "s" : ""}
                          {(searchQuery || categoryFilter !== "all") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-2 h-auto p-0 text-xs"
                              onClick={() => {
                                setSearchQuery("");
                                setCategoryFilter("all");
                                setSortBy("name");
                              }}
                            >
                              Réinitialiser
                            </Button>
                          )}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {paginatedEntries.length ? (
                  paginatedEntries.map((entry) => (
                    <EntryCard key={entry.id} entry={entry} profile={profile} />
                  ))
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center text-muted-foreground">
                      Aucune entrée approuvée pour cette édition pour le moment.
                    </CardContent>
                  </Card>
                )}
                {totalPages > 1 && (
                  <div className="mt-8">
                    <PaginationControls
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={goToPage}
                    />
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </div>
      </main>
    </div>
  );
};

export default Contests;
