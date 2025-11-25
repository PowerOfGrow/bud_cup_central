import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search as SearchIcon, Trophy, Users, Leaf, CalendarDays, MapPin, Award } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useGlobalSearch } from "@/hooks/use-global-search";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { CategoryBadge } from "@/components/CategoryBadge";
import Header from "@/components/Header";
import { usePagination } from "@/hooks/use-pagination";
import { PaginationControls } from "@/components/PaginationControls";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const { data, isLoading, error } = useGlobalSearch(searchQuery);

  // Filtrer les résultats selon l'onglet actif
  const filteredResults = useMemo(() => {
    if (!data) return { contests: [], producers: [], entries: [] };

    if (activeTab === "all") {
      return data;
    } else if (activeTab === "contests") {
      return { ...data, producers: [], entries: [] };
    } else if (activeTab === "producers") {
      return { ...data, contests: [], entries: [] };
    } else if (activeTab === "entries") {
      return { ...data, contests: [], producers: [] };
    }
    return data;
  }, [data, activeTab]);

  const totalResults =
    (filteredResults.contests?.length || 0) +
    (filteredResults.producers?.length || 0) +
    (filteredResults.entries?.length || 0);

  // Pagination pour les concours
  const {
    paginatedData: paginatedContests,
    currentPage: contestsPage,
    totalPages: contestsTotalPages,
    goToPage: goToContestsPage,
  } = usePagination({
    data: filteredResults.contests || [],
    itemsPerPage: 6,
  });

  // Pagination pour les producteurs
  const {
    paginatedData: paginatedProducers,
    currentPage: producersPage,
    totalPages: producersTotalPages,
    goToPage: goToProducersPage,
  } = usePagination({
    data: filteredResults.producers || [],
    itemsPerPage: 6,
  });

  // Pagination pour les entrées
  const {
    paginatedData: paginatedEntries,
    currentPage: entriesPage,
    totalPages: entriesTotalPages,
    goToPage: goToEntriesPage,
  } = usePagination({
    data: filteredResults.entries || [],
    itemsPerPage: 6,
  });

  const statusLabel: Record<string, string> = {
    registration: "Inscriptions ouvertes",
    judging: "En cours d'évaluation",
    completed: "Terminé",
    archived: "Archivé",
  };

  const statusTone: Record<string, string> = {
    registration: "bg-accent/10 text-accent",
    judging: "bg-secondary/20 text-secondary-foreground",
    completed: "bg-primary/10 text-primary",
    archived: "bg-muted text-muted-foreground",
  };

  return (
    <div className="min-h-screen">
      <Header />
      <div className="pt-28 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Recherche globale</h1>
              <p className="text-muted-foreground text-lg">
                Recherchez parmi les concours, producteurs et entrées
              </p>
            </div>

            {/* Barre de recherche */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Rechercher un concours, un producteur ou une entrée..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 h-12 text-lg"
                    autoFocus
                  />
                </div>
                {searchQuery.length > 0 && searchQuery.length < 2 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Saisissez au moins 2 caractères pour rechercher
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Résultats */}
            {isLoading && <LoadingState message="Recherche en cours..." />}
            {error && <ErrorState message="Erreur lors de la recherche" />}

            {!isLoading && !error && searchQuery.length >= 2 && (
              <>
                {totalResults === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-16 text-center">
                      <SearchIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <CardTitle className="mb-2">Aucun résultat</CardTitle>
                      <CardDescription>
                        Aucun résultat trouvé pour "{searchQuery}". Essayez avec d'autres mots-clés.
                      </CardDescription>
                    </CardContent>
                  </Card>
                ) : (
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <div className="flex items-center justify-between">
                      <TabsList>
                        <TabsTrigger value="all">
                          Tout ({totalResults})
                        </TabsTrigger>
                        <TabsTrigger value="contests">
                          Concours ({filteredResults.contests?.length || 0})
                        </TabsTrigger>
                        <TabsTrigger value="producers">
                          Producteurs ({filteredResults.producers?.length || 0})
                        </TabsTrigger>
                        <TabsTrigger value="entries">
                          Entrées ({filteredResults.entries?.length || 0})
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    {/* Onglet Tout */}
                    <TabsContent value="all" className="space-y-8">
                      {/* Concours */}
                      {paginatedContests.length > 0 && (
                        <div>
                          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                            <Trophy className="h-6 w-6 text-accent" />
                            Concours ({filteredResults.contests?.length || 0})
                          </h2>
                          <div className="grid gap-4 md:grid-cols-2">
                            {paginatedContests.map((contest) => (
                              <Card key={contest.id} className="hover:border-accent/50 transition-all">
                                <CardHeader>
                                  <div className="flex items-start justify-between">
                                    <CardTitle className="text-xl">{contest.name}</CardTitle>
                                    <Badge className={statusTone[contest.status] || "bg-muted"}>
                                      {statusLabel[contest.status] || contest.status}
                                    </Badge>
                                  </div>
                                  {contest.description && (
                                    <CardDescription className="line-clamp-2">
                                      {contest.description}
                                    </CardDescription>
                                  )}
                                </CardHeader>
                                <CardContent className="space-y-2">
                                  {contest.location && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <MapPin className="h-4 w-4" />
                                      {contest.location}
                                    </div>
                                  )}
                                  {contest.start_date && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <CalendarDays className="h-4 w-4" />
                                      {format(new Date(contest.start_date), "d MMMM yyyy", { locale: fr })}
                                    </div>
                                  )}
                                  <Button variant="outline" className="w-full mt-4" asChild>
                                    <Link to={`/contests`}>Voir les entrées</Link>
                                  </Button>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                          {contestsTotalPages > 1 && (
                            <div className="mt-4">
                              <PaginationControls
                                currentPage={contestsPage}
                                totalPages={contestsTotalPages}
                                onPageChange={goToContestsPage}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Producteurs */}
                      {paginatedProducers.length > 0 && (
                        <div>
                          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                            <Users className="h-6 w-6 text-accent" />
                            Producteurs ({filteredResults.producers?.length || 0})
                          </h2>
                          <div className="grid gap-4 md:grid-cols-2">
                            {paginatedProducers.map((producer) => (
                              <Card key={producer.id} className="hover:border-accent/50 transition-all">
                                <CardHeader>
                                  <CardTitle className="text-xl flex items-center gap-2">
                                    <Users className="h-5 w-5 text-accent" />
                                    {producer.display_name}
                                  </CardTitle>
                                  {producer.organization && (
                                    <CardDescription>{producer.organization}</CardDescription>
                                  )}
                                </CardHeader>
                                <CardContent>
                                  <Button variant="outline" className="w-full" asChild>
                                    <Link to={`/contests`}>Voir les entrées</Link>
                                  </Button>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                          {producersTotalPages > 1 && (
                            <div className="mt-4">
                              <PaginationControls
                                currentPage={producersPage}
                                totalPages={producersTotalPages}
                                onPageChange={goToProducersPage}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Entrées */}
                      {paginatedEntries.length > 0 && (
                        <div>
                          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                            <Leaf className="h-6 w-6 text-accent" />
                            Entrées ({filteredResults.entries?.length || 0})
                          </h2>
                          <div className="grid gap-4">
                            {paginatedEntries.map((entry) => (
                              <Card key={entry.id} className="hover:border-accent/50 transition-all">
                                <CardHeader>
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <CardTitle className="text-xl">{entry.strain_name}</CardTitle>
                                      <CardDescription>
                                        {entry.producerName}
                                        {entry.producerOrganization && ` • ${entry.producerOrganization}`}
                                        {entry.contestName && ` • ${entry.contestName}`}
                                      </CardDescription>
                                    </div>
                                    <CategoryBadge entryId={entry.id} fallbackCategory={entry.category} />
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <Button variant="outline" className="w-full" asChild>
                                    <Link to={`/vote/${entry.id}`}>Voir les détails</Link>
                                  </Button>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                          {entriesTotalPages > 1 && (
                            <div className="mt-4">
                              <PaginationControls
                                currentPage={entriesPage}
                                totalPages={entriesTotalPages}
                                onPageChange={goToEntriesPage}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </TabsContent>

                    {/* Onglets individuels */}
                    <TabsContent value="contests">
                      {paginatedContests.length > 0 ? (
                        <>
                          <div className="grid gap-4 md:grid-cols-2">
                            {paginatedContests.map((contest) => (
                              <Card key={contest.id} className="hover:border-accent/50 transition-all">
                                <CardHeader>
                                  <div className="flex items-start justify-between">
                                    <CardTitle className="text-xl">{contest.name}</CardTitle>
                                    <Badge className={statusTone[contest.status] || "bg-muted"}>
                                      {statusLabel[contest.status] || contest.status}
                                    </Badge>
                                  </div>
                                  {contest.description && (
                                    <CardDescription className="line-clamp-2">
                                      {contest.description}
                                    </CardDescription>
                                  )}
                                </CardHeader>
                                <CardContent className="space-y-2">
                                  {contest.location && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <MapPin className="h-4 w-4" />
                                      {contest.location}
                                    </div>
                                  )}
                                  {contest.start_date && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <CalendarDays className="h-4 w-4" />
                                      {format(new Date(contest.start_date), "d MMMM yyyy", { locale: fr })}
                                    </div>
                                  )}
                                  <Button variant="outline" className="w-full mt-4" asChild>
                                    <Link to={`/contests`}>Voir les entrées</Link>
                                  </Button>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                          {contestsTotalPages > 1 && (
                            <div className="mt-4">
                              <PaginationControls
                                currentPage={contestsPage}
                                totalPages={contestsTotalPages}
                                onPageChange={goToContestsPage}
                              />
                            </div>
                          )}
                        </>
                      ) : (
                        <Card className="border-dashed">
                          <CardContent className="py-16 text-center">
                            <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <CardTitle className="mb-2">Aucun concours trouvé</CardTitle>
                            <CardDescription>
                              Aucun concours ne correspond à votre recherche.
                            </CardDescription>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>

                    <TabsContent value="producers">
                      {paginatedProducers.length > 0 ? (
                        <>
                          <div className="grid gap-4 md:grid-cols-2">
                            {paginatedProducers.map((producer) => (
                              <Card key={producer.id} className="hover:border-accent/50 transition-all">
                                <CardHeader>
                                  <CardTitle className="text-xl flex items-center gap-2">
                                    <Users className="h-5 w-5 text-accent" />
                                    {producer.display_name}
                                  </CardTitle>
                                  {producer.organization && (
                                    <CardDescription>{producer.organization}</CardDescription>
                                  )}
                                </CardHeader>
                                <CardContent>
                                  <Button variant="outline" className="w-full" asChild>
                                    <Link to={`/contests`}>Voir les entrées</Link>
                                  </Button>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                          {producersTotalPages > 1 && (
                            <div className="mt-4">
                              <PaginationControls
                                currentPage={producersPage}
                                totalPages={producersTotalPages}
                                onPageChange={goToProducersPage}
                              />
                            </div>
                          )}
                        </>
                      ) : (
                        <Card className="border-dashed">
                          <CardContent className="py-16 text-center">
                            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <CardTitle className="mb-2">Aucun producteur trouvé</CardTitle>
                            <CardDescription>
                              Aucun producteur ne correspond à votre recherche.
                            </CardDescription>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>

                    <TabsContent value="entries">
                      {paginatedEntries.length > 0 ? (
                        <>
                          <div className="grid gap-4">
                            {paginatedEntries.map((entry) => (
                              <Card key={entry.id} className="hover:border-accent/50 transition-all">
                                <CardHeader>
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <CardTitle className="text-xl">{entry.strain_name}</CardTitle>
                                      <CardDescription>
                                        {entry.producerName}
                                        {entry.producerOrganization && ` • ${entry.producerOrganization}`}
                                        {entry.contestName && ` • ${entry.contestName}`}
                                      </CardDescription>
                                    </div>
                                    <CategoryBadge entryId={entry.id} fallbackCategory={entry.category} />
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <Button variant="outline" className="w-full" asChild>
                                    <Link to={`/vote/${entry.id}`}>Voir les détails</Link>
                                  </Button>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                          {entriesTotalPages > 1 && (
                            <div className="mt-4">
                              <PaginationControls
                                currentPage={entriesPage}
                                totalPages={entriesTotalPages}
                                onPageChange={goToEntriesPage}
                              />
                            </div>
                          )}
                        </>
                      ) : (
                        <Card className="border-dashed">
                          <CardContent className="py-16 text-center">
                            <Leaf className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <CardTitle className="mb-2">Aucune entrée trouvée</CardTitle>
                            <CardDescription>
                              Aucune entrée ne correspond à votre recherche.
                            </CardDescription>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>
                  </Tabs>
                )}
              </>
            )}

            {!isLoading && !error && searchQuery.length < 2 && (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <SearchIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <CardTitle className="mb-2">Commencez votre recherche</CardTitle>
                  <CardDescription>
                    Saisissez au moins 2 caractères dans le champ de recherche pour commencer.
                  </CardDescription>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search;

