import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  useAllGuides,
  useCreateGuide,
  useUpdateGuide,
  useDeleteGuide,
  getCategoryLabel,
  type Guide,
} from "@/hooks/use-guides";
import { FileText, Upload, Trash2, Download, Edit, Check, X, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { getGuideDownloadUrl } from "@/hooks/use-guides";

const ManageGuides = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: guides, isLoading, error } = useAllGuides();
  const createGuide = useCreateGuide();
  const updateGuide = useUpdateGuide();
  const deleteGuide = useDeleteGuide();

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [editingGuide, setEditingGuide] = useState<Guide | null>(null);
  const [deletingGuide, setDeletingGuide] = useState<Guide | null>(null);
  const [uploading, setUploading] = useState(false);

  // Formulaire d'upload
  const [formData, setFormData] = useState({
    category: "" as Guide["category"] | "",
    title: "",
    description: "",
    file: null as File | null,
  });

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Seuls les fichiers PDF sont acceptés");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Le fichier ne doit pas dépasser 10 MB");
        return;
      }
      setFormData({ ...formData, file, title: formData.title || file.name.replace(".pdf", "") });
    }
  };

  const handleUpload = async () => {
    if (!formData.category || !formData.title || !formData.file) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setUploading(true);
    try {
      // Générer un nom de fichier unique
      const timestamp = Date.now();
      const sanitizedTitle = formData.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      const fileExtension = formData.file.name.split(".").pop();
      const fileName = `${formData.category}/${timestamp}-${sanitizedTitle}.${fileExtension}`;

      // Uploader le fichier dans Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("guides")
        .upload(fileName, formData.file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Créer l'entrée dans la base de données
      await createGuide.mutateAsync({
        category: formData.category,
        title: formData.title,
        description: formData.description || undefined,
        file_path: fileName,
        file_name: formData.file.name,
        file_size: formData.file.size,
        mime_type: formData.file.type,
      });

      toast.success("Guide uploadé avec succès");
      setIsUploadDialogOpen(false);
      setFormData({
        category: "",
        title: "",
        description: "",
        file: null,
      });
    } catch (error: any) {
      console.error("Erreur lors de l'upload:", error);
      toast.error(error.message || "Erreur lors de l'upload du guide");
    } finally {
      setUploading(false);
    }
  };

  const handleToggleActive = async (guide: Guide) => {
    try {
      await updateGuide.mutateAsync({
        id: guide.id,
        is_active: !guide.is_active,
      });
      toast.success(
        guide.is_active ? "Guide désactivé" : "Guide activé (l'ancien guide de cette catégorie sera désactivé)"
      );
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour");
    }
  };

  const handleDelete = async () => {
    if (!deletingGuide) return;

    try {
      await deleteGuide.mutateAsync(deletingGuide.id);
      toast.success("Guide supprimé avec succès");
      setDeletingGuide(null);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression");
    }
  };

  const handleDownload = async (guide: Guide) => {
    try {
      const url = await getGuideDownloadUrl(guide);
      if (!url) {
        toast.error("Impossible de générer l'URL de téléchargement");
        return;
      }

      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = guide.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      toast.success("Guide téléchargé");
    } catch (error: any) {
      toast.error("Erreur lors du téléchargement");
    }
  };

  // Grouper les guides par catégorie
  const guidesByCategory = guides?.reduce(
    (acc, guide) => {
      if (!acc[guide.category]) {
        acc[guide.category] = [];
      }
      acc[guide.category].push(guide);
      return acc;
    },
    {} as Record<Guide["category"], Guide[]>
  ) || {};

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="pt-28 pb-16">
          <div className="container mx-auto px-4">
            <LoadingState message="Chargement des guides..." />
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
            <ErrorState message="Erreur lors du chargement des guides" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2">Gestion des Guides</h1>
                <p className="text-muted-foreground">
                  Uploader et gérer les guides PDF par catégorie (Producteur, Juge, Utilisateur, Organisateur)
                </p>
              </div>
              <Button onClick={() => setIsUploadDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Uploader un guide
              </Button>
            </div>
          </div>

          {/* Liste des guides par catégorie */}
          <div className="space-y-6">
            {(["producer", "judge", "viewer", "organizer"] as Guide["category"][]).map((category) => {
              const categoryGuides = guidesByCategory[category] || [];
              const activeGuide = categoryGuides.find((g) => g.is_active);

              return (
                <Card key={category} className="border-border/70">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {getCategoryLabel(category)}
                    </CardTitle>
                    <CardDescription>
                      {activeGuide
                        ? `Guide actif : ${activeGuide.title}`
                        : "Aucun guide actif pour cette catégorie"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {categoryGuides.length > 0 ? (
                      <div className="space-y-3">
                        {categoryGuides.map((guide) => (
                          <div
                            key={guide.id}
                            className={`flex items-center justify-between p-4 rounded-lg border ${
                              guide.is_active
                                ? "bg-accent/10 border-accent"
                                : "bg-muted/40 border-border"
                            }`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-foreground">{guide.title}</span>
                                {guide.is_active && (
                                  <Badge variant="default" className="bg-accent text-accent-foreground">
                                    Actif
                                  </Badge>
                                )}
                              </div>
                              {guide.description && (
                                <p className="text-sm text-muted-foreground mb-2">{guide.description}</p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>
                                  {guide.file_size
                                    ? `${(guide.file_size / 1024 / 1024).toFixed(2)} MB`
                                    : "Taille inconnue"}
                                </span>
                                <span>
                                  Uploadé{" "}
                                  {formatDistanceToNow(new Date(guide.created_at), {
                                    addSuffix: true,
                                    locale: fr,
                                  })}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownload(guide)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleActive(guide)}
                              >
                                {guide.is_active ? (
                                  <X className="h-4 w-4" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setDeletingGuide(guide)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        Aucun guide uploadé pour cette catégorie
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>

      {/* Dialog d'upload */}
      <AlertDialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Uploader un nouveau guide</AlertDialogTitle>
            <AlertDialogDescription>
              Sélectionnez la catégorie et le fichier PDF à uploader (max 10 MB)
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="category">Catégorie *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value as Guide["category"] })
                }
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="producer">Guide Producteur</SelectItem>
                  <SelectItem value="judge">Guide Juge</SelectItem>
                  <SelectItem value="viewer">Guide Utilisateur Gratuit</SelectItem>
                  <SelectItem value="organizer">Guide Organisateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Guide du producteur 2025"
              />
            </div>
            <div>
              <Label htmlFor="description">Description (optionnelle)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du guide..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="file">Fichier PDF *</Label>
              <Input
                id="file"
                type="file"
                accept="application/pdf"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
              {formData.file && (
                <p className="text-sm text-muted-foreground mt-2">
                  Fichier sélectionné : {formData.file.name} ({(formData.file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleUpload} disabled={uploading || !formData.file}>
              {uploading ? "Upload en cours..." : "Uploader"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={!!deletingGuide} onOpenChange={(open) => !open && setDeletingGuide(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le guide</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le guide "{deletingGuide?.title}" ? Cette action est
              irréversible et supprimera également le fichier PDF.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManageGuides;

