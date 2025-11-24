import { useEffect, useMemo, useState } from "react";
import { Award, CalendarDays, MapPin, Users, Scale } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useContests, useContestEntries } from "@/hooks/use-contests";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

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

const Contests = () => {
  const { data: contests, isLoading, error } = useContests();
  const { profile } = useAuth();
  const [selectedContestId, setSelectedContestId] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen bg-background pt-28 pb-16">
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

                  <Button
                    variant={selectedContestId === contest.id ? "default" : "outline"}
                    className="w-full"
                    onClick={() => setSelectedContestId(contest.id)}
                  >
                    Voir les entrées
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedContest && (
          <section className="mt-16">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <p className="text-sm uppercase tracking-wide text-muted-foreground">Entrées officielles</p>
                <h2 className="text-3xl font-bold text-foreground">{selectedContest.name}</h2>
                <p className="text-muted-foreground">
                  {selectedContest.entriesCount} entrées validées — {selectedContest.judgesCount} jurés
                </p>
              </div>
              <Button variant="secondary" className="self-start md:self-auto">
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
                {entries?.length ? (
                  entries.map((entry) => (
                    <Card key={entry.id} className="border-border/80 hover:border-accent/50 transition-all">
                      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <CardTitle className="text-2xl text-foreground">{entry.strain_name}</CardTitle>
                          <CardDescription>
                            {entry.producerName} {entry.producerOrganization ? `• ${entry.producerOrganization}` : ""}
                          </CardDescription>
                        </div>
                        <Badge className="bg-accent/10 text-accent capitalize">{entry.category}</Badge>
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
                  ))
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center text-muted-foreground">
                      Aucune entrée approuvée pour cette édition pour le moment.
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default Contests;
