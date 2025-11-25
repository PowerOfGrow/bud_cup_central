import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus, X, Mail, Check, Clock, XCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useConfirm } from "@/hooks/use-confirm";

const ManageContestJudges = () => {
  const { contestId } = useParams<{ contestId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

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

  // Récupérer tous les profils avec rôle judge
  const { data: allJudges, isLoading: judgesLoading } = useQuery({
    queryKey: ["judges", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .in("role", ["judge", "organizer"])
        .order("display_name", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Récupérer les juges avec conflits d'intérêt (producteurs dans ce concours)
  const { data: judgesWithConflicts } = useQuery({
    queryKey: ["judge-conflicts", contestId],
    queryFn: async () => {
      if (!contestId) return [];
      const { data, error } = await supabase
        .from("entries")
        .select("producer_id")
        .eq("contest_id", contestId)
        .neq("status", "rejected");

      if (error) throw error;
      return new Set(data?.map((e) => e.producer_id) || []);
    },
    enabled: !!contestId,
  });

  // Récupérer les juges assignés à ce concours
  const { data: assignedJudges, isLoading: assignedLoading } = useQuery({
    queryKey: ["contest-judges", contestId],
    queryFn: async () => {
      if (!contestId) return [];
      const { data, error } = await supabase
        .from("contest_judges")
        .select(
          `
          *,
          judge:profiles!contest_judges_judge_id_fkey (
            id,
            display_name,
            organization
          )
        `
        )
        .eq("contest_id", contestId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!contestId,
  });

  const { confirm: confirmRemove, ConfirmationDialog: RemoveDialog } = useConfirm({
    title: "Retirer le juge",
    message: "Êtes-vous sûr de vouloir retirer ce juge du concours ?",
  });

  const assignJudgeMutation = useMutation({
    mutationFn: async ({ judgeId, judgeRole }: { judgeId: string; judgeRole: string }) => {
      if (!contestId) throw new Error("Contest ID manquant");

      // Vérifier d'abord s'il y a un conflit d'intérêt (producteur dans ce concours)
      if (judgesWithConflicts?.has(judgeId)) {
        throw new Error("Conflit d'intérêt : ce juge participe au concours en tant que producteur");
      }

      // Utiliser la fonction RPC qui vérifie aussi le conflit côté serveur
      const { data, error } = await supabase.rpc("assign_contest_judge", {
        p_contest_id: contestId,
        p_judge_id: judgeId,
        p_judge_role: judgeRole,
        p_invitation_status: "pending",
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contest-judges", contestId] });
      queryClient.invalidateQueries({ queryKey: ["judge-conflicts", contestId] });
      toast.success("Juge assigné avec succès !");
    },
    onError: (error: any) => {
      // Gérer les erreurs spécifiques
      if (error.code === "23505" || error.message?.includes("already assigned")) {
        toast.error("Ce juge est déjà assigné à ce concours");
      } else if (error.message?.includes("Conflict of interest") || error.message?.includes("Conflit d'intérêt")) {
        toast.error(
          "Conflit d'intérêt détecté : ce juge participe au concours en tant que producteur et ne peut pas être assigné comme juge.",
          { duration: 6000 }
        );
      } else {
        toast.error(error.message || "Erreur lors de l'assignation du juge");
      }
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      assignmentId,
      status,
    }: {
      assignmentId: number;
      status: string;
    }) => {
      const { error } = await supabase
        .from("contest_judges")
        .update({ invitation_status: status })
        .eq("id", assignmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contest-judges", contestId] });
      toast.success("Statut mis à jour !");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la mise à jour");
    },
  });

  const removeJudgeMutation = useMutation({
    mutationFn: async (assignmentId: number) => {
      const { error } = await supabase
        .from("contest_judges")
        .delete()
        .eq("id", assignmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contest-judges", contestId] });
      toast.success("Juge retiré du concours");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la suppression");
    },
  });

  const handleAssignJudge = async (judgeId: string) => {
    assignJudgeMutation.mutate({ judgeId, judgeRole: "judge" });
  };

  const handleUpdateStatus = (assignmentId: number, newStatus: string) => {
    updateStatusMutation.mutate({ assignmentId, status: newStatus });
  };

  const handleRemoveJudge = async (assignmentId: number) => {
    const confirmed = await confirmRemove();
    if (confirmed) {
      removeJudgeMutation.mutate(assignmentId);
    }
  };

  // Filtrer les juges disponibles (non assignés et sans conflit d'intérêt)
  const assignedJudgeIds = new Set(assignedJudges?.map((aj) => aj.judge_id) || []);
  const availableJudges = allJudges?.filter(
    (judge) =>
      !assignedJudgeIds.has(judge.id) &&
      !judgesWithConflicts?.has(judge.id) && // Exclure les juges avec conflit
      (searchQuery.trim() === "" ||
        judge.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        judge.organization?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Juges avec conflits d'intérêt (pour affichage informatif)
  const conflictedJudges = allJudges?.filter(
    (judge) =>
      !assignedJudgeIds.has(judge.id) &&
      judgesWithConflicts?.has(judge.id) &&
      (searchQuery.trim() === "" ||
        judge.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        judge.organization?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const statusLabels: Record<string, string> = {
    pending: "En attente",
    accepted: "Accepté",
    declined: "Refusé",
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-500",
    accepted: "bg-green-500/10 text-green-600 dark:text-green-500",
    declined: "bg-red-500/10 text-red-600 dark:text-red-500",
  };

  const statusIcons: Record<string, typeof Clock> = {
    pending: Clock,
    accepted: Check,
    declined: XCircle,
  };

  if (!user || !profile || profile.role !== "organizer") {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="pt-28 pb-16">
          <div className="container mx-auto px-4">
            <ErrorState message="Seuls les organisateurs peuvent gérer les juges" />
          </div>
        </div>
      </div>
    );
  }

  if (contestLoading || judgesLoading || assignedLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="pt-28 pb-16">
          <div className="container mx-auto px-4">
            <LoadingState message="Chargement..." />
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

  return (
    <div className="min-h-screen">
      <Header />
      <div className="pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <Button
            variant="ghost"
            onClick={() => navigate("/manage-contests")}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux concours
          </Button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Gestion des juges - {contest.name}
            </h1>
            <p className="text-muted-foreground">
              Assignez des juges à ce concours et gérez leurs invitations
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Juges assignés */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Juges assignés</CardTitle>
                <CardDescription>
                  {assignedJudges?.length || 0} juge(s) assigné(s) à ce concours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RemoveDialog />
                {assignedJudges && assignedJudges.length > 0 ? (
                  <div className="space-y-3">
                    {assignedJudges.map((assignment) => {
                      const StatusIcon = statusIcons[assignment.invitation_status] || Clock;
                      return (
                        <Card key={assignment.id} className="border-border/60">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold text-foreground">
                                    {assignment.judge?.display_name || "Juge inconnu"}
                                  </h3>
                                  <Badge className={statusColors[assignment.invitation_status]}>
                                    <StatusIcon className="mr-1 h-3 w-3" />
                                    {statusLabels[assignment.invitation_status]}
                                  </Badge>
                                </div>
                                {assignment.judge?.organization && (
                                  <p className="text-sm text-muted-foreground mb-1">
                                    {assignment.judge.organization}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  Rôle : {assignment.judge_role}
                                </p>
                              </div>
                              <div className="flex flex-col gap-2">
                                <Select
                                  value={assignment.invitation_status}
                                  onValueChange={(value) =>
                                    handleUpdateStatus(assignment.id, value)
                                  }
                                >
                                  <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">En attente</SelectItem>
                                    <SelectItem value="accepted">Accepté</SelectItem>
                                    <SelectItem value="declined">Refusé</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleRemoveJudge(assignment.id)}
                                  disabled={removeJudgeMutation.isPending}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun juge assigné pour le moment
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ajouter des juges */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Ajouter un juge</CardTitle>
                <CardDescription>
                  Recherchez et assignez des juges à ce concours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Input
                    placeholder="Rechercher un juge..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />

                  {availableJudges && availableJudges.length > 0 ? (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {availableJudges.map((judge) => (
                        <Card key={judge.id} className="border-border/60">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1">
                                <h4 className="font-semibold text-foreground">
                                  {judge.display_name}
                                </h4>
                                {judge.organization && (
                                  <p className="text-sm text-muted-foreground">
                                    {judge.organization}
                                  </p>
                                )}
                                <Badge variant="outline" className="mt-1">
                                  {judge.role}
                                </Badge>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleAssignJudge(judge.id)}
                                disabled={assignJudgeMutation.isPending}
                              >
                                <UserPlus className="mr-2 h-4 w-4" />
                                Assigner
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchQuery.trim()
                        ? "Aucun juge ne correspond à votre recherche"
                        : "Tous les juges disponibles sont déjà assignés"}
                    </div>
                  )}

                  {/* Afficher les juges avec conflit d'intérêt */}
                  {conflictedJudges && conflictedJudges.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <p className="text-sm font-semibold text-foreground">
                          Juges non disponibles (conflit d'intérêt)
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">
                        Ces juges participent au concours en tant que producteurs et ne peuvent pas être assignés comme juges.
                      </p>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {conflictedJudges.map((judge) => (
                          <Card key={judge.id} className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-foreground">
                                    {judge.display_name}
                                  </h4>
                                  {judge.organization && (
                                    <p className="text-sm text-muted-foreground">
                                      {judge.organization}
                                    </p>
                                  )}
                                  <Badge variant="outline" className="mt-1 border-amber-500/50">
                                    {judge.role}
                                  </Badge>
                                </div>
                                <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400">
                                  <AlertTriangle className="mr-1 h-3 w-3" />
                                  Producteur
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrapper avec ProtectedRoute
const ManageContestJudgesPage = () => (
  <ProtectedRoute requiredRole="organizer">
    <ManageContestJudges />
  </ProtectedRoute>
);

export default ManageContestJudgesPage;

