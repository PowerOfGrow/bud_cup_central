import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, XCircle, FileText, Eye, AlertCircle, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Header from "@/components/Header";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { COAViewer } from "@/components/COAViewer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { usePagination } from "@/hooks/use-pagination";
import { PaginationControls } from "@/components/PaginationControls";

interface PendingEntry {
  id: string;
  contest_id: string;
  producer_id: string;
  strain_name: string;
  category: string;
  status: string;
  coa_url: string | null;
  thc_percent: number | null;
  cbd_percent: number | null;
  created_at: string;
  coa_validated: boolean;
  contest_name: string;
  contest_thc_limit: number | null;
  producer_name: string;
  producer_organization: string | null;
  coa_format_valid: boolean;
  coa_data_readable: boolean;
  coa_thc_compliant: boolean;
  coa_lab_recognized: boolean;
  coa_validation_notes: string | null;
}

const ReviewEntries = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedEntry, setSelectedEntry] = useState<PendingEntry | null>(null);
  const [isValidationDialogOpen, setIsValidationDialogOpen] = useState(false);
  
  // État du formulaire de validation
  const [validationForm, setValidationForm] = useState({
    formatValid: false,
    dataReadable: false,
    thcCompliant: false,
    labRecognized: false,
    notes: "",
  });

  const { data: pendingEntries, isLoading, error } = useQuery<PendingEntry[]>({
    queryKey: ["pending-coa-validation"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entries_pending_coa_validation")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const validateCOAMutation = useMutation({
    mutationFn: async ({ entryId, validated, form }: { entryId: string; validated: boolean; form: typeof validationForm }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const updateData: any = {
        coa_validated: validated,
        coa_validated_at: validated ? new Date().toISOString() : null,
        coa_validated_by: validated ? user.id : null,
        coa_format_valid: form.formatValid,
        coa_data_readable: form.dataReadable,
        coa_thc_compliant: form.thcCompliant,
        coa_lab_recognized: form.labRecognized,
        coa_validation_notes: form.notes || null,
      };

      // Si validé, passer le statut à "under_review" ou "approved" selon le contexte
      if (validated) {
        updateData.status = "under_review";
      } else {
        // Si rejeté, mettre à jour les notes et laisser le statut en "submitted" pour que le producteur puisse corriger
        updateData.coa_validation_notes = form.notes || "COA rejeté par l'organisateur";
      }

      const { error } = await supabase
        .from("entries")
        .update(updateData)
        .eq("id", entryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-coa-validation"] });
      setIsValidationDialogOpen(false);
      setSelectedEntry(null);
      setValidationForm({
        formatValid: false,
        dataReadable: false,
        thcCompliant: false,
        labRecognized: false,
        notes: "",
      });
      toast.success("Validation COA enregistrée avec succès");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la validation");
    },
  });

  const handleOpenValidationDialog = (entry: PendingEntry) => {
    setSelectedEntry(entry);
    setValidationForm({
      formatValid: entry.coa_format_valid || false,
      dataReadable: entry.coa_data_readable || false,
      thcCompliant: entry.coa_thc_compliant || false,
      labRecognized: entry.coa_lab_recognized || false,
      notes: entry.coa_validation_notes || "",
    });
    setIsValidationDialogOpen(true);
  };

  const handleValidate = (approved: boolean) => {
    if (!selectedEntry) return;
    
    // Vérifier que toutes les cases sont cochées si on valide
    if (approved && (!validationForm.formatValid || !validationForm.dataReadable || !validationForm.thcCompliant || !validationForm.labRecognized)) {
      toast.error("Veuillez cocher toutes les cases de la checklist avant d'approuver");
      return;
    }

    validateCOAMutation.mutate({
      entryId: selectedEntry.id,
      validated: approved,
      form: validationForm,
    });
  };

  const { paginatedData, currentPage, totalPages, goToPage } = usePagination({
    data: pendingEntries || [],
    itemsPerPage: 10,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="pt-28 pb-16">
          <div className="container mx-auto px-4">
            <LoadingState message="Chargement des entrées en attente de validation..." />
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
            <ErrorState message="Impossible de charger les entrées en attente de validation" />
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
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Validation des Certificats d'Analyse (COA)</h1>
            </div>
            <p className="text-muted-foreground">
              Examinez et validez les certificats d'analyse des entrées soumises. Utilisez la checklist pour garantir la conformité.
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Entrées en attente de validation</CardTitle>
              <CardDescription>
                {pendingEntries?.length || 0} entrée(s) nécessitant une validation COA
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paginatedData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune entrée en attente de validation COA.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {paginatedData.map((entry) => (
                      <Card key={entry.id} className="border-border/70">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg">{entry.strain_name}</CardTitle>
                              <CardDescription className="mt-1">
                                Concours : {entry.contest_name} • Producteur : {entry.producer_name}
                                {entry.producer_organization && ` (${entry.producer_organization})`}
                              </CardDescription>
                            </div>
                            <Badge variant="secondary" className="capitalize">{entry.status}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-4 md:grid-cols-3 mb-4">
                            <div className="rounded-xl bg-muted/50 p-4">
                              <p className="text-xs text-muted-foreground mb-1">THC</p>
                              <p className="text-sm font-medium text-foreground">
                                {entry.thc_percent ? `${entry.thc_percent}%` : "N/A"}
                                {entry.contest_thc_limit && ` / ${entry.contest_thc_limit}% max`}
                              </p>
                            </div>
                            <div className="rounded-xl bg-muted/50 p-4">
                              <p className="text-xs text-muted-foreground mb-1">CBD</p>
                              <p className="text-sm font-medium text-foreground">
                                {entry.cbd_percent ? `${entry.cbd_percent}%` : "N/A"}
                              </p>
                            </div>
                            <div className="rounded-xl bg-muted/50 p-4">
                              <p className="text-xs text-muted-foreground mb-1">Soumis il y a</p>
                              <p className="text-sm font-medium text-foreground">
                                {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true, locale: fr })}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {entry.coa_url && (
                              <COAViewer
                                entryId={entry.id}
                                coaUrl={entry.coa_url}
                                variant="button"
                              />
                            )}
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleOpenValidationDialog(entry)}
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              Valider le COA
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <Link to={`/contests?contest=${entry.contest_id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Voir l'entrée
                              </Link>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <Link to={`/entries/${entry.id}/audit-history`}>
                                <FileText className="mr-2 h-4 w-4" />
                                Historique
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
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
        </div>
      </div>

      {/* Dialog de validation COA */}
      <Dialog open={isValidationDialogOpen} onOpenChange={setIsValidationDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Validation du COA - {selectedEntry?.strain_name}</DialogTitle>
            <DialogDescription>
              Utilisez la checklist ci-dessous pour valider le certificat d'analyse. Toutes les cases doivent être cochées pour approuver.
            </DialogDescription>
          </DialogHeader>

          {selectedEntry && (
            <div className="space-y-6 py-4">
              {/* Informations de l'entrée */}
              <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                <p className="text-sm font-medium">Informations de l'entrée</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">THC :</span>{" "}
                    <span className="font-medium">
                      {selectedEntry.thc_percent ? `${selectedEntry.thc_percent}%` : "N/A"}
                    </span>
                    {selectedEntry.contest_thc_limit && (
                      <span className="text-muted-foreground"> / {selectedEntry.contest_thc_limit}% max</span>
                    )}
                  </div>
                  <div>
                    <span className="text-muted-foreground">CBD :</span>{" "}
                    <span className="font-medium">
                      {selectedEntry.cbd_percent ? `${selectedEntry.cbd_percent}%` : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Concours :</span>{" "}
                    <span className="font-medium">{selectedEntry.contest_name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Producteur :</span>{" "}
                    <span className="font-medium">{selectedEntry.producer_name}</span>
                  </div>
                </div>
                {selectedEntry.coa_url && (
                  <div className="pt-2">
                    <COAViewer
                      entryId={selectedEntry.id}
                      coaUrl={selectedEntry.coa_url}
                      variant="button"
                    />
                  </div>
                )}
              </div>

              {/* Checklist de validation */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Checklist de validation</Label>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 rounded-lg border">
                    <Checkbox
                      id="format-valid"
                      checked={validationForm.formatValid}
                      onCheckedChange={(checked) =>
                        setValidationForm({ ...validationForm, formatValid: checked as boolean })
                      }
                    />
                    <div className="flex-1">
                      <Label htmlFor="format-valid" className="font-medium cursor-pointer">
                        Format valide
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Le COA est au format PDF ou image lisible (taille max 10MB)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 rounded-lg border">
                    <Checkbox
                      id="data-readable"
                      checked={validationForm.dataReadable}
                      onCheckedChange={(checked) =>
                        setValidationForm({ ...validationForm, dataReadable: checked as boolean })
                      }
                    />
                    <div className="flex-1">
                      <Label htmlFor="data-readable" className="font-medium cursor-pointer">
                        Données lisibles
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Les champs obligatoires sont présents et lisibles : THC, CBD, laboratoire, date d'analyse
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 rounded-lg border">
                    <Checkbox
                      id="thc-compliant"
                      checked={validationForm.thcCompliant}
                      onCheckedChange={(checked) =>
                        setValidationForm({ ...validationForm, thcCompliant: checked as boolean })
                      }
                    />
                    <div className="flex-1">
                      <Label htmlFor="thc-compliant" className="font-medium cursor-pointer">
                        THC conforme
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Le pourcentage de THC est conforme à la limite du concours ({selectedEntry.contest_thc_limit || 0.3}%)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 rounded-lg border">
                    <Checkbox
                      id="lab-recognized"
                      checked={validationForm.labRecognized}
                      onCheckedChange={(checked) =>
                        setValidationForm({ ...validationForm, labRecognized: checked as boolean })
                      }
                    />
                    <div className="flex-1">
                      <Label htmlFor="lab-recognized" className="font-medium cursor-pointer">
                        Laboratoire reconnu
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Le laboratoire d'analyse est reconnu et accrédité (selon vos critères)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes de validation */}
              <div className="space-y-2">
                <Label htmlFor="validation-notes">Notes de validation (optionnel)</Label>
                <Textarea
                  id="validation-notes"
                  placeholder="Ajoutez des notes ou des commentaires sur la validation..."
                  value={validationForm.notes}
                  onChange={(e) => setValidationForm({ ...validationForm, notes: e.target.value })}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Ces notes seront visibles par le producteur si le COA est rejeté.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsValidationDialogOpen(false)}
              disabled={validateCOAMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleValidate(false)}
              disabled={validateCOAMutation.isPending}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Rejeter
            </Button>
            <Button
              variant="default"
              onClick={() => handleValidate(true)}
              disabled={validateCOAMutation.isPending || !validationForm.formatValid || !validationForm.dataReadable || !validationForm.thcCompliant || !validationForm.labRecognized}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Approuver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const ReviewEntriesPage = () => (
  <ProtectedRoute requiredRole="organizer">
    <ReviewEntries />
  </ProtectedRoute>
);

export default ReviewEntriesPage;

