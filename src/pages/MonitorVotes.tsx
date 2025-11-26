import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle, Shield, TrendingDown, Users, Clock, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { usePagination } from "@/hooks/use-pagination";
import { PaginationControls } from "@/components/PaginationControls";

const MonitorVotes = () => {
  const navigate = useNavigate();

  // Récupérer les votes suspects via une fonction SQL sécurisée
  // Utilise une fonction RPC pour éviter les problèmes de RLS avec les jointures complexes
  const { data: suspiciousVotes, isLoading, error } = useQuery({
    queryKey: ["suspicious-votes"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_suspicious_votes_for_organizer", {
        p_days_back: 7,
      });

      if (error) throw error;
      
      // Transformer les données pour correspondre au format attendu par le reste du code
      return (data || []).map((vote: any) => ({
        ...vote,
        entry: {
          id: vote.entry_id,
          strain_name: vote.entry_strain_name,
          contest: {
            id: vote.contest_id,
            name: vote.contest_name,
          },
        },
        voter: {
          id: vote.voter_profile_id,
          display_name: vote.voter_display_name,
        },
      }));
    },
  });

  // Statistiques globales
  const stats = {
    total: suspiciousVotes?.length || 0,
    uniqueUsers: new Set(suspiciousVotes?.map(v => v.voter_profile_id).filter(Boolean) || []).size,
    uniqueIPs: new Set(suspiciousVotes?.map(v => v.ip_address).filter(Boolean) || []).size,
    last24h: suspiciousVotes?.filter(v => {
      const voteDate = new Date(v.created_at);
      const now = new Date();
      return (now.getTime() - voteDate.getTime()) < 24 * 60 * 60 * 1000;
    }).length || 0,
  };

  const { paginatedData, currentPage, totalPages, goToPage } = usePagination({
    data: suspiciousVotes || [],
    itemsPerPage: 20,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="pt-28 pb-16">
          <div className="container mx-auto px-4">
            <LoadingState message="Chargement des votes suspects..." />
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
            <ErrorState message="Impossible de charger les votes suspects" />
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
              <Shield className="h-8 w-8 text-accent" />
              <h1 className="text-4xl font-bold text-foreground">
                Monitoring Anti-Fraude
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Surveillez les votes suspects et détectez les tentatives de fraude
            </p>
          </div>

          {/* Statistiques */}
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Votes Suspects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total détectés
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Utilisateurs Uniques
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats.uniqueUsers}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Comptes impliqués
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Adresses IP Uniques
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats.uniqueIPs}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  IPs suspectes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Dernières 24h
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats.last24h}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Votes récents
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Liste des votes suspects */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Votes Suspects Détectés
              </CardTitle>
              <CardDescription>
                Votes qui correspondent aux critères de détection de fraude (rate limiting, multi-comptes, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paginatedData.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {paginatedData.map((vote: any) => (
                      <Card key={vote.id} className="border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="destructive" className="text-xs">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Suspect
                                </Badge>
                                {vote.entry?.strain_name && (
                                  <span className="font-semibold text-foreground">
                                    {vote.entry.strain_name}
                                  </span>
                                )}
                                {vote.entry?.contest?.name && (
                                  <span className="text-sm text-muted-foreground">
                                    • {vote.entry.contest.name}
                                  </span>
                                )}
                              </div>

                              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">Utilisateur:</span>
                                  <span className="font-medium">
                                    {vote.voter?.display_name || "Anonyme"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Globe className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">IP:</span>
                                  <span className="font-mono text-xs">{vote.ip_address || "N/A"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">Date:</span>
                                  <span className="font-medium">
                                    {new Date(vote.created_at).toLocaleString("fr-FR")}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Star className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">Vote:</span>
                                  <span className="font-medium">{vote.score}/5 ⭐</span>
                                </div>
                              </div>

                              {vote.client_fingerprint && (
                                <div className="text-xs text-muted-foreground font-mono">
                                  Fingerprint: {vote.client_fingerprint.substring(0, 16)}...
                                </div>
                              )}
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
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Aucun vote suspect détecté</p>
                  <p className="text-sm mt-2">
                    Le système de détection de fraude n'a identifié aucun comportement suspect.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Note informative */}
          <Card className="mt-6 border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-foreground mb-2">Critères de détection</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Plus de 10 votes par heure par utilisateur</li>
                    <li>Plus de 50 votes par jour par utilisateur</li>
                    <li>Plus de 3 utilisateurs différents votant depuis la même IP en 1 heure</li>
                    <li>Plus de 8 votes par utilisateur en 1 heure</li>
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

const MonitorVotesPage = () => (
  <ProtectedRoute requiredRole="organizer">
    <MonitorVotes />
  </ProtectedRoute>
);

export default MonitorVotesPage;

