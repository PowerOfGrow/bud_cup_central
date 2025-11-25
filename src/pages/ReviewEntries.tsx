import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, XCircle, FileText, Eye, AlertCircle, Shield, Trash2, Mail, Image as ImageIcon, Download } from "lucide-react";
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
import { deleteCOAFile, extractFilePathFromUrl, getCOASignedUrl } from "@/services/storage";
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  
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

  // Mutation pour supprimer le COA
  const deleteCOAMutation = useMutation({
    mutationFn: async ({ entryId, coaUrl, reason }: { entryId: string; coaUrl: string; reason?: string }) => {
      // D'abord, appeler la fonction SQL pour mettre à jour l'entrée
      const { error: rpcError } = await supabase.rpc("delete_entry_coa", {
        p_entry_id: entryId,
        p_reason: reason || null,
      });

      if (rpcError) {
        console.error("Error in delete_entry_coa RPC:", rpcError);
        throw new Error(rpcError.message || "Erreur lors de la suppression dans la base de données");
      }

      // Ensuite, supprimer le fichier du storage (on continue même si ça échoue)
      try {
        const deleted = await deleteCOAFile(coaUrl);
        if (!deleted) {
          console.warn("Impossible de supprimer le fichier du storage, mais l'entrée a été mise à jour");
          // On ne throw pas d'erreur car la base de données a été mise à jour
        }
      } catch (storageError) {
        console.error("Error deleting COA file from storage:", storageError);
        // On ne throw pas d'erreur car la base de données a été mise à jour
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-coa-validation"] });
      setIsDeleteDialogOpen(false);
      setSelectedEntry(null);
      toast.success("COA supprimé avec succès. L'entrée est revenue en brouillon.");
    },
    onError: (error: any) => {
      console.error("Error deleting COA:", error);
      toast.error(error.message || "Erreur lors de la suppression du COA");
    },
  });

  // Fonction pour ouvrir le dialog de suppression
  const handleDeleteCOA = (entry: PendingEntry) => {
    if (!entry.coa_url) {
      toast.error("Aucun COA à supprimer");
      return;
    }
    setSelectedEntry(entry);
    setIsDeleteDialogOpen(true);
  };

  // Fonction pour confirmer la suppression
  const confirmDeleteCOA = () => {
    if (!selectedEntry || !selectedEntry.coa_url) return;
    
    deleteCOAMutation.mutate({
      entryId: selectedEntry.id,
      coaUrl: selectedEntry.coa_url,
      reason: "COA supprimé par l'organisateur",
    });
  };

  // Fonction pour télécharger directement le COA
  const handleDownloadCOA = async (entry: PendingEntry) => {
    if (!entry.coa_url) {
      toast.error("Aucun COA à télécharger");
      return;
    }

    try {
      const filePath = extractFilePathFromUrl(entry.coa_url);
      if (!filePath) {
        toast.error("Impossible d'extraire le chemin du fichier");
        return;
      }

      const signedUrl = await getCOASignedUrl(entry.id, filePath, 3600);
      if (!signedUrl) {
        toast.error("Impossible de générer l'URL de téléchargement");
        return;
      }

      // Télécharger le fichier
      const response = await fetch(signedUrl, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      // Récupérer le type MIME
      const contentType = response.headers.get('Content-Type') || 
        (entry.coa_url.toLowerCase().includes('.pdf') ? 'application/pdf' :
         entry.coa_url.toLowerCase().includes('.jpg') || entry.coa_url.toLowerCase().includes('.jpeg') ? 'image/jpeg' :
         entry.coa_url.toLowerCase().includes('.png') ? 'image/png' :
         entry.coa_url.toLowerCase().includes('.webp') ? 'image/webp' :
         'application/octet-stream');

      const blob = await response.blob();
      const typedBlob = new Blob([blob], { type: contentType });
      
      const url = window.URL.createObjectURL(typedBlob);
      const a = document.createElement("a");
      a.href = url;
      
      // Générer un nom de fichier informatif
      const extension = entry.coa_url.match(/\.([a-z0-9]+)(?:\?|$)/i)?.[1] || 'pdf';
      const sanitizedName = entry.strain_name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      const timestamp = new Date().toISOString().split("T")[0];
      a.download = `COA_${sanitizedName}_${timestamp}.${extension}`;
      a.type = contentType;
      
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
      toast.success("COA téléchargé avec succès");
    } catch (error: any) {
      console.error("Error downloading COA:", error);
      toast.error(error.message || "Erreur lors du téléchargement du COA");
    }
  };

  // Fonction pour ouvrir le dialog d'email
  const handleSendEmail = (entry: PendingEntry) => {
    setSelectedEntry(entry);
    // Message par défaut favorisant les images
    setEmailMessage(`Bonjour ${entry.producer_name},

Votre Certificat d'Analyse (COA) pour l'entrée "${entry.strain_name}" nécessite une correction.

🔍 **Problème identifié :**
Le document actuel ne peut pas être validé. Nous vous demandons de le remplacer.

📸 **Recommandation importante :**
Nous favorisons l'envoi d'une **image** (JPG, PNG, WEBP) plutôt qu'un PDF pour faciliter la validation. Une photo claire de votre COA est préférable.

✅ **Ce que votre COA doit contenir :**
- Taux THC (section "Cannabinoids" ou "THC Total")
- Taux CBD (section "Cannabinoids" ou "CBD")
- Profil terpénique (section "Terpenes" ou "Terpènes")
- Nom du laboratoire et date d'analyse

📝 **Prochaines étapes :**
1. Connectez-vous à votre compte producteur
2. Allez dans "Mes entrées" → Modifier l'entrée "${entry.strain_name}"
3. Uploadez une nouvelle image de votre COA (JPG, PNG ou WEBP de préférence)
4. Vérifiez que toutes les informations sont correctement saisies
5. Soumettez à nouveau votre entrée

Si vous avez des questions, n'hésitez pas à nous contacter.

Cordialement,
L'équipe CBD Flower Cup`);
    setIsEmailDialogOpen(true);
  };

  // Fonction pour envoyer l'email
  const sendEmailToProducer = async () => {
    if (!selectedEntry || !emailMessage.trim()) {
      toast.error("Veuillez saisir un message");
      return;
    }

    setSendingEmail(true);
    try {
      // Récupérer l'email du producteur via la fonction RPC
      const { data: producerEmail, error: emailError } = await supabase.rpc("get_user_email", {
        p_user_id: selectedEntry.producer_id,
      });

      if (emailError || !producerEmail) {
        throw new Error("Email du producteur non trouvé");
      }

      // Récupérer les infos de l'entrée pour le template email
      const subject = `Action requise : Correction du COA pour "${selectedEntry.strain_name}"`;
      
      // Template HTML de l'email
      const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .highlight { background-color: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
    .steps { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .step { margin: 10px 0; padding-left: 25px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    .button { display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌿 CBD Flower Cup</h1>
    </div>
    <div class="content">
      <p>Bonjour <strong>${selectedEntry.producer_name}</strong>,</p>
      
      <p>Votre Certificat d'Analyse (COA) pour l'entrée <strong>"${selectedEntry.strain_name}"</strong> du concours <strong>"${selectedEntry.contest_name}"</strong> nécessite une correction.</p>
      
      <div class="highlight">
        <strong>📸 Recommandation importante :</strong><br>
        Nous favorisons l'envoi d'une <strong>image</strong> (JPG, PNG, WEBP) plutôt qu'un PDF pour faciliter la validation. Une photo claire de votre COA est préférable.
      </div>
      
      <h3>✅ Ce que votre COA doit contenir :</h3>
      <ul>
        <li>Taux THC (section "Cannabinoids" ou "THC Total")</li>
        <li>Taux CBD (section "Cannabinoids" ou "CBD")</li>
        <li>Profil terpénique (section "Terpenes" ou "Terpènes")</li>
        <li>Nom du laboratoire et date d'analyse</li>
      </ul>
      
      <div class="steps">
        <h3>📝 Prochaines étapes :</h3>
        <div class="step">1. Connectez-vous à votre compte producteur</div>
        <div class="step">2. Allez dans "Mes entrées" → Modifier l'entrée "${selectedEntry.strain_name}"</div>
        <div class="step">3. Uploadez une nouvelle <strong>image</strong> de votre COA (JPG, PNG ou WEBP de préférence)</div>
        <div class="step">4. Vérifiez que toutes les informations sont correctement saisies</div>
        <div class="step">5. Soumettez à nouveau votre entrée</div>
      </div>
      
      ${emailMessage.includes('Problème identifié') ? `
      <div class="highlight">
        <strong>🔍 Problème identifié :</strong><br>
        ${emailMessage.split('Problème identifié :')[1]?.split('**Recommandation**')[0] || 'Le document actuel ne peut pas être validé.'}
      </div>
      ` : ''}
      
      <div style="white-space: pre-line; margin: 20px 0;">${emailMessage.replace(/\n/g, '<br>')}</div>
      
      <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
      
      <p>Cordialement,<br>L'équipe CBD Flower Cup</p>
    </div>
    <div class="footer">
      <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre directement.</p>
    </div>
  </div>
</body>
</html>`;

      // Appeler la fonction SQL pour créer la notification
      await supabase.rpc("send_coa_rejection_email", {
        p_entry_id: selectedEntry.id,
        p_subject: subject,
        p_message: emailMessage,
      });

      // Envoyer l'email via l'Edge Function
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { error: emailSendError } = await supabase.functions.invoke("send-email", {
        body: {
          to: producerEmail,
          subject: subject,
          html: htmlTemplate,
          type: "coa_rejected",
          userId: selectedEntry.producer_id,
        },
      });

      if (emailSendError) {
        // Même si l'email échoue, la notification a été créée
        console.error("Error sending email:", emailSendError);
        toast.success("Notification créée pour le producteur. L'envoi d'email a échoué, mais le message est disponible dans les notifications.");
      } else {
        toast.success("Email envoyé avec succès au producteur");
      }

      setIsEmailDialogOpen(false);
      setEmailMessage("");
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast.error(error.message || "Erreur lors de l'envoi de l'email");
    } finally {
      setSendingEmail(false);
    }
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
                          <div className="flex gap-2 flex-wrap">
                            {entry.coa_url && (
                              <>
                                <COAViewer
                                  entryId={entry.id}
                                  coaUrl={entry.coa_url}
                                  variant="button"
                                  entryName={entry.strain_name}
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadCOA(entry)}
                                  title="Télécharger le COA"
                                >
                                  <Download className="mr-2 h-4 w-4" />
                                  Télécharger COA
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteCOA(entry)}
                                  title="Supprimer le COA et notifier le producteur"
                                  disabled={deleteCOAMutation.isPending}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {deleteCOAMutation.isPending ? "Suppression..." : "Supprimer COA"}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSendEmail(entry)}
                                  title="Envoyer un email au producteur"
                                >
                                  <Mail className="mr-2 h-4 w-4" />
                                  Envoyer Email
                                </Button>
                              </>
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

      {/* Dialog de confirmation de suppression COA */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le COA ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de supprimer le Certificat d'Analyse pour l'entrée <strong>{selectedEntry?.strain_name}</strong>.
              <br /><br />
              Cette action va :
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Supprimer le fichier COA du storage</li>
                <li>Remettre l'entrée en statut "brouillon"</li>
                <li>Réinitialiser la validation COA</li>
                <li>Permettre au producteur de soumettre un nouveau COA</li>
              </ul>
              <br />
              <strong className="text-destructive">Cette action est irréversible.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteCOAMutation.isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCOA}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteCOAMutation.isPending}
            >
              {deleteCOAMutation.isPending ? "Suppression..." : "Supprimer le COA"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog pour envoyer un email au producteur */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Envoyer un email au producteur</DialogTitle>
            <DialogDescription>
              Envoyez un email à <strong>{selectedEntry?.producer_name}</strong> concernant son COA pour l'entrée <strong>"{selectedEntry?.strain_name}"</strong>.
              <br />
              Le message inclut automatiquement des instructions favorisant l'upload d'images.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ImageIcon className="h-4 w-4 text-primary" />
                <span>Recommandation automatique incluse</span>
              </div>
              <p className="text-sm text-muted-foreground">
                L'email contient automatiquement une section recommandant l'upload d'une <strong>image</strong> (JPG, PNG, WEBP) plutôt qu'un PDF pour faciliter la validation.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-message">Message personnalisé</Label>
              <Textarea
                id="email-message"
                placeholder="Ajoutez votre message personnalisé ici..."
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Le message par défaut inclut déjà les instructions de base. Vous pouvez le personnaliser selon vos besoins.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEmailDialogOpen(false);
                setEmailMessage("");
              }}
              disabled={sendingEmail}
            >
              Annuler
            </Button>
            <Button
              variant="default"
              onClick={sendEmailToProducer}
              disabled={sendingEmail || !emailMessage.trim()}
            >
              {sendingEmail ? (
                <>
                  <Mail className="mr-2 h-4 w-4 animate-pulse" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Envoyer l'email
                </>
              )}
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

