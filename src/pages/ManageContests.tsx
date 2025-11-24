import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Plus, Edit, Trash2, Calendar, MapPin, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useConfirm } from "@/hooks/use-confirm";
import { usePagination } from "@/hooks/use-pagination";
import { PaginationControls } from "@/components/PaginationControls";

const contestSchema = z.object({
  slug: z.string().min(2, "Le slug doit contenir au moins 2 caractères").regex(/^[a-z0-9-]+$/, "Le slug ne peut contenir que des lettres minuscules, chiffres et tirets"),
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  description: z.string().optional(),
  status: z.enum(["draft", "registration", "judging", "completed", "archived"]),
  location: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  registration_close_date: z.string().optional(),
  prize_pool: z.coerce.number().min(0).optional().or(z.literal("")),
  rules_url: z.string().url("URL invalide").optional().or(z.literal("")),
});

type ContestFormValues = z.infer<typeof contestSchema>;

const ManageContests = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [editingContestId, setEditingContestId] = useState<string | null>(null);

  // Récupérer tous les concours
  const { data: contests, isLoading, error } = useQuery({
    queryKey: ["contests", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Charger le concours à éditer
  const { data: editingContest } = useQuery({
    queryKey: ["contest", editingContestId],
    queryFn: async () => {
      if (!editingContestId) return null;
      const { data, error } = await supabase
        .from("contests")
        .select("*")
        .eq("id", editingContestId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!editingContestId,
  });

  const form = useForm<ContestFormValues>({
    resolver: zodResolver(contestSchema),
    defaultValues: {
      slug: "",
      name: "",
      description: "",
      status: "draft",
      location: "",
      start_date: "",
      end_date: "",
      registration_close_date: "",
      prize_pool: undefined,
      rules_url: "",
    },
  });

  // Charger les données du concours à éditer
  useEffect(() => {
    if (editingContest) {
      form.reset({
        slug: editingContest.slug,
        name: editingContest.name,
        description: editingContest.description || "",
        status: editingContest.status,
        location: editingContest.location || "",
        start_date: editingContest.start_date ? new Date(editingContest.start_date).toISOString().slice(0, 16) : "",
        end_date: editingContest.end_date ? new Date(editingContest.end_date).toISOString().slice(0, 16) : "",
        registration_close_date: editingContest.registration_close_date ? new Date(editingContest.registration_close_date).toISOString().slice(0, 16) : "",
        prize_pool: editingContest.prize_pool ?? undefined,
        rules_url: editingContest.rules_url || "",
      });
    }
  }, [editingContest, form]);

  const { confirm: confirmDelete, ConfirmationDialog: DeleteDialog } = useConfirm({
    title: "Supprimer le concours",
    message: "Êtes-vous sûr de vouloir supprimer ce concours ? Cette action est irréversible et supprimera toutes les entrées associées.",
  });

  const createContestMutation = useMutation({
    mutationFn: async (data: ContestFormValues) => {
      if (!user?.id) throw new Error("Utilisateur non authentifié");

      const contestData = {
        slug: data.slug,
        name: data.name,
        description: data.description || null,
        status: data.status,
        location: data.location || null,
        start_date: data.start_date ? new Date(data.start_date).toISOString() : null,
        end_date: data.end_date ? new Date(data.end_date).toISOString() : null,
        registration_close_date: data.registration_close_date ? new Date(data.registration_close_date).toISOString() : null,
        prize_pool: data.prize_pool || null,
        rules_url: data.rules_url || null,
        created_by: user.id,
      };

      if (editingContestId) {
        const { data: contest, error } = await supabase
          .from("contests")
          .update(contestData)
          .eq("id", editingContestId)
          .select()
          .single();

        if (error) throw error;
        return contest;
      } else {
        const { data: contest, error } = await supabase
          .from("contests")
          .insert(contestData)
          .select()
          .single();

        if (error) throw error;
        return contest;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contests"] });
      toast.success(editingContestId ? "Concours mis à jour avec succès !" : "Concours créé avec succès !");
      form.reset();
      setEditingContestId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la sauvegarde du concours");
    },
  });

  const deleteContestMutation = useMutation({
    mutationFn: async (contestId: string) => {
      const { error } = await supabase
        .from("contests")
        .delete()
        .eq("id", contestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contests"] });
      toast.success("Concours supprimé avec succès");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la suppression");
    },
  });

  const onSubmit = (data: ContestFormValues) => {
    createContestMutation.mutate(data);
  };

  const handleEdit = (contestId: string) => {
    setEditingContestId(contestId);
  };

  const handleDelete = async (contestId: string) => {
    const confirmed = await confirmDelete();
    if (confirmed) {
      deleteContestMutation.mutate(contestId);
    }
  };

  const handleCancel = () => {
    form.reset();
    setEditingContestId(null);
  };

  if (!user || !profile || profile.role !== "organizer") {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="pt-28 pb-16">
          <div className="container mx-auto px-4">
            <ErrorState message="Seuls les organisateurs peuvent gérer les concours" />
          </div>
        </div>
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    draft: "Brouillon",
    registration: "Inscriptions ouvertes",
    judging: "En cours d'évaluation",
    completed: "Terminé",
    archived: "Archivé",
  };

  const statusColors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    registration: "bg-accent/10 text-accent",
    judging: "bg-secondary/20 text-secondary-foreground",
    completed: "bg-primary/10 text-primary",
    archived: "bg-muted text-muted-foreground",
  };

  const {
    paginatedData: paginatedContests,
    currentPage,
    totalPages,
    goToPage,
  } = usePagination({
    data: contests ?? [],
    itemsPerPage: 10,
  });

  return (
    <div className="min-h-screen">
      <Header />
      <div className="pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Formulaire */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">
                  {editingContestId ? "Modifier le concours" : "Créer un nouveau concours"}
                </CardTitle>
                <CardDescription>
                  {editingContestId
                    ? "Modifiez les informations du concours"
                    : "Remplissez le formulaire pour créer un nouveau concours"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slug *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="paris-2025"
                              {...field}
                              disabled={!!editingContestId}
                            />
                          </FormControl>
                          <FormDescription>
                            Identifiant unique pour l'URL (ex: paris-2025)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom *</FormLabel>
                          <FormControl>
                            <Input placeholder="CBD Flower Cup Paris 2025" {...field} />
                          </FormControl>
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
                              placeholder="Description du concours..."
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Statut *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="draft">Brouillon</SelectItem>
                              <SelectItem value="registration">Inscriptions ouvertes</SelectItem>
                              <SelectItem value="judging">En cours d'évaluation</SelectItem>
                              <SelectItem value="completed">Terminé</SelectItem>
                              <SelectItem value="archived">Archivé</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lieu</FormLabel>
                          <FormControl>
                            <Input placeholder="Paris, France" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="start_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date de début</FormLabel>
                            <FormControl>
                              <Input type="datetime-local" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="end_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date de fin</FormLabel>
                            <FormControl>
                              <Input type="datetime-local" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="registration_close_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date limite d'inscription</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="prize_pool"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dotation (€)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="15000"
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="rules_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL du règlement</FormLabel>
                            <FormControl>
                              <Input
                                type="url"
                                placeholder="https://example.com/rules"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex gap-2">
                      {editingContestId && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancel}
                        >
                          Annuler
                        </Button>
                      )}
                      <Button
                        type="submit"
                        disabled={createContestMutation.isPending}
                        className="flex-1"
                      >
                        {createContestMutation.isPending
                          ? editingContestId
                            ? "Mise à jour..."
                            : "Création..."
                          : editingContestId
                            ? "Mettre à jour"
                            : "Créer le concours"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Liste des concours */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Concours existants</CardTitle>
                  <CardDescription>
                    Gérez tous les concours de la plateforme
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DeleteDialog />
                  {isLoading && <LoadingState message="Chargement des concours…" />}
                  {error && <ErrorState message="Impossible de charger les concours" />}

                  {!isLoading && !error && (
                    <>
                      {paginatedContests.length ? (
                        <div className="space-y-3">
                          {paginatedContests.map((contest) => (
                            <Card key={contest.id} className="border-border/60">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h3 className="font-semibold text-foreground">{contest.name}</h3>
                                      <Badge className={statusColors[contest.status]}>
                                        {statusLabels[contest.status]}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                      {contest.description || "Aucune description"}
                                    </p>
                                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                      {contest.location && (
                                        <div className="flex items-center gap-1">
                                          <MapPin className="h-3 w-3" />
                                          {contest.location}
                                        </div>
                                      )}
                                      {contest.start_date && (
                                        <div className="flex items-center gap-1">
                                          <Calendar className="h-3 w-3" />
                                          {new Date(contest.start_date).toLocaleDateString("fr-FR")}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      asChild
                                    >
                                      <Link to={`/manage-contests/${contest.id}/judges`}>
                                        <Users className="h-4 w-4 mr-1" />
                                        Juges
                                      </Link>
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEdit(contest.id)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleDelete(contest.id)}
                                      disabled={deleteContestMutation.isPending}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          Aucun concours créé pour le moment
                        </div>
                      )}

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
        </div>
      </div>
    </div>
  );
};

// Wrapper avec ProtectedRoute
const ManageContestsPage = () => (
  <ProtectedRoute requiredRole="organizer">
    <ManageContests />
  </ProtectedRoute>
);

export default ManageContestsPage;

