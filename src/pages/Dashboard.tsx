import React, { type ComponentType, useMemo } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useViewerDashboard, useProducerDashboard, useJudgeDashboard } from "@/hooks/use-dashboard";
import { Award, CheckCircle2, Clock3, Eye, Leaf, Scale, Shield, Star, Users, BarChart3, Download, TrendingUp, FileText, Settings, Calendar, UserPlus, Trophy, ListChecks, LayoutDashboard, Plus, Search } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { usePagination } from "@/hooks/use-pagination";
import { PaginationControls } from "@/components/PaginationControls";
import { Edit, Trash2, Send } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useConfirm } from "@/hooks/use-confirm";
import { useOrganizerAnalytics } from "@/hooks/use-organizer-analytics";
import { OrganizerCharts } from "@/components/OrganizerCharts";
import { DeadlineTracker } from "@/components/DeadlineTracker";
import { differenceInDays, differenceInHours } from "date-fns";
import { AlertCircle } from "lucide-react";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useState, useEffect } from "react";
// Lazy load des bibliothèques lourdes uniquement pour OrganizerPanel


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
      {/* Menu de navigation rapide pour viewers */}
      <Card className="border-border/70 bg-muted/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5" />
            Actions rapides
          </CardTitle>
          <CardDescription>
            Accès rapide aux fonctionnalités membre
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto flex-col items-start justify-start p-4" asChild>
              <Link to="/contests">
                <ListChecks className="mr-2 h-5 w-5 mb-2" />
                <span className="font-semibold">Voir les concours</span>
                <span className="text-xs text-muted-foreground mt-1">Voter et découvrir</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start justify-start p-4" asChild>
              <Link to="/favorites">
                <Star className="mr-2 h-5 w-5 mb-2" />
                <span className="font-semibold">Mes favoris</span>
                <span className="text-xs text-muted-foreground mt-1">{data.totalVotes} favoris</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start justify-start p-4" asChild>
              <Link to="/search">
                <Search className="mr-2 h-5 w-5 mb-2" />
                <span className="font-semibold">Recherche</span>
                <span className="text-xs text-muted-foreground mt-1">Recherche globale</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start justify-start p-4" asChild>
              <Link to="/settings">
                <Settings className="mr-2 h-5 w-5 mb-2" />
                <span className="font-semibold">Paramètres</span>
                <span className="text-xs text-muted-foreground mt-1">Notifications</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
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

const ProducerEntriesList = ({ entries, contests }: { entries: any[]; contests?: any[] }) => {
  const {
    paginatedData: paginatedEntries,
    currentPage,
    totalPages,
    goToPage,
  } = usePagination({
    data: entries,
    itemsPerPage: 5,
  });

  const queryClient = useQueryClient();
  const { confirm: confirmDelete, ConfirmationDialog: DeleteDialog } = useConfirm({
    title: "Supprimer l'entrée",
    message: "Êtes-vous sûr de vouloir supprimer cette entrée ? Cette action est irréversible.",
  });
  const { confirm: confirmSubmit, ConfirmationDialog: SubmitDialog } = useConfirm({
    title: "Soumettre l'entrée",
    message: "Êtes-vous sûr de vouloir soumettre cette entrée ? Elle passera en revue et ne pourra plus être modifiée.",
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await supabase
        .from("entries")
        .delete()
        .eq("id", entryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["producer-dashboard"] });
      toast.success("Entrée supprimée avec succès");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la suppression");
    },
  });

  const submitEntryMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await supabase
        .from("entries")
        .update({ status: "submitted" })
        .eq("id", entryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["producer-dashboard"] });
      toast.success("Entrée soumise avec succès !");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la soumission");
    },
  });

  const handleDelete = async (entryId: string) => {
    const confirmed = await confirmDelete();
    if (confirmed) {
      deleteEntryMutation.mutate(entryId);
    }
  };

  const handleSubmit = async (entryId: string) => {
    const confirmed = await confirmSubmit();
    if (confirmed) {
      submitEntryMutation.mutate(entryId);
    }
  };

  return (
    <>
      <DeleteDialog />
      <SubmitDialog />
      <div className="grid gap-4">
        {paginatedEntries.length ? (
          paginatedEntries.map((entry) => {
            // Calculer le temps restant jusqu'à la deadline si applicable
            const contest = contests?.find((c: any) => c.id === entry.contest_id);
            const deadlineDate = contest?.registration_close_date ? new Date(contest.registration_close_date) : null;
            const now = new Date();
            const isDraft = entry.status === "draft";
            const isRegistrationActive = contest?.status === "registration";
            const hoursLeft = deadlineDate && isRegistrationActive ? differenceInHours(deadlineDate, now) : null;
            const daysLeft = deadlineDate && isRegistrationActive ? differenceInDays(deadlineDate, now) : null;
            const showDeadlineWarning = isDraft && deadlineDate && hoursLeft !== null && hoursLeft > 0 && hoursLeft <= 7 * 24;

            return (
            <Card key={entry.id} className="border-border/60 hover:border-accent/40 transition-colors">
              <CardHeader className="space-y-1">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-xl text-foreground">{entry.strain_name}</CardTitle>
                      {showDeadlineWarning && (
                        <Badge variant={hoursLeft! < 24 ? "destructive" : "default"} className="gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {hoursLeft! < 24 
                            ? `${Math.round(hoursLeft!)}h`
                            : daysLeft! <= 3 
                            ? `${daysLeft!}j`
                            : "Deadline"}
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{entry.contest?.name ?? contest?.name ?? "Concours à confirmer"}</CardDescription>
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
              {entry.status === "draft" && (
                <CardContent className="pt-0 border-t">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="flex-1"
                    >
                      <Link to={`/submit-entry/${entry.contest_id}?edit=${entry.id}`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Modifier
                      </Link>
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleSubmit(entry.id)}
                      disabled={submitEntryMutation.isPending}
                      className="flex-1"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Soumettre
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(entry.id)}
                      disabled={deleteEntryMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              )}
              {showDeadlineWarning && (
                <CardContent className="pt-0 border-t bg-amber-50 dark:bg-amber-950/20">
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-amber-900 dark:text-amber-100">
                      {hoursLeft! < 24
                        ? `⚠️ Deadline dans ${Math.round(hoursLeft!)} heure(s) ! Soumettez rapidement votre entrée.`
                        : daysLeft! <= 3
                        ? `⚠️ Deadline dans ${daysLeft} jour(s). N'oubliez pas de soumettre votre entrée.`
                        : `📅 Deadline approchant. Pensez à finaliser votre soumission.`}
                    </span>
                  </div>
                </CardContent>
              )}
            </Card>
          );
          })
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
      {/* Menu de navigation rapide pour producteurs */}
      <Card className="border-border/70 bg-muted/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5" />
            Actions rapides
          </CardTitle>
          <CardDescription>
            Accès rapide aux fonctionnalités producteur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Button variant="outline" className="h-auto flex-col items-start justify-start p-4" asChild>
              <Link to="/submit-entry">
                <Plus className="h-5 w-5 mb-2" />
                <span className="font-semibold">Soumettre une entrée</span>
                <span className="text-xs text-muted-foreground mt-1">Nouvelle candidature</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start justify-start p-4" asChild>
              <Link to="/contests">
                <ListChecks className="h-5 w-5 mb-2" />
                <span className="font-semibold">Voir les concours</span>
                <span className="text-xs text-muted-foreground mt-1">Concours disponibles</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start justify-start p-4" asChild>
              <Link to="/settings">
                <Settings className="h-5 w-5 mb-2" />
                <span className="font-semibold">Paramètres</span>
                <span className="text-xs text-muted-foreground mt-1">Notifications</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Leaf} label="Entrées totales" value={data.totals.totalEntries} hint="Toutes éditions confondues" accent="bg-accent/10 text-accent" />
        <StatCard icon={CheckCircle2} label="Entrées approuvées" value={data.totals.approved} hint="Prêtes pour le jury" accent="bg-accent/20 text-accent" />
        <StatCard icon={Shield} label="Dossiers en revue" value={data.totals.submitted} hint="Soumises / en validation" accent="bg-secondary/20 text-secondary-foreground" />
        <StatCard icon={Star} label="Note moyenne jury" value={data.overallAverage ? `${data.overallAverage}/100` : "—"} hint="Basée sur vos fiches récentes" />
      </div>

      {/* Deadline Tracker */}
      {data.deadlines && data.deadlines.length > 0 && (
        <DeadlineTracker deadlines={data.deadlines} />
      )}

      <SectionWrapper title="Entrées actives" description="Suivi temps réel de vos candidatures.">
        <ProducerEntriesList entries={data.entries} contests={data.deadlines || []} />
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
      {/* Menu de navigation rapide pour juges */}
      <Card className="border-border/70 bg-muted/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5" />
            Actions rapides
          </CardTitle>
          <CardDescription>
            Accès rapide aux fonctionnalités juge
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Button variant="outline" className="h-auto flex-col items-start justify-start p-4" asChild>
              <Link to="/contests">
                <ListChecks className="h-5 w-5 mb-2" />
                <span className="font-semibold">Voir les concours</span>
                <span className="text-xs text-muted-foreground mt-1">Mes assignations</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start justify-start p-4" asChild>
              <Link to="/dashboard">
                <BarChart3 className="h-5 w-5 mb-2" />
                <span className="font-semibold">Mes statistiques</span>
                <span className="text-xs text-muted-foreground mt-1">Voir ce panel</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start justify-start p-4" asChild>
              <Link to="/settings">
                <Settings className="h-5 w-5 mb-2" />
                <span className="font-semibold">Paramètres</span>
                <span className="text-xs text-muted-foreground mt-1">Notifications</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

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

const OrganizerPanel = () => {
  const { data, isLoading, error } = useOrganizerAnalytics();

  const exportToCSV = () => {
    if (!data) return;

    // Préparer les données pour l'export
    const csvRows: string[] = [];
    
    // En-têtes
    csvRows.push("Statistiques Globales");
    csvRows.push(`Total Concours,${data.totalContests}`);
    csvRows.push(`Concours Actifs,${data.activeContests}`);
    csvRows.push(`Total Entrées,${data.totalEntries}`);
    csvRows.push(`Total Producteurs,${data.totalProducers}`);
    csvRows.push(`Total Juges,${data.totalJudges}`);
    csvRows.push(`Total Votes,${data.totalVotes}`);
    csvRows.push("");
    
    csvRows.push("Participation");
    csvRows.push(`Producteurs Actifs,${data.participation.activeProducers}`);
    csvRows.push(`Votants Actifs,${data.participation.activeVoters}`);
    csvRows.push("");
    
    csvRows.push("Engagement");
    csvRows.push(`Votes moyens par entrée,${data.engagement.averageVotesPerEntry}`);
    csvRows.push(`Scores moyens par entrée,${data.engagement.averageScoresPerEntry}`);
    csvRows.push(`Taux de complétion,${data.engagement.completionRate}%`);
    csvRows.push("");
    
    csvRows.push("Statistiques par Concours");
    csvRows.push("Nom,Statut,Entrées,Votes,Juges,Score Moyen");
    data.contestsStats.forEach((contest) => {
      csvRows.push(
        `"${contest.name}",${contest.status},${contest.entriesCount},${contest.votesCount},${contest.judgesCount},${contest.averageScore || "N/A"}`
      );
    });

    // Créer le fichier CSV
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `analytics-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = async () => {
    if (!data) return;

    // Lazy load jspdf uniquement quand nécessaire
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable")
    ]);

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Titre
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Rapport Analytics - CBD Flower Cup", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 10;

    // Date
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const dateStr = new Date().toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    doc.text(`Généré le ${dateStr}`, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;

    // Statistiques Globales
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Statistiques Globales", 14, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const globalStats = [
      ["Total Concours", data.totalContests.toString()],
      ["Concours Actifs", data.activeContests.toString()],
      ["Total Entrées", data.totalEntries.toString()],
      ["Total Producteurs", data.totalProducers.toString()],
      ["Total Juges", data.totalJudges.toString()],
      ["Total Votes", data.totalVotes.toString()],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [["Métrique", "Valeur"]],
      body: globalStats,
      theme: "striped",
      headStyles: { fillColor: [44, 62, 80] },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Participation
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Participation", 14, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const participationStats = [
      ["Producteurs Actifs", data.participation.activeProducers.toString()],
      ["Votants Actifs", data.participation.activeVoters.toString()],
      ["Total Producteurs", data.participation.totalProducers.toString()],
      ["Total Viewers", data.participation.totalViewers.toString()],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [["Métrique", "Valeur"]],
      body: participationStats,
      theme: "striped",
      headStyles: { fillColor: [44, 62, 80] },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Engagement
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Engagement", 14, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const engagementStats = [
      ["Votes moyens par entrée", data.engagement.averageVotesPerEntry.toString()],
      ["Scores moyens par entrée", data.engagement.averageScoresPerEntry.toString()],
      ["Taux de complétion", `${data.engagement.completionRate}%`],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [["Métrique", "Valeur"]],
      body: engagementStats,
      theme: "striped",
      headStyles: { fillColor: [44, 62, 80] },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Statistiques par Concours
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Statistiques par Concours", 14, yPosition);
    yPosition += 8;

    const contestsTableData = data.contestsStats.map((contest) => [
      contest.name.length > 30 ? contest.name.substring(0, 30) + "..." : contest.name,
      contest.status,
      contest.entriesCount.toString(),
      contest.votesCount.toString(),
      contest.judgesCount.toString(),
      contest.averageScore ? contest.averageScore.toString() : "N/A",
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [["Nom", "Statut", "Entrées", "Votes", "Juges", "Score Moyen"]],
      body: contestsTableData,
      theme: "striped",
      headStyles: { fillColor: [44, 62, 80] },
      styles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 30 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 20 },
        5: { cellWidth: 25 },
      },
    });

    // Sauvegarder le PDF
    const fileName = `analytics-${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(fileName);
    toast.success("PDF généré avec succès !");
  };

  if (isLoading) {
    return <LoadingState message="Chargement des analytics…" />;
  }

  if (error || !data) {
    return <ErrorState message="Impossible de charger les analytics." />;
  }

  // Préparer les données pour les graphiques
  const timelineData = data.timeline.map((item) => ({
    date: new Date(item.date).toLocaleDateString("fr-FR", { month: "short", day: "numeric" }),
    Entrées: item.entries,
    Votes: item.votes,
    Scores: item.scores,
  }));

  const contestsData = data.contestsStats.map((contest) => ({
    name: contest.name.length > 20 ? contest.name.substring(0, 20) + "..." : contest.name,
    Entrées: contest.entriesCount,
    Votes: contest.votesCount,
    "Score Moyen": contest.averageScore || 0,
  }));

  return (
    <div className="space-y-10">
      {/* Menu de navigation rapide pour organisateurs */}
      <Card className="border-border/70 bg-muted/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5" />
            Gestion de l'événement
          </CardTitle>
          <CardDescription>
            Accès rapide à toutes les fonctionnalités de gestion
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            <Button variant="outline" className="h-auto flex-col items-start justify-start p-4" asChild>
              <Link to="/manage-contests">
                <Calendar className="h-5 w-5 mb-2" />
                <span className="font-semibold">Gérer les concours</span>
                <span className="text-xs text-muted-foreground mt-1">Créer, modifier, supprimer</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start justify-start p-4" asChild>
              <Link to="/dashboard">
                <BarChart3 className="h-5 w-5 mb-2" />
                <span className="font-semibold">Analytics</span>
                <span className="text-xs text-muted-foreground mt-1">Statistiques et rapports</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start justify-start p-4" asChild>
              <Link to="/contests">
                <ListChecks className="h-5 w-5 mb-2" />
                <span className="font-semibold">Voir les concours</span>
                <span className="text-xs text-muted-foreground mt-1">Liste publique</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start justify-start p-4" asChild>
              <Link to="/review-entries">
                <FileText className="h-5 w-5 mb-2" />
                <span className="font-semibold">Validation COA</span>
                <span className="text-xs text-muted-foreground mt-1">Révision des entrées</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start justify-start p-4" asChild>
              <Link to="/monitor-votes">
                <Shield className="h-5 w-5 mb-2" />
                <span className="font-semibold">Monitoring Anti-Fraude</span>
                <span className="text-xs text-muted-foreground mt-1">Votes suspects</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start justify-start p-4" asChild>
              <Link to="/monitor-judge-conflicts">
                <Scale className="h-5 w-5 mb-2" />
                <span className="font-semibold">Conflits Juges</span>
                <span className="text-xs text-muted-foreground mt-1">Surveillance</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start justify-start p-4" asChild>
              <Link to="/judge-bias-analysis">
                <BarChart3 className="h-5 w-5 mb-2" />
                <span className="font-semibold">Biais Juges</span>
                <span className="text-xs text-muted-foreground mt-1">Analyse statistique</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start justify-start p-4" asChild>
              <Link to="/moderate-comments">
                <Shield className="h-5 w-5 mb-2" />
                <span className="font-semibold">Modération</span>
                <span className="text-xs text-muted-foreground mt-1">Commentaires</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start justify-start p-4" asChild>
              <Link to="/settings">
                <Settings className="h-5 w-5 mb-2" />
                <span className="font-semibold">Paramètres</span>
                <span className="text-xs text-muted-foreground mt-1">Notifications</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques globales */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          icon={Award}
          label="Total Concours"
          value={data.totalContests}
          hint={`${data.activeContests} actifs`}
          accent="bg-accent/10 text-accent"
        />
        <StatCard
          icon={Leaf}
          label="Total Entrées"
          value={data.totalEntries}
          hint="Toutes éditions confondues"
        />
        <StatCard
          icon={Users}
          label="Producteurs"
          value={data.participation.activeProducers}
          hint={`${data.participation.totalProducers} au total`}
        />
        <StatCard
          icon={Star}
          label="Total Votes"
          value={data.totalVotes}
          hint="Votes publics"
        />
      </div>

      {/* Engagement */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={TrendingUp}
          label="Votes/Entrée"
          value={data.engagement.averageVotesPerEntry}
          hint="Engagement moyen"
        />
        <StatCard
          icon={BarChart3}
          label="Scores/Entrée"
          value={data.engagement.averageScoresPerEntry}
          hint="Évaluations moyennes"
        />
        <StatCard
          icon={CheckCircle2}
          label="Complétion"
          value={`${data.engagement.completionRate}%`}
          hint="Entrées évaluées"
        />
      </div>

      {/* Graphiques avec lazy loading */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-foreground">Graphiques Analytics</h3>
            <p className="text-sm text-muted-foreground">Visualisation des données</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportToPDF}>
              <FileText className="mr-2 h-4 w-4" />
              PDF
            </Button>
          </div>
        </div>
        <OrganizerCharts timelineData={timelineData} contestsData={contestsData} />
      </div>

      {/* Liste détaillée des concours avec actions */}
      <SectionWrapper
        title="Détails par concours"
        description="Tableau récapitulatif de tous les concours avec actions de gestion"
      >
        <div className="grid gap-4">
          {data.contestsStats.map((contest) => (
            <Card key={contest.id} className="border-border/60">
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <CardTitle className="text-lg">{contest.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">ID: {contest.id}</p>
                  </div>
                  <Badge variant="secondary" className="capitalize">{contest.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="rounded-xl bg-muted/50 p-4">
                    <p className="text-xs text-muted-foreground mb-1">Entrées</p>
                    <p className="text-lg font-semibold text-foreground">{contest.entriesCount}</p>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-4">
                    <p className="text-xs text-muted-foreground mb-1">Votes</p>
                    <p className="text-lg font-semibold text-foreground">{contest.votesCount}</p>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-4">
                    <p className="text-xs text-muted-foreground mb-1">Juges</p>
                    <p className="text-lg font-semibold text-foreground">{contest.judgesCount}</p>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-4">
                    <p className="text-xs text-muted-foreground mb-1">Score moyen</p>
                    <p className="text-lg font-semibold text-foreground">
                      {contest.averageScore ? `${contest.averageScore}/100` : "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/manage-contests/${contest.id}/judges`}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Gérer les juges
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/contests/${contest.id}/results`}>
                      <Trophy className="mr-2 h-4 w-4" />
                      Voir les résultats
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/contests?contest=${contest.id}`}>
                      <ListChecks className="mr-2 h-4 w-4" />
                      Voir les entrées
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/manage-contests">
                      <Settings className="mr-2 h-4 w-4" />
                      Modifier le concours
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </SectionWrapper>
    </div>
  );
};

const CalendarIcon = Clock3;

const Dashboard = () => {
  const { profile } = useAuth();
  const { shouldShowOnboarding, onboardingStatus, isLoading: isLoadingOnboarding } = useOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Afficher l'onboarding automatiquement si nécessaire
  useEffect(() => {
    if (!isLoadingOnboarding && shouldShowOnboarding && profile) {
      setShowOnboarding(true);
    }
  }, [shouldShowOnboarding, isLoadingOnboarding, profile]);

  // Déterminer l'onglet par défaut selon le rôle de l'utilisateur
  const defaultTab = useMemo(() => {
    if (!profile) return "viewer";
    switch (profile.role) {
      case "organizer":
        return "organizer";
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
    if (profile.role === "organizer") {
      tabs.push("organizer");
    }
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
      {/* Onboarding Wizard */}
      {profile && (
        <OnboardingWizard
          open={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          userRole={profile.role}
        />
      )}
      
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <Badge className="mb-4 bg-gradient-gold text-foreground/80">Espace membre</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Tableaux de bord optimisés</h1>
          <p className="text-muted-foreground text-lg">
            Vue unifiée pour les membres gratuits, producteurs et jurés. Sélectionnez votre rôle pour accéder à vos indicateurs clés.
          </p>
        </div>

        <Tabs defaultValue={defaultTab} className="space-y-10">
          <TabsList className={`grid gap-2 bg-muted/40 ${
            availableTabs.length === 4 
              ? "grid-cols-2 md:grid-cols-4" 
              : availableTabs.length === 3
              ? "grid-cols-1 md:grid-cols-3"
              : "grid-cols-1 md:grid-cols-2"
          }`}>
            {availableTabs.includes("viewer") && (
              <TabsTrigger value="viewer" className="data-[state=active]:bg-background">
                <Eye className="mr-2 h-4 w-4" /> Membre gratuit
              </TabsTrigger>
            )}
            {availableTabs.includes("organizer") && (
              <TabsTrigger value="organizer" className="data-[state=active]:bg-background">
                <BarChart3 className="mr-2 h-4 w-4" /> Analytics
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

          {availableTabs.includes("organizer") && (
            <TabsContent value="organizer">
              <OrganizerPanel />
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

