/**
 * Page pour gérer les catégories custom d'un concours
 * Permet aux organisateurs de créer, modifier et supprimer des catégories spécifiques à leur concours
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Plus, Edit, Trash2, GripVertical } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useConfirm } from "@/hooks/use-confirm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

const categorySchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  slug: z.string().min(2, "Le slug doit contenir au moins 2 caractères").regex(/^[a-z0-9-]+$/, "Le slug ne peut contenir que des lettres minuscules, chiffres et tirets"),
  description: z.string().optional(),
  weight: z.coerce.number().min(0.01).max(1.0).default(1.0),
  max_entries_per_producer: z.coerce.number().int().min(1).optional().or(z.literal("")),
  display_order: z.coerce.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

const ManageContestCategories = () => {
  const { contestId } = useParams<{ contestId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const confirmDelete = useConfirm();

  // Récupérer le concours
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

  // Récupérer les catégories du concours
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["contest-categories", contestId],
    queryFn: async () => {
      if (!contestId) return [];
      const { data, error } = await supabase
        .from("contest_categories")
        .select("*")
        .eq("contest_id", contestId)
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!contestId,
  });

  // Charger la catégorie à éditer
  const { data: editingCategory } = useQuery({
    queryKey: ["contest-category", editingCategoryId],
    queryFn: async () => {
      if (!editingCategoryId) return null;
      const { data, error } = await supabase
        .from("contest_categories")
        .select("*")
        .eq("id", editingCategoryId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!editingCategoryId,
  });

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      weight: 1.0,
      max_entries_per_producer: undefined,
      display_order: 0,
      is_active: true,
    },
  });

  // Charger les données de la catégorie à éditer
  useEffect(() => {
    if (editingCategory) {
      form.reset({
        name: editingCategory.name,
        slug: editingCategory.slug,
        description: editingCategory.description || "",
        weight: editingCategory.weight || 1.0,
        max_entries_per_producer: editingCategory.max_entries_per_producer || undefined,
        display_order: editingCategory.display_order || 0,
        is_active: editingCategory.is_active ?? true,
      });
      setIsDialogOpen(true);
    } else if (editingCategoryId === null) {
      form.reset({
        name: "",
        slug: "",
        description: "",
        weight: 1.0,
        max_entries_per_producer: undefined,
        display_order: categories?.length || 0,
        is_active: true,
      });
    }
  }, [editingCategory, editingCategoryId, categories, form]);

  // Générer le slug automatiquement à partir du nom
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Mutation pour créer une catégorie
  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormValues) => {
      if (!contestId) throw new Error("Contest ID manquant");
      const { error } = await supabase
        .from("contest_categories")
        .insert({
          contest_id: contestId,
          ...data,
          max_entries_per_producer: data.max_entries_per_producer || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contest-categories", contestId] });
      toast.success("Catégorie créée avec succès");
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la création de la catégorie");
    },
  });

  // Mutation pour mettre à jour une catégorie
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CategoryFormValues }) => {
      const { error } = await supabase
        .from("contest_categories")
        .update({
          ...data,
          max_entries_per_producer: data.max_entries_per_producer || null,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contest-categories", contestId] });
      toast.success("Catégorie mise à jour avec succès");
      setIsDialogOpen(false);
      setEditingCategoryId(null);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la mise à jour de la catégorie");
    },
  });

  // Mutation pour supprimer une catégorie
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await supabase
        .from("contest_categories")
        .delete()
        .eq("id", categoryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contest-categories", contestId] });
      toast.success("Catégorie supprimée avec succès");
      setDeleteCategoryId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la suppression de la catégorie");
    },
  });

  const onSubmit = (data: CategoryFormValues) => {
    if (editingCategoryId) {
      updateCategoryMutation.mutate({ id: editingCategoryId, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  const handleEdit = (categoryId: string) => {
    setEditingCategoryId(categoryId);
    setIsDialogOpen(true);
  };

  const handleDelete = async (categoryId: string) => {
    setDeleteCategoryId(categoryId);
  };

  const handleConfirmDelete = () => {
    if (deleteCategoryId) {
      deleteCategoryMutation.mutate(deleteCategoryId);
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setEditingCategoryId(null);
    form.reset();
  };

  const handleNewCategory = () => {
    setEditingCategoryId(null);
    form.reset({
      name: "",
      slug: "",
      description: "",
      weight: 1.0,
      max_entries_per_producer: undefined,
      display_order: categories?.length || 0,
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  // Générer le slug quand le nom change
  const handleNameChange = (value: string) => {
    form.setValue("name", value);
    if (!editingCategoryId) {
      // Générer le slug seulement lors de la création
      form.setValue("slug", generateSlug(value));
    }
  };

  if (contestLoading || categoriesLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="pt-28 pb-16">
          <div className="container mx-auto px-4">
            <LoadingState message="Chargement des catégories..." />
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
            <ErrorState message="Concours non trouvé" />
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
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
            <Button onClick={handleNewCategory}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle catégorie
            </Button>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-2xl">Catégories du concours</CardTitle>
              <CardDescription>
                {contest.name} - Gérez les catégories personnalisées pour ce concours
              </CardDescription>
            </CardHeader>
            <CardContent>
              {categories && categories.length > 0 ? (
                <div className="space-y-4">
                  {categories.map((category) => (
                    <Card key={category.id} className="border-border/60">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                              <h3 className="font-semibold text-lg">{category.name}</h3>
                              <Badge variant={category.is_active ? "default" : "secondary"}>
                                {category.is_active ? "Active" : "Inactive"}
                              </Badge>
                              {category.weight !== 1.0 && (
                                <Badge variant="outline">
                                  Poids: {category.weight}
                                </Badge>
                              )}
                            </div>
                            {category.description && (
                              <p className="text-sm text-muted-foreground">
                                {category.description}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <span>Slug: <code className="bg-muted px-1 rounded">{category.slug}</code></span>
                              {category.max_entries_per_producer && (
                                <span>Max par producteur: {category.max_entries_per_producer}</span>
                              )}
                              <span>Ordre: {category.display_order}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(category.id)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Modifier
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(category.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Aucune catégorie personnalisée pour ce concours.</p>
                  <p className="text-sm mt-2">
                    Les producteurs utiliseront les catégories globales (Indica, Sativa, Hybrid, etc.)
                  </p>
                  <Button onClick={handleNewCategory} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Créer la première catégorie
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dialog pour créer/modifier une catégorie */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCategoryId ? "Modifier la catégorie" : "Nouvelle catégorie"}
                </DialogTitle>
                <DialogDescription>
                  {editingCategoryId
                    ? "Modifiez les informations de la catégorie"
                    : "Remplissez le formulaire pour créer une nouvelle catégorie"}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Indoor Premium"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              handleNameChange(e.target.value);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Nom de la catégorie visible par les producteurs
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="indoor-premium"
                            {...field}
                            disabled={!!editingCategoryId}
                          />
                        </FormControl>
                        <FormDescription>
                          Identifiant unique (généré automatiquement à partir du nom)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Description de la catégorie..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Description visible par les producteurs lors de la soumission
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pondération</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0.01"
                              max="1.0"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Poids pour classements (0.01 - 1.0)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="max_entries_per_producer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max par producteur</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="Illimité"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Limite d'entrées (optionnel)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="display_order"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ordre d'affichage</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Ordre dans le formulaire
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Catégorie active</FormLabel>
                          <FormDescription>
                            Les catégories inactives ne sont pas visibles par les producteurs
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={handleCancel}>
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                    >
                      {createCategoryMutation.isPending || updateCategoryMutation.isPending
                        ? "Enregistrement..."
                        : editingCategoryId
                          ? "Mettre à jour"
                          : "Créer"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Dialog de confirmation de suppression */}
          <AlertDialog open={!!deleteCategoryId} onOpenChange={(open) => !open && setDeleteCategoryId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir supprimer cette catégorie ? Cette action est irréversible.
                  Les entrées existantes utilisant cette catégorie ne seront pas affectées, mais les producteurs
                  ne pourront plus la sélectionner pour de nouvelles entrées.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};

export default ProtectedRoute(ManageContestCategories, ["organizer"]);

