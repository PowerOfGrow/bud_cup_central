import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, User, Clock, Shield, AlertCircle, Edit, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/Header";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";

interface AuditLogEntry {
  id: string;
  entry_id: string;
  user_id: string | null;
  action: string;
  field_changed: string | null;
  old_value: any;
  new_value: any;
  reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user_display_name: string | null;
  user_role: string | null;
  entry_strain_name: string | null;
}

const getActionIcon = (action: string) => {
  switch (action) {
    case "created":
      return <FileText className="h-4 w-4 text-blue-500" />;
    case "updated":
      return <Edit className="h-4 w-4 text-orange-500" />;
    case "status_changed":
      return <Shield className="h-4 w-4 text-purple-500" />;
    case "thc_modified":
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case "coa_modified":
      return <FileText className="h-4 w-4 text-blue-500" />;
    case "coa_validated":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "coa_rejected":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "coa_deleted":
      return <Trash2 className="h-4 w-4 text-red-600" />;
    default:
      return <Edit className="h-4 w-4 text-gray-500" />;
  }
};

const getActionLabel = (action: string) => {
  const labels: Record<string, string> = {
    created: "Création",
    updated: "Modification",
    status_changed: "Changement de statut",
    thc_modified: "Modification THC",
    coa_modified: "Modification COA",
    coa_validated: "Validation COA",
    coa_rejected: "Rejet COA",
    coa_deleted: "Suppression COA",
    score_modified: "Modification de score",
    deleted: "Suppression",
  };
  return labels[action] || action;
};

const formatValue = (value: any): string => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  if (typeof value === "number") return value.toString();
  if (typeof value === "string") return value;
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
};

const EntryAuditHistory = () => {
  const { entryId } = useParams<{ entryId: string }>();
  const navigate = useNavigate();

  const { data: entry, isLoading: isLoadingEntry } = useQuery({
    queryKey: ["entry", entryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entries")
        .select("id, strain_name, contest_id, status")
        .eq("id", entryId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!entryId,
  });

  const { data: auditLogs, isLoading: isLoadingLogs, error } = useQuery<AuditLogEntry[]>({
    queryKey: ["entry-audit-log", entryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entry_audit_log_with_user")
        .select("*")
        .eq("entry_id", entryId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!entryId,
  });

  if (isLoadingEntry || isLoadingLogs) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="pt-28 pb-16">
          <div className="container mx-auto px-4">
            <LoadingState message="Chargement de l'historique..." />
          </div>
        </div>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="pt-28 pb-16">
          <div className="container mx-auto px-4">
            <ErrorState message="Impossible de charger l'historique de cette entrée" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
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
              <FileText className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Historique des modifications</h1>
            </div>
            <p className="text-muted-foreground">
              Traçabilité complète de l'entrée : <strong>{entry.strain_name}</strong>
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Informations de l'entrée</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Nom de la variété</p>
                  <p className="font-medium">{entry.strain_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Statut actuel</p>
                  <Badge variant="secondary" className="capitalize">{entry.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Actions</p>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/contests?contest=${entry.contest_id}`}>
                      Voir l'entrée
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Journal d'audit</CardTitle>
              <CardDescription>
                {auditLogs?.length || 0} événement(s) enregistré(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!auditLogs || auditLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun événement enregistré pour cette entrée.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {auditLogs.map((log, index) => (
                    <div key={log.id}>
                      <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
                        <div className="mt-1">
                          {getActionIcon(log.action)}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{getActionLabel(log.action)}</Badge>
                              {log.field_changed && (
                                <span className="text-sm text-muted-foreground">
                                  Champ : <strong>{log.field_changed}</strong>
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>{formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: fr })}</span>
                              <span className="text-xs">
                                ({format(new Date(log.created_at), "PPpp", { locale: fr })})
                              </span>
                            </div>
                          </div>

                          <div className="grid gap-2 md:grid-cols-2 text-sm">
                            {log.old_value !== null && (
                              <div className="p-2 rounded bg-muted/50">
                                <p className="text-xs text-muted-foreground mb-1">Ancienne valeur</p>
                                <p className="font-mono text-xs break-all">{formatValue(log.old_value)}</p>
                              </div>
                            )}
                            {log.new_value !== null && (
                              <div className="p-2 rounded bg-muted/50">
                                <p className="text-xs text-muted-foreground mb-1">Nouvelle valeur</p>
                                <p className="font-mono text-xs break-all">{formatValue(log.new_value)}</p>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-4">
                              {log.user_display_name && (
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  <span>{log.user_display_name}</span>
                                  {log.user_role && (
                                    <Badge variant="secondary" className="ml-1 text-xs capitalize">
                                      {log.user_role}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {log.reason && (
                            <div className="p-2 rounded bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                              <p className="text-xs text-blue-900 dark:text-blue-100">
                                <strong>Raison :</strong> {log.reason}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      {index < auditLogs.length - 1 && <Separator className="my-4" />}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const EntryAuditHistoryPage = () => (
  <ProtectedRoute requiredRole="organizer">
    <EntryAuditHistory />
  </ProtectedRoute>
);

export default EntryAuditHistoryPage;

