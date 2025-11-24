import { type ComponentType, useMemo } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useViewerDashboard, useProducerDashboard, useJudgeDashboard } from "@/hooks/use-dashboard";
import { Award, CheckCircle2, Clock3, Eye, Leaf, Scale, Shield, Star, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { usePagination } from "@/hooks/use-pagination";
import { PaginationControls } from "@/components/PaginationControls";


const StatCard = ({
  icon: Icon,
  label,
  value,
  hint,
  accent = "bg-accent/10 text-accent",
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string | number | null;
  hint?: string;
  accent?: string;
}) => (
  <Card className="border-border/70">
    <CardContent className="flex items-center gap-4 py-6">
      <div className={`rounded-xl p-3 ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold text-foreground">{value ?? "—"}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </CardContent>
  </Card>
);

const SectionWrapper = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-4">
    <div>
      <h3 className="text-xl font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    {children}
  </div>
);

const ViewerPanel = () => {
  const { profile } = useAuth();
  const viewerId = profile?.id;
  const { data, isLoading, error } = useViewerDashboard(viewerId);

  if (isLoading) {
    return <LoadingState message="Chargement des favoris communautaires…" />;
  }

  if (error || !data) {
    return <ErrorState message="Impossible de charger les données membre." />;
  }

  return (
    <div className="space-y-10">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={Star} label="Votes déposés" value={data.totalVotes} hint="Participation aux classements" />
        <StatCard icon={Award} label="Note moyenne" value={data.averageScore ? `${data.averageScore}/5` : "—"} hint="Basée sur vos votes" accent="bg-gradient-gold text-foreground" />
        <StatCard icon={CalendarIcon} label="Concours en cours" value={data.upcomingContests.length} hint="Éditions ouvertes au public" accent="bg-accent/10 text-accent" />
      </div>

      <SectionWrapper title="Vos derniers votes" description="Historique des variétés que vous avez notées récemment.">
        <div className="grid gap-4 md:grid-cols-2">
          {data.latestVotes.length ? (
            data.latestVotes.map((vote) => (
              <Card key={vote.id} className="border-border/60 hover:border-accent/50 transition-colors">
                <CardHeader className="space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-lg text-foreground">
                      {vote.entry?.strain_name ?? "Entrée inconnue"}
                    </CardTitle>
                    <Badge className="bg-accent/10 text-accent">{vote.score}/5</Badge>
                  </div>
                  <CardDescription className="text-sm">
                    {vote.entry?.contest?.name ?? "Concours à confirmer"} •{" "}
                    {vote.entry?.contest?.start_date
                      ? new Date(vote.entry.contest.start_date).toLocaleDateString("fr-FR", { month: "short", day: "2-digit" })
                      : "Date non publiée"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{vote.comment ?? "Aucun commentaire."}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-muted-foreground">
                Aucun vote enregistré pour le moment.
              </CardContent>
            </Card>
          )}
        </div>
      </SectionWrapper>

      <SectionWrapper title="Concours à suivre" description="Les éditions ouvertes aux votes ou aux inscriptions.">
        <div className="grid gap-4 md:grid-cols-3">
          {data.upcomingContests.length ? (
            data.upcomingContests.map((contest) => (
              <Card key={contest.id} className="border-border/60">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-lg text-foreground">{contest.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 text-sm">
                    <Clock3 className="h-4 w-4 text-accent" />
                    {contest.start_date
                      ? new Date(contest.start_date).toLocaleDateString("fr-FR", { month: "short", day: "2-digit" })
                      : "Date à venir"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <Badge variant="secondary" className="w-fit capitalize">{contest.status}</Badge>
                  <Button variant="outline" className="w-full">Découvrir l'édition</Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-muted-foreground">
                Aucun concours n'est ouvert actuellement.
              </CardContent>
            </Card>
          )}
        </div>
      </SectionWrapper>
    </div>
  );
};

const ProducerEntriesList = ({ entries }: { entries: any[] }) => {
  const {
    paginatedData: paginatedEntries,
    currentPage,
    totalPages,
    goToPage,
  } = usePagination({
    data: entries,
    itemsPerPage: 5,
  });

  return (
    <>
      <div className="grid gap-4">
        {paginatedEntries.length ? (
          paginatedEntries.map((entry) => (
            <Card key={entry.id} className="border-border/60 hover:border-accent/40 transition-colors">
              <CardHeader className="space-y-1">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <CardTitle className="text-xl text-foreground">{entry.strain_name}</CardTitle>
                    <CardDescription>{entry.contest?.name ?? "Concours à confirmer"}</CardDescription>
                  </div>
                  <Badge variant="secondary" className="capitalize">{entry.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Statut conformité</p>
                  <p className="text-sm font-medium text-foreground">
                    {entry.status === "approved"
                      ? "Validé"
                      : entry.status === "submitted" || entry.status === "under_review"
                        ? "En revue"
                        : "Brouillon"}
                  </p>
                </div>
                <div className="rounded-xl bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Score jury</p>
                  <p className="text-sm font-medium text-foreground">
                    {entry.judgeAverage ? `${entry.judgeAverage}/100` : "En attente"}
                    <span className="text-xs text-muted-foreground"> ({entry.judgeScoresCount} retours)</span>
                  </p>
                </div>
                <div className="rounded-xl bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Vote public</p>
                  <p className="text-sm font-medium text-foreground">
                    {entry.publicAverage ? `${entry.publicAverage}/5` : "Pas encore de votes"}
                    <span className="text-xs text-muted-foreground"> ({entry.publicVotesCount})</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-muted-foreground">
              Aucune entrée active. Soumettez votre première fleur !
            </CardContent>
          </Card>
        )}
      </div>
      {totalPages > 1 && (
        <div className="mt-6">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
          />
        </div>
      )}
    </>
  );
};

const ProducerPanel = () => {
  const { profile } = useAuth();
  const producerId = profile?.id;
  const { data, isLoading, error } = useProducerDashboard(producerId);

  if (isLoading) {
    return <LoadingState message="Analyse de vos entrées…" />;
  }

  if (error || !data) {
    return <ErrorState message="Impossible de charger les données producteur." />;
  }

  return (
    <div className="space-y-10">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Leaf} label="Entrées totales" value={data.totals.totalEntries} hint="Toutes éditions confondues" accent="bg-accent/10 text-accent" />
        <StatCard icon={CheckCircle2} label="Entrées approuvées" value={data.totals.approved} hint="Prêtes pour le jury" accent="bg-accent/20 text-accent" />
        <StatCard icon={Shield} label="Dossiers en revue" value={data.totals.submitted} hint="Soumises / en validation" accent="bg-secondary/20 text-secondary-foreground" />
        <StatCard icon={Star} label="Note moyenne jury" value={data.overallAverage ? `${data.overallAverage}/100` : "—"} hint="Basée sur vos fiches récentes" />
      </div>

      <Card className="border-border/70 bg-muted/40">
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between py-6">
          <div>
            <p className="text-sm text-muted-foreground uppercase tracking-wide">Prochaine échéance</p>
            <p className="text-2xl font-semibold text-foreground">
              {data.nextDeadline
                ? new Date(data.nextDeadline).toLocaleDateString("fr-FR", { weekday: "long", month: "long", day: "numeric" })
                : "Aucune date imminente"}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link to="/submit-entry">Soumettre une nouvelle fleur</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <SectionWrapper title="Entrées actives" description="Suivi temps réel de vos candidatures.">
        <ProducerEntriesList entries={data.entries} />
      </SectionWrapper>
    </div>
  );
};

const JudgePanel = () => {
  const { profile } = useAuth();
  const judgeId = profile?.id;
  const { data, isLoading, error } = useJudgeDashboard(judgeId);

  if (isLoading) {
    return <LoadingState message="Préparation de la table jury…" />;
  }

  if (error || !data) {
    return <ErrorState message="Impossible de charger les données jury." />;
  }

  return (
    <div className="space-y-10">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={Users} label="Concours assignés" value={data.assignments.length} hint="Éditions où vous êtes juré" accent="bg-accent/10 text-accent" />
        <StatCard icon={Award} label="Fiches notées" value={data.stats.totalReviews} hint="Sur les 30 derniers jours" accent="bg-accent/10 text-accent" />
        <StatCard icon={Star} label="Score moyen" value={data.stats.averageScore ? `${data.stats.averageScore}/100` : "—"} hint="Moyenne de vos évaluations" />
      </div>

      <SectionWrapper title="Vos prochaines sessions" description="Briefing des concours auxquels vous participez.">
        <div className="grid gap-4 md:grid-cols-2">
          {data.assignments.length ? (
            data.assignments.map((assignment, index) => (
              <Card key={`${assignment.contest?.id}-${index}`} className="border-border/60">
                <CardHeader className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-lg text-foreground">{assignment.contest?.name ?? "Concours"}</CardTitle>
                    <Badge variant="outline" className="capitalize">{assignment.invitation_status}</Badge>
                  </div>
                  <CardDescription className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-accent" />
                    {assignment.contest?.start_date
                      ? new Date(assignment.contest.start_date).toLocaleDateString("fr-FR", { month: "long", day: "numeric" })
                      : "Date non publiée"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <p className="text-sm text-muted-foreground">
                    {assignment.contest?.location ?? "Lieu communiqué ultérieurement"}
                  </p>
                  <Button variant="secondary" asChild>
                    <Link to={`/contests`}>
                      Voir les entrées à évaluer
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-muted-foreground">
                Vous n'avez pas encore de concours assigné.
              </CardContent>
            </Card>
          )}
        </div>
      </SectionWrapper>

      <SectionWrapper title="Historique d'évaluation" description="Dernières fiches remplies et statistiques associées.">
        <div className="grid gap-4">
          {data.reviews.length ? (
            data.reviews.map((review) => (
              <Card key={review.id} className="border-border/60">
                <CardHeader className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-lg text-foreground">
                      {review.entry?.strain_name ?? "Entrée"}
                    </CardTitle>
                    <Badge className="bg-accent/10 text-accent">{review.overall_score}/100</Badge>
                  </div>
                  <CardDescription className="text-sm">
                    {review.entry?.contest?.name ?? "Concours"} •{" "}
                    {new Date(review.created_at).toLocaleDateString("fr-FR", { month: "short", day: "numeric" })}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-muted-foreground">
                Commencez à noter vos premières entrées.
              </CardContent>
            </Card>
          )}
        </div>
      </SectionWrapper>
    </div>
  );
};

const CalendarIcon = Clock3;

const Dashboard = () => {
  const { profile } = useAuth();

  // Déterminer l'onglet par défaut selon le rôle de l'utilisateur
  const defaultTab = useMemo(() => {
    if (!profile) return "viewer";
    switch (profile.role) {
      case "producer":
        return "producer";
      case "judge":
        return "judge";
      default:
        return "viewer";
    }
  }, [profile]);

  // Déterminer quels onglets afficher selon le rôle
  const availableTabs = useMemo(() => {
    if (!profile) return ["viewer"];
    const tabs: string[] = [];
    // Tous les utilisateurs peuvent voir leur propre dashboard viewer
    tabs.push("viewer");
    if (profile.role === "producer" || profile.role === "organizer") {
      tabs.push("producer");
    }
    if (profile.role === "judge" || profile.role === "organizer") {
      tabs.push("judge");
    }
    return tabs;
  }, [profile]);

  return (
    <div className="min-h-screen bg-background pt-28 pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <Badge className="mb-4 bg-gradient-gold text-foreground/80">Espace membre</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Tableaux de bord optimisés</h1>
          <p className="text-muted-foreground text-lg">
            Vue unifiée pour les membres gratuits, producteurs et jurés. Sélectionnez votre rôle pour accéder à vos indicateurs clés.
          </p>
        </div>

        <Tabs defaultValue={defaultTab} className="space-y-10">
          <TabsList className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-muted/40">
            {availableTabs.includes("viewer") && (
              <TabsTrigger value="viewer" className="data-[state=active]:bg-background">
                <Eye className="mr-2 h-4 w-4" /> Membre gratuit
              </TabsTrigger>
            )}
            {availableTabs.includes("producer") && (
              <TabsTrigger value="producer" className="data-[state=active]:bg-background">
                <Leaf className="mr-2 h-4 w-4" /> Producteur
              </TabsTrigger>
            )}
            {availableTabs.includes("judge") && (
              <TabsTrigger value="judge" className="data-[state=active]:bg-background">
                <Scale className="mr-2 h-4 w-4" /> Jury
              </TabsTrigger>
            )}
          </TabsList>

          {availableTabs.includes("viewer") && (
            <TabsContent value="viewer">
              <ViewerPanel />
            </TabsContent>
          )}

          {availableTabs.includes("producer") && (
            <TabsContent value="producer">
              <ProducerPanel />
            </TabsContent>
          )}

          {availableTabs.includes("judge") && (
            <TabsContent value="judge">
              <JudgePanel />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;

