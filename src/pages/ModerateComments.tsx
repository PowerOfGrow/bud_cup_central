import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertTriangle, CheckCircle2, XCircle, Eye, EyeOff, Flag, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

interface PendingComment {
  id: string;
  entry_id: string;
  user_id: string;
  content: string;
  created_at: string;
  spam_score: number;
  flagged_as_spam: boolean;
  status: string;
  entry_name: string;
  contest_id: string;
  contest_name: string;
  user_name: string;
  user_organization: string | null;
  report_count: number;
}

const ModerateComments = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"pending" | "all">("pending");
  const [moderatingId, setModeratingId] = useState<string | null>(null);
  const [moderationReason, setModerationReason] = useState("");
  const [moderationAction, setModerationAction] = useState<"approve" | "reject" | "hide" | null>(null);

  // Vérifier que l'utilisateur est organisateur
  if (profile?.role !== "organizer") {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="pt-28 pb-16">
          <div className="container mx-auto px-4">
            <ErrorState message="Accès réservé aux organisateurs" />
          </div>
        </div>
      </div>
    );
  }

  // Récupérer les commentaires en attente de modération
  const { data: comments, isLoading, error } = useQuery({
    queryKey: ["pending-comments", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("entry_comments")
        .select(`
          *,
          entry:entries!entry_comments_entry_id_fkey(
            id,
            strain_name,
            contest_id,
            contest:contests!entries_contest_id_fkey(id, name)
          ),
          user:profiles!entry_comments_user_id_fkey(id, display_name, avatar_url, organization)
        `)
        .in("status", statusFilter === "pending" ? ["pending", "hidden"] : ["pending", "approved", "rejected", "hidden"])
        .order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      // Récupérer les signalements pour chaque commentaire
      const commentsWithReports = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: reports } = await supabase
            .from("comment_reports")
            .select("id")
            .eq("comment_id", comment.id)
            .eq("status", "pending");

          return {
            ...comment,
            entry_name: (comment.entry as any)?.strain_name || "Entrée inconnue",
            contest_id: (comment.entry as any)?.contest_id || "",
            contest_name: ((comment.entry as any)?.contest as any)?.name || "Concours inconnu",
            user_name: (comment.user as any)?.display_name || "Utilisateur",
            user_organization: (comment.user as any)?.organization || null,
            report_count: reports?.length || 0,
          } as PendingComment;
        })
      );

      return commentsWithReports;
    },
  });

  // Mutation pour modérer un commentaire
  const moderateMutation = useMutation({
    mutationFn: async ({
      commentId,
      status,
      reason,
    }: {
      commentId: string;
      status: "approved" | "rejected" | "hidden";
      reason?: string;
    }) => {
      const { data, error } = await supabase.rpc("moderate_comment", {
        p_comment_id: commentId,
        p_status: status,
        p_reason: reason || null,
        p_moderator_id: profile?.id || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-comments"] });
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      toast.success("Action de modération enregistrée");
      setModeratingId(null);
      setModerationReason("");
      setModerationAction(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la modération");
    },
  });

  const handleModerate = (commentId: string, action: "approve" | "reject" | "hide") => {
    setModeratingId(commentId);
    setModerationAction(action);
    setModerationReason("");
  };

  const confirmModeration = () => {
    if (!moderatingId || !moderationAction) return;

    let status: "approved" | "rejected" | "hidden";
    switch (moderationAction) {
      case "approve":
        status = "approved";
        break;
      case "reject":
        status = "rejected";
        break;
      case "hide":
        status = "hidden";
        break;
    }

    moderateMutation.mutate({
      commentId: moderatingId,
      status,
      reason: moderationReason || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="pt-28 pb-16">
          <div className="container mx-auto px-4">
            <LoadingState message="Chargement des commentaires..." />
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
            <ErrorState message="Erreur lors du chargement des commentaires" />
          </div>
        </div>
      </div>
    );
  }

  const pendingCount = comments?.filter((c) => c.status === "pending").length || 0;

  return (
    <div className="min-h-screen">
      <Header />
      <div className="pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-8 w-8 text-accent" />
              <h1 className="text-4xl font-bold text-foreground">Modération des Commentaires</h1>
            </div>
            <p className="text-muted-foreground">
              Gérez les commentaires signalés et en attente de modération
            </p>
          </div>

          {/* Filtres */}
          <div className="mb-6 flex items-center gap-4">
            <Select value={statusFilter} onValueChange={(value: "pending" | "all") => setStatusFilter(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">
                  En attente ({pendingCount})
                </SelectItem>
                <SelectItem value="all">Tous les statuts</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Liste des commentaires */}
          <div className="space-y-4">
            {comments && comments.length > 0 ? (
              comments.map((comment) => (
                <Card key={comment.id} className="border-border/70">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={(comment.user as any)?.avatar_url} />
                        <AvatarFallback>{comment.user_name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-3">
                        {/* En-tête */}
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-foreground">{comment.user_name}</p>
                              {comment.user_organization && (
                                <Badge variant="outline" className="text-xs">
                                  {comment.user_organization}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.created_at), {
                                addSuffix: true,
                                locale: fr,
                              })}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">
                                {comment.entry_name}
                              </Badge>
                              <Badge variant="outline">
                                {comment.contest_name}
                              </Badge>
                              {comment.flagged_as_spam && (
                                <Badge variant="destructive" className="gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  Spam ({Math.round(comment.spam_score * 100)}%)
                                </Badge>
                              )}
                              {comment.report_count > 0 && (
                                <Badge variant="outline" className="gap-1">
                                  <Flag className="h-3 w-3" />
                                  {comment.report_count} signalement(s)
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {comment.status === "pending" ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-2"
                                  onClick={() => handleModerate(comment.id, "approve")}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                  Approuver
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-2 text-destructive"
                                  onClick={() => handleModerate(comment.id, "reject")}
                                >
                                  <XCircle className="h-4 w-4" />
                                  Rejeter
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-2"
                                  onClick={() => handleModerate(comment.id, "hide")}
                                >
                                  <EyeOff className="h-4 w-4" />
                                  Cacher
                                </Button>
                              </>
                            ) : comment.status === "hidden" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-2"
                                onClick={() => handleModerate(comment.id, "approve")}
                              >
                                <Eye className="h-4 w-4" />
                                Rendre visible
                              </Button>
                            ) : null}
                          </div>
                        </div>

                        {/* Contenu du commentaire */}
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Aucun commentaire à modérer</p>
                  <p className="text-sm">
                    {statusFilter === "pending"
                      ? "Tous les commentaires ont été modérés !"
                      : "Aucun commentaire trouvé."}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Dialog de confirmation de modération */}
      <AlertDialog
        open={moderatingId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setModeratingId(null);
            setModerationReason("");
            setModerationAction(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {moderationAction === "approve"
                ? "Approuver le commentaire"
                : moderationAction === "reject"
                ? "Rejeter le commentaire"
                : "Cacher le commentaire"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {moderationAction === "approve"
                ? "Le commentaire sera visible par tous les utilisateurs."
                : moderationAction === "reject"
                ? "Le commentaire sera rejeté et ne sera plus visible."
                : "Le commentaire sera caché mais pourra être réapprouvé plus tard."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Raison (optionnelle) :</label>
            <Textarea
              value={moderationReason}
              onChange={(e) => setModerationReason(e.target.value)}
              placeholder="Ajouter une note pour référence interne..."
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmModeration}
              className={moderationAction === "reject" ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ModerateComments;

