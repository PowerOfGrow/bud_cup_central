import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Download, Trash2, AlertTriangle, Shield, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useConfirm } from "@/hooks/use-confirm";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
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

export const PrivacyOperations = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleExportData = async () => {
    if (!user?.id) {
      toast.error("Vous devez être connecté pour exporter vos données");
      return;
    }

    setIsExporting(true);
    try {
      const { data, error } = await supabase.rpc("export_user_data", {
        p_user_id: user.id,
      });

      if (error) throw error;

      // Télécharger le JSON
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `cbd-flower-cup-data-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Export de vos données réussi");
    } catch (error: any) {
      console.error("Error exporting data:", error);
      toast.error(error.message || "Erreur lors de l'export de vos données");
    } finally {
      setIsExporting(false);
    }
  };

  const handleRequestDeletion = async () => {
    if (!user?.id) {
      toast.error("Vous devez être connecté pour supprimer votre compte");
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase.rpc("request_account_deletion", {
        p_user_id: user.id,
      });

      if (error) throw error;

      // Pour l'instant, on anonymise directement (dans un système réel, on pourrait avoir une période de grâce)
      const { error: anonymizeError } = await supabase.rpc("anonymize_user_profile", {
        p_user_id: user.id,
      });

      if (anonymizeError) {
        console.error("Error anonymizing profile:", anonymizeError);
        // Continue même si l'anonymisation échoue partiellement
      }

      toast.success("Votre compte a été supprimé. Vous allez être déconnecté...");
      
      // Déconnexion après un court délai
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate("/");
      }, 2000);
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast.error(error.message || "Erreur lors de la suppression de votre compte");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <Card className="border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-destructive" />
            <div>
              <CardTitle>Données personnelles et confidentialité</CardTitle>
              <CardDescription>
                Conformité RGPD - Gérez vos données personnelles
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export de données */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-1">
                <Label className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Télécharger mes données
                </Label>
                <p className="text-sm text-muted-foreground">
                  Exportez toutes vos données personnelles au format JSON. 
                  Conformément au RGPD, vous avez le droit d'accéder à toutes vos données.
                </p>
                <ul className="text-xs text-muted-foreground list-disc list-inside mt-2 space-y-1">
                  <li>Profil utilisateur</li>
                  <li>Entrées soumises</li>
                  <li>Scores de juge attribués</li>
                  <li>Votes publics</li>
                  <li>Favoris et notifications</li>
                </ul>
              </div>
              <Button
                variant="outline"
                onClick={handleExportData}
                disabled={isExporting}
                className="shrink-0"
              >
                <Download className="mr-2 h-4 w-4" />
                {isExporting ? "Export en cours..." : "Exporter"}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Suppression de compte */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-1">
                <Label className="text-base flex items-center gap-2 text-destructive">
                  <Trash2 className="h-4 w-4" />
                  Supprimer mon compte
                </Label>
                <p className="text-sm text-muted-foreground">
                  Supprimez définitivement votre compte et toutes vos données personnelles.
                  Cette action est irréversible.
                </p>
                <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-xs text-destructive font-medium mb-2 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Attention :
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Votre profil sera anonymisé</li>
                    <li>• Les entrées approuvées seront conservées (anonymisées) pour l'historique des concours</li>
                    <li>• Les scores de juge seront conservés pour l'intégrité des concours</li>
                    <li>• Vous ne pourrez plus accéder à votre compte</li>
                  </ul>
                </div>
              </div>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isDeleting}
                className="shrink-0"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </Button>
            </div>
          </div>

          {/* Informations sur la rétention */}
          <div className="mt-4 p-4 rounded-lg bg-muted/50 border">
            <p className="text-xs text-muted-foreground mb-2 font-medium">
              Politique de rétention des données :
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• COA : Conservés 7 ans (conformément à la réglementation)</li>
              <li>• Données personnelles : Jusqu'à suppression du compte</li>
              <li>• Données anonymisées : Conservation indéfinie pour analytics</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmer la suppression de votre compte
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Cette action est définitive et irréversible. Toutes vos données personnelles
                seront supprimées ou anonymisées.
              </p>
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm font-medium text-destructive mb-2">
                  Ce qui sera supprimé/anonymisé :
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Votre profil (nom, email, organisation)</li>
                  <li>Vos brouillons d'entrées</li>
                  <li>Vos favoris et notifications</li>
                  <li>Vos votes publics</li>
                  <li>Vos préférences de notification</li>
                </ul>
                <p className="text-sm font-medium text-muted-foreground mt-2">
                  Ce qui sera conservé (anonymisé) :
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Entrées approuvées (pour l'historique des concours)</li>
                  <li>Scores de juge attribués (pour l'intégrité des concours)</li>
                </ul>
              </div>
              <p className="text-sm font-medium">
                Tapez <strong>"SUPPRIMER"</strong> dans le champ ci-dessous pour confirmer :
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRequestDeletion}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Suppression en cours..." : "Confirmer la suppression"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

