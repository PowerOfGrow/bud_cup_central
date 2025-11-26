import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle, Scale, Users, XCircle, CheckCircle2, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { usePagination } from "@/hooks/use-pagination";
import { PaginationControls } from "@/components/PaginationControls";
import { Link } from "react-router-dom";

const MonitorJudgeConflicts = () => {
  const navigate = useNavigate();

  // Récupérer les conflits via une fonction SQL sécurisée
  // Utilise une fonction RPC pour éviter les problèmes de RLS avec les jointures complexes
  const { data: conflicts, isLoading, error } = useQuery({
    queryKey: ["judge-conflicts"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_judge_conflicts_for_organizer");

      if (error) throw error;
      
      // Transformer les données pour correspondre au format attendu par le reste du code
      return (data || []).map((conflict: any) => ({
        ...conflict,
        judge_id: conflict.judge_id,
        contest_id: conflict.contest_id,
        judge: {
          id: conflict.judge_id,
          display_name: conflict.judge_display_name,
          organization: conflict.judge_organization,
          role: conflict.judge_role,
        },
        contest: {
          id: conflict.contest_id,
          name: conflict.contest_name,
          status: conflict.contest_status,
        },
        hasEntries: conflict.has_entries,
        entriesCount: conflict.entries_count,
        entries: (conflict.entry_names || []).map((strainName: string, index: number) => ({
          id: `entry-${conflict.judge_id}-${index}`, // ID temporaire pour l'affichage
          strain_name: strainName,
        })),
      }));
    },
  });

  const stats = {
    totalConflicts: conflicts?.length || 0,
    affectedContests: new Set(conflicts?.map((c: any) => c.contest_id) || []).size,
    affectedJudges: new Set(conflicts?.map((c: any) => c.judge_id) || []).size,
  };

  const { paginatedData, currentPage, totalPages, goToPage } = usePagination({
    data: conflicts || [],
    itemsPerPage: 10,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="pt-28 pb-16">
          <div className="container mx-auto px-4">
            <LoadingState message="Chargement des conflits..." />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="pt-28 pb-16">
          <div className="container mx-auto px-4">
            <ErrorState message="Impossible de charger les conflits" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Scale className="h-8 w-8 text-accent" />
              <h1 className="text-4xl font-bold text-foreground">
                Monitoring Conflits d'Intérêt
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Surveillez les conflits d'intérêt entre juges et producteurs
            </p>
          </div>

          {/* Statistiques */}
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Conflits Détectés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats.totalConflicts}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Assignations problématiques
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Juges Affectés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats.affectedJudges}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Juges en conflit
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Concours Affectés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats.affectedContests}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Concours avec conflits
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Liste des conflits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Conflits d'Intérêt Détectés
              </CardTitle>
              <CardDescription>
                Juges assignés à des concours où ils ont soumis des entrées (conflit d'intérêt)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paginatedData.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {paginatedData.map((conflict: any) => (
                      <Card key={`${conflict.contest_id}-${conflict.judge_id}`} className="border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="destructive" className="text-xs">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Conflit d'Intérêt
                                </Badge>
                                <span className="font-semibold text-foreground">
                                  {conflict.judge?.display_name || "Juge anonyme"}
                                </span>
                                {conflict.judge?.organization && (
                                  <span className="text-sm text-muted-foreground">
                                    • {conflict.judge.organization}
                                  </span>
                                )}
                              </div>

                              <div className="grid gap-2 md:grid-cols-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">Concours:</span>
                                  <Link 
                                    to={`/contests/${conflict.contest_id}/results`}
                                    className="font-medium text-accent hover:underline"
                                  >
                                    {conflict.contest?.name || "N/A"}
                                  </Link>
                                </div>
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                                  <span className="text-muted-foreground">Entrées soumises:</span>
                                  <span className="font-medium">{conflict.entriesCount}</span>
                                </div>
                              </div>

                              {conflict.entries && conflict.entries.length > 0 && (
                                <div className="mt-2 p-2 bg-background/50 rounded border border-amber-200 dark:border-amber-800">
                                  <p className="text-xs font-medium text-muted-foreground mb-1">
                                    Entrées du juge dans ce concours:
                                  </p>
                                  <ul className="text-xs space-y-1">
                                    {conflict.entries.map((entry: any) => (
                                      <li key={entry.id} className="flex items-center gap-2">
                                        <span className="text-foreground">{entry.strain_name}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              <div className="flex gap-2 mt-3">
                                <Button variant="outline" size="sm" asChild>
                                  <Link to={`/manage-contests/${conflict.contest_id}/judges`}>
                                    Gérer les juges
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
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
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
                  <p className="font-medium">Aucun conflit d'intérêt détecté</p>
                  <p className="text-sm mt-2">
                    Tous les juges assignés sont conformes. Le système de prévention automatique bloque les nouveaux conflits.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Note informative */}
          <Card className="mt-6 border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-foreground mb-2">Protection automatique</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Les nouveaux conflits sont automatiquement bloqués lors de l'assignation de juges</li>
                    <li>Les juges producteurs ne peuvent pas être assignés à des concours où ils ont des entrées</li>
                    <li>Les juges ne peuvent pas évaluer leurs propres entrées (blocage automatique)</li>
                    <li>Les conflits existants sont affichés ci-dessus pour revue manuelle</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const MonitorJudgeConflictsPage = () => (
  <ProtectedRoute requiredRole="organizer">
    <MonitorJudgeConflicts />
  </ProtectedRoute>
);

export default MonitorJudgeConflictsPage;

