import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Upload, X, CheckCircle2, AlertCircle, Info, FileText, HelpCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";
import { LoadingState } from "@/components/LoadingState";
import { COAViewer } from "@/components/COAViewer";
import { ErrorState } from "@/components/ErrorState";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useFileUpload } from "@/hooks/use-file-upload";
import { OptimizedImage } from "@/components/OptimizedImage";

const entrySchema = z.object({
  contest_id: z.string().uuid("Sélectionnez un concours"),
  strain_name: z.string().min(2, "Le nom de la variété doit contenir au moins 2 caractères"),
  cultivar: z.string().optional(),
  category: z.enum(["indica", "sativa", "hybrid", "outdoor", "hash", "other"], {
    required_error: "Sélectionnez une catégorie",
  }),
  thc_percent: z.coerce
    .number()
    .min(0, "Le taux THC doit être positif")
    .max(0.3, "Le taux THC doit être ≤0,3% selon la réglementation européenne")
    .optional()
    .or(z.literal("")),
  cbd_percent: z.coerce.number().min(0).max(100).optional().or(z.literal("")),
  terpene_profile: z.string().optional(),
  batch_code: z.string().optional(),
  submission_notes: z.string().optional(),
});

type EntryFormValues = z.infer<typeof entrySchema>;

const SubmitEntry = () => {
  const { contestId } = useParams<{ contestId?: string }>();
  const [searchParams] = useSearchParams();
  const editEntryId = searchParams.get("edit");
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  // Récupérer les concours disponibles
  const { data: contests, isLoading: contestsLoading } = useQuery({
    queryKey: ["contests", "registration"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contests")
        .select("*")
        .in("status", ["registration", "draft"])
        .order("start_date", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // État pour suivre le concours sélectionné
  const [selectedContestId, setSelectedContestId] = useState<string | null>(contestId || null);

  // Charger l'entrée à éditer si editEntryId est présent
  const { data: existingEntry, isLoading: loadingEntry } = useQuery({
    queryKey: ["entry", editEntryId],
    queryFn: async () => {
      if (!editEntryId) return null;
      const { data, error } = await supabase
        .from("entries")
        .select("*")
        .eq("id", editEntryId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!editEntryId,
  });

  const form = useForm<EntryFormValues>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      contest_id: contestId || "",
      strain_name: "",
      cultivar: "",
      category: "hybrid",
      thc_percent: undefined,
      cbd_percent: undefined,
      terpene_profile: "",
      batch_code: "",
      submission_notes: "",
    },
  });

  // Récupérer la limite THC du concours sélectionné
  const { data: selectedContest } = useQuery({
    queryKey: ["contest", selectedContestId, "thc-limit"],
    queryFn: async () => {
      if (!selectedContestId) return null;
      const { data, error } = await supabase
        .from("contests")
        .select("id, name, thc_limit, applicable_countries, legal_disclaimer")
        .eq("id", selectedContestId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!selectedContestId,
  });

  // Limite THC du concours (par défaut 0.3%)
  const thcLimit = selectedContest?.thc_limit ?? 0.3;

  // Mettre à jour selectedContestId quand le form change
  const watchedContestId = form.watch("contest_id");
  useEffect(() => {
    if (watchedContestId) {
      setSelectedContestId(watchedContestId);
    }
  }, [watchedContestId]);

  // Charger les données de l'entrée existante dans le formulaire
  useEffect(() => {
    if (existingEntry) {
      form.reset({
        contest_id: existingEntry.contest_id,
        strain_name: existingEntry.strain_name,
        cultivar: existingEntry.cultivar || "",
        category: existingEntry.category,
        thc_percent: existingEntry.thc_percent ?? undefined,
        cbd_percent: existingEntry.cbd_percent ?? undefined,
        terpene_profile: existingEntry.terpene_profile || "",
        batch_code: existingEntry.batch_code || "",
        submission_notes: existingEntry.submission_notes || "",
      });
      // Mettre à jour selectedContestId si on charge une entrée existante
      if (existingEntry.contest_id) {
        setSelectedContestId(existingEntry.contest_id);
      }
    }
  }, [existingEntry, form]);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [coaFile, setCoaFile] = useState<File | null>(null);

  // Hooks pour l'upload de fichiers
  const { uploadFile: uploadPhoto, uploading: uploadingPhoto } = useFileUpload({
    bucket: "entry-photos",
  });

  const { uploadFile: uploadDocument, uploading: uploadingDocument } = useFileUpload({
    bucket: "entry-documents",
  });

  const createEntryMutation = useMutation({
    mutationFn: async (data: EntryFormValues) => {
      if (!user?.id || !profile) throw new Error("Utilisateur non authentifié");

      // Upload photo si présente
      let photoUrl: string | null = existingEntry?.photo_url || null;
      if (photoFile) {
        const uploadedUrl = await uploadPhoto(photoFile, `entries/${user.id}`);
        if (uploadedUrl) {
          photoUrl = uploadedUrl;
        } else {
          throw new Error("Erreur lors de l'upload de la photo");
        }
      }

      // Upload COA si présent
      let coaUrl: string | null = existingEntry?.coa_url || null;
      if (coaFile) {
        const uploadedUrl = await uploadDocument(coaFile, `entries/${user.id}`);
        if (uploadedUrl) {
          coaUrl = uploadedUrl;
        } else {
          throw new Error("Erreur lors de l'upload du document COA");
        }
      }

      // Données de l'entrée
      const entryData = {
        contest_id: data.contest_id,
        producer_id: user.id,
        strain_name: data.strain_name,
        cultivar: data.cultivar || null,
        category: data.category,
        thc_percent: data.thc_percent || null,
        cbd_percent: data.cbd_percent || null,
        terpene_profile: data.terpene_profile || null,
        batch_code: data.batch_code || null,
        coa_url: coaUrl,
        photo_url: photoUrl,
        submission_notes: data.submission_notes || null,
      };

      if (editEntryId && existingEntry) {
        // Mise à jour d'une entrée existante
        // Ne pas changer le statut si l'entrée est déjà soumise
        const { data: entry, error } = await supabase
          .from("entries")
          .update(entryData)
          .eq("id", editEntryId)
          .select()
          .single();

        if (error) throw error;
        return entry;
      } else {
        // Création d'une nouvelle entrée
        const { data: entry, error } = await supabase
          .from("entries")
          .insert({ ...entryData, status: "draft" as const })
          .select()
          .single();

        if (error) throw error;
        return entry;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      queryClient.invalidateQueries({ queryKey: ["producer-dashboard"] });
      toast.success(editEntryId ? "Entrée mise à jour avec succès !" : "Entrée créée avec succès ! Vous pouvez la modifier avant de la soumettre.");
      navigate("/dashboard");
    },
    onError: (error: any) => {
      toast.error(error.message || (editEntryId ? "Erreur lors de la mise à jour de l'entrée" : "Erreur lors de la création de l'entrée"));
    },
  });

  const onSubmit = (data: EntryFormValues) => {
    createEntryMutation.mutate(data);
  };

  if (contestsLoading || (editEntryId && loadingEntry)) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="pt-28 pb-16">
          <div className="container mx-auto px-4">
            <LoadingState message={editEntryId ? "Chargement de l'entrée…" : "Chargement des concours…"} />
          </div>
        </div>
      </div>
    );
  }

  // Vérifier que l'entrée à éditer appartient bien à l'utilisateur et est en brouillon
  if (editEntryId && existingEntry) {
    if (existingEntry.producer_id !== user?.id) {
      return (
        <div className="min-h-screen">
          <Header />
          <div className="pt-28 pb-16">
            <div className="container mx-auto px-4">
              <ErrorState message="Vous n'avez pas l'autorisation de modifier cette entrée" />
            </div>
          </div>
        </div>
      );
    }
    if (existingEntry.status !== "draft") {
      return (
        <div className="min-h-screen">
          <Header />
          <div className="pt-28 pb-16">
            <div className="container mx-auto px-4">
              <ErrorState message="Cette entrée ne peut plus être modifiée car elle a déjà été soumise" />
            </div>
          </div>
        </div>
      );
    }
  }

  if (!profile || (profile.role !== "producer" && profile.role !== "organizer")) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="pt-28 pb-16">
          <div className="container mx-auto px-4">
            <ErrorState message="Seuls les producteurs peuvent soumettre des entrées" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {editEntryId ? "Modifier l'entrée" : "Soumettre une nouvelle entrée"}
              </CardTitle>
              <CardDescription>
                {editEntryId
                  ? "Modifiez les informations de votre entrée"
                  : "Remplissez le formulaire pour soumettre votre variété au concours"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="contest_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Concours *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={!!contestId}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez un concours" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {contests?.map((contest) => (
                              <SelectItem key={contest.id} value={contest.id}>
                                {contest.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choisissez le concours auquel vous souhaitez participer
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="strain_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom de la variété *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Emerald Velvet" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cultivar"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cultivar</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Velvet Kush" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catégorie *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="indica">Indica</SelectItem>
                            <SelectItem value="sativa">Sativa</SelectItem>
                            <SelectItem value="hybrid">Hybrid</SelectItem>
                            <SelectItem value="outdoor">Outdoor</SelectItem>
                            <SelectItem value="hash">Hash</SelectItem>
                            <SelectItem value="other">Autre</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="thc_percent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>THC (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max={thcLimit}
                              placeholder={`≤${thcLimit}`}
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === "") {
                                  field.onChange(undefined);
                                  return;
                                }
                                const numValue = parseFloat(value);
                                if (!isNaN(numValue) && numValue <= thcLimit) {
                                  field.onChange(numValue);
                                } else if (numValue > thcLimit) {
                                  toast.error(`Le taux THC ne peut pas dépasser ${thcLimit}% pour ce concours`);
                                }
                              }}
                            />
                          </FormControl>
                          <FormDescription className="text-xs space-y-1">
                            <div className="flex items-start gap-1">
                              <Info className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                              <span>
                                {selectedContest 
                                  ? `Limite légale pour ce concours : ≤${thcLimit}%${selectedContest.applicable_countries && selectedContest.applicable_countries.length > 0 ? ` (${selectedContest.applicable_countries.join(", ")})` : ""}`
                                  : `Limite légale UE : ≤0,3% (réglementation européenne)`}
                              </span>
                            </div>
                            <div className="flex items-start gap-1 text-muted-foreground">
                              <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              <span>Dans votre COA, cherchez la section "Cannabinoids" ou "THC Total". Le taux doit être exprimé en pourcentage.</span>
                            </div>
                            {form.watch("thc_percent") && form.watch("thc_percent")! > 0 && (
                              <div className={`flex items-center gap-1 ${form.watch("thc_percent")! <= thcLimit ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                                {form.watch("thc_percent")! <= thcLimit ? (
                                  <>
                                    <CheckCircle2 className="h-3 w-3" />
                                    <span>THC conforme ✅</span>
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle className="h-3 w-3" />
                                    <span>THC non conforme - Dépassement de la limite légale</span>
                                  </>
                                )}
                              </div>
                            )}
                          </FormDescription>
                          {selectedContest?.legal_disclaimer && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                              {selectedContest.legal_disclaimer}
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cbd_percent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CBD (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              placeholder="14.2"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            <div className="flex items-start gap-1 text-muted-foreground">
                              <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              <span>Dans votre COA, cherchez la section "Cannabinoids" → "CBD" ou "CBD Total". Exprimez en pourcentage (ex: 14.2%).</span>
                            </div>
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="terpene_profile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profil terpènes</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Myrcene, Limonene, Caryophyllene"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          <div className="flex items-start gap-1 text-muted-foreground mb-1">
                            <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span>Dans votre COA, cherchez la section "Terpenes" ou "Terpènes". Liste les principaux avec leur pourcentage si disponible (ex: Myrcène 1.2%, Limonène 0.8%, Caryophyllène 0.5%).</span>
                          </div>
                          <div className="text-muted-foreground">
                            Exemple : Myrcene, Limonene, Caryophyllene ou Myrcene 1.2%, Limonene 0.8%
                          </div>
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="batch_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code de lot</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: BATCH-2025-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <div>
                      <Label>Photo de la variété</Label>
                      <div className="mt-2 space-y-2">
                        {existingEntry?.photo_url && !photoFile && (
                          <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                            <OptimizedImage
                              src={existingEntry.photo_url}
                              alt="Photo actuelle"
                              className="w-full h-full object-cover"
                              lazy={false}
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-4">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                            className="cursor-pointer"
                            disabled={uploadingPhoto}
                          />
                          {photoFile && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">{photoFile.name}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setPhotoFile(null)}
                                disabled={uploadingPhoto}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          {uploadingPhoto && (
                            <span className="text-sm text-muted-foreground">Upload en cours...</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Label>Certificat d'analyse (COA)</Label>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="mb-3 p-3 bg-muted/50 rounded-lg border border-border/50">
                        <div className="flex items-start gap-2 text-xs text-muted-foreground">
                          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">Votre COA doit contenir :</p>
                            <ul className="list-disc list-inside space-y-0.5 ml-1">
                              <li>Taux THC (section "Cannabinoids" ou "THC Total")</li>
                              <li>Taux CBD (section "Cannabinoids" ou "CBD")</li>
                              <li>Profil terpénique (section "Terpenes" ou "Terpènes")</li>
                              <li>Nom du laboratoire et date d'analyse</li>
                            </ul>
                            <p className="text-muted-foreground mt-2">
                              <strong>Formats acceptés :</strong> JPG, PNG, WEBP (recommandé) ou PDF (max 10 MB)<br />
                              <span className="text-xs">💡 <strong>Astuce :</strong> Les images sont préférées pour une validation plus rapide !</span>
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 space-y-2">
                        {existingEntry?.coa_url && !coaFile && (
                          <div className="flex items-center gap-2">
                            <COAViewer
                              entryId={existingEntry.id}
                              coaUrl={existingEntry.coa_url}
                              variant="link"
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-4">
                          <Input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                            onChange={(e) => setCoaFile(e.target.files?.[0] || null)}
                            className="cursor-pointer"
                            disabled={uploadingDocument}
                          />
                          {coaFile && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">{coaFile.name}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setCoaFile(null)}
                                disabled={uploadingDocument}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          {uploadingDocument && (
                            <span className="text-sm text-muted-foreground">Upload en cours...</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="submission_notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes de soumission</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Informations complémentaires sur votre variété..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate(-1)}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      disabled={createEntryMutation.isPending || uploadingPhoto || uploadingDocument}
                    >
                      {uploadingPhoto || uploadingDocument
                        ? "Upload en cours..."
                        : createEntryMutation.isPending
                          ? editEntryId
                            ? "Mise à jour..."
                            : "Création..."
                          : editEntryId
                            ? "Mettre à jour l'entrée"
                            : "Créer l'entrée (brouillon)"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Wrapper avec ProtectedRoute
const SubmitEntryPage = () => (
  <ProtectedRoute requiredRole="producer">
    <SubmitEntry />
  </ProtectedRoute>
);

export default SubmitEntryPage;

