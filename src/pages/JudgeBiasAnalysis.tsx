import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, AlertTriangle, User, BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Header from "@/components/Header";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { supabase } from "@/integrations/supabase/client";
import { usePagination } from "@/hooks/use-pagination";
import { PaginationControls } from "@/components/PaginationControls";

interface JudgeBiasSummary {
  judge_id: string;
  judge_name: string;
  judge_role: string;
  total_evaluations: number;
  judge_average: number;
  global_average: number;
  score_difference: number;
  z_score: number;
  bias_category: "high_scorer" | "low_scorer" | "normal";
  abnormal_scores_count: number;
}

const JudgeBiasAnalysis = () => {
  const navigate = useNavigate();

  const { data: biasSummary, isLoading, error } = useQuery<JudgeBiasSummary[]>({
    queryKey: ["judge-bias-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("judge_bias_summary")
        .select("*")
        .order("z_score", { ascending: false, nullsLast: true });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: globalStats } = useQuery({
    queryKey: ["global-judge-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("judge_scores")
        .select("overall_score");

      if (error) throw error;

      const scores = (data || []).map((s: any) => s.overall_score);
      const avg = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
      const variance = scores.reduce((sum: number, val: number) => sum + Math.pow(val - avg, 2), 0) / scores.length;
      const stddev = Math.sqrt(variance);

      return {
        average: Math.round(avg * 10) / 10,
        stddev: Math.round(stddev * 10) / 10,
        total: scores.length,
      };
    },
  });

  const getBiasCategoryIcon = (category: string) => {
    switch (category) {
      case "high_scorer":
        return <TrendingUp className="h-4 w-4 text-orange-500" />;
      case "low_scorer":
        return <TrendingDown className="h-4 w-4 text-blue-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getBiasCategoryLabel = (category: string) => {
    switch (category) {
      case "high_scorer":
        return "Sur-notation";
      case "low_scorer":
        return "Sous-notation";
      default:
        return "Normal";
    }
  };

  const getBiasCategoryColor = (category: string) => {
    switch (category) {
      case "high_scorer":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "low_scorer":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const { paginatedData, currentPage, totalPages, goToPage } = usePagination({
    data: biasSummary || [],
    itemsPerPage: 15,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="pt-28 pb-16">
          <div className="container mx-auto px-4">
            <LoadingState message="Chargement de l'analyse des juges..." />
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
            <ErrorState message="Impossible de charger l'analyse des juges" />
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
              <BarChart3 className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Analyse du Biais des Juges</h1>
            </div>
            <p className="text-muted-foreground">
              Détection des juges qui sur-notent ou sous-notent systématiquement. Les statistiques sont calculées à partir d'au moins 3 évaluations.
            </p>
          </div>

          {/* Statistiques globales */}
          {globalStats && (
            <div className="grid gap-4 md:grid-cols-3 mb-8">
              <Card className="bg-muted/40">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Score Moyen Global</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{globalStats.average}/100</div>
                  <p className="text-xs text-muted-foreground">
                    {globalStats.total} évaluations au total
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-muted/40">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Écart-Type Global</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{globalStats.stddev.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">Variabilité des scores</p>
                </CardContent>
              </Card>
              <Card className="bg-muted/40">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Juges Analysés</CardTitle>
                  <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{biasSummary?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">Avec ≥3 évaluations</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tableau des juges */}
          <Card>
            <CardHeader>
              <CardTitle>Analyse par Juge</CardTitle>
                <CardDescription>
                  Les z-scores indiquent l'écart entre le score moyen du juge et la moyenne globale.
                  Un z-score &gt; 1.5 indique une sur-notation, &lt; -1.5 une sous-notation.
                </CardDescription>
            </CardHeader>
            <CardContent>
              {paginatedData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun juge avec suffisamment d'évaluations pour l'analyse.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Juge</TableHead>
                          <TableHead>Évaluations</TableHead>
                          <TableHead>Moyenne Juge</TableHead>
                          <TableHead>Moyenne Globale</TableHead>
                          <TableHead>Différence</TableHead>
                          <TableHead>Z-Score</TableHead>
                          <TableHead>Biais</TableHead>
                          <TableHead>Scores Anormaux</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedData.map((judge) => (
                          <TableRow key={judge.judge_id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                {judge.judge_name}
                                {judge.judge_role && (
                                  <Badge variant="secondary" className="text-xs capitalize">
                                    {judge.judge_role}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{judge.total_evaluations}</TableCell>
                            <TableCell className="font-semibold">
                              {judge.judge_average?.toFixed(1) || "—"}/100
                            </TableCell>
                            <TableCell>
                              {judge.global_average?.toFixed(1) || "—"}/100
                            </TableCell>
                            <TableCell>
                              <span
                                className={
                                  judge.score_difference > 0
                                    ? "text-orange-600 dark:text-orange-400"
                                    : judge.score_difference < 0
                                    ? "text-blue-600 dark:text-blue-400"
                                    : ""
                                }
                              >
                                {judge.score_difference > 0 ? "+" : ""}
                                {judge.score_difference?.toFixed(1) || "—"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span
                                className={
                                  Math.abs(judge.z_score || 0) > 1.5
                                    ? "font-semibold text-destructive"
                                    : ""
                                }
                              >
                                {judge.z_score?.toFixed(2) || "—"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={getBiasCategoryColor(judge.bias_category)}
                              >
                                <span className="flex items-center gap-1">
                                  {getBiasCategoryIcon(judge.bias_category)}
                                  {getBiasCategoryLabel(judge.bias_category)}
                                </span>
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {judge.abnormal_scores_count > 0 ? (
                                <Badge variant="destructive">
                                  {judge.abnormal_scores_count}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">0</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {totalPages > 1 && (
                    <div className="mt-4">
                      <PaginationControls
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={goToPage}
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Légende */}
          <Card className="mt-6 border-border/50">
            <CardHeader>
              <CardTitle className="text-sm">Légende</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>Z-Score</strong> : Mesure l'écart du score moyen du juge par rapport à la moyenne globale.
                Plus le z-score est élevé (positif), plus le juge sur-note. Plus il est faible (négatif), plus le juge sous-note.
              </p>
                <p>
                  <strong>Scores Anormaux</strong> : Nombre de scores individuels avec un z-score &gt; 2 ou &lt; -2 par rapport
                  à la distribution personnelle du juge. Cela peut indiquer des évaluations particulièrement élevées ou faibles.
                </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const JudgeBiasAnalysisPage = () => (
  <ProtectedRoute requiredRole="organizer">
    <JudgeBiasAnalysis />
  </ProtectedRoute>
);

export default JudgeBiasAnalysisPage;

