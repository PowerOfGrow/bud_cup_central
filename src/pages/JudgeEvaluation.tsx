import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Award } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
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
import { ErrorState } from "@/components/ErrorState";
import { useEntryCategoryName } from "@/hooks/use-entry-category";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const evaluationSchema = z.object({
  appearance_score: z.number().min(0).max(100),
  aroma_score: z.number().min(0).max(100),
  taste_score: z.number().min(0).max(100),
  effect_score: z.number().min(0).max(100),
  overall_score: z.number().min(0).max(100),
  notes: z.string().optional(),
});

type EvaluationFormValues = z.infer<typeof evaluationSchema>;

const JudgeEvaluation = () => {
  const { entryId } = useParams<{ entryId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  // Récupérer l'entrée
  const { data: entry, isLoading, error } = useQuery({
    queryKey: ["entry", entryId],
    queryFn: async () => {
      if (!entryId) throw new Error("Entry ID manquant");
      const { data, error } = await supabase
        .from("entries")
        .select(
          `
          *,
          contest:contests(id, name, status),
          producer:profiles!entries_producer_id_fkey(display_name, organization)
        `
        )
        .eq("id", entryId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!entryId,
  });

  // Récupérer le nom de catégorie (custom ou global)
  const { data: categoryName } = useEntryCategoryName(entryId);

  // Vérifier si le juge a déjà évalué cette entrée
  const { data: existingScore } = useQuery({
    queryKey: ["judge-score", entryId, user?.id],
    queryFn: async () => {
      if (!entryId || !user?.id) return null;
      const { data } = await supabase
        .from("judge_scores")
        .select("*")
        .eq("entry_id", entryId)
        .eq("judge_id", user.id)
        .single();

      return data;
    },
    enabled: !!entryId && !!user?.id,
  });

  const form = useForm<EvaluationFormValues>({
    resolver: zodResolver(evaluationSchema),
    defaultValues: {
      appearance_score: existingScore?.appearance_score ?? 50,
      aroma_score: existingScore?.aroma_score ?? 50,
      taste_score: existingScore?.taste_score ?? 50,
      effect_score: existingScore?.effect_score ?? 50,
      overall_score: existingScore?.overall_score ?? 50,
      notes: existingScore?.notes ?? "",
    },
  });

  // Calculer la moyenne des 4 critères pour proposer un score global automatique
  const watchScores = form.watch(["appearance_score", "aroma_score", "taste_score", "effect_score"]);
  const calculatedOverall = Math.round(
    (watchScores[0] + watchScores[1] + watchScores[2] + watchScores[3]) / 4
  );

  // Mettre à jour le score global calculé quand les critères changent
  useEffect(() => {
    if (!existingScore && calculatedOverall > 0) {
      // Seulement si c'est une nouvelle évaluation, proposer la moyenne calculée
      form.setValue("overall_score", calculatedOverall, { shouldValidate: false });
    }
  }, [calculatedOverall, existingScore, form]);

  // Recharger les valeurs si existingScore change
  useEffect(() => {
    if (existingScore) {
      form.reset({
        appearance_score: existingScore.appearance_score,
        aroma_score: existingScore.aroma_score,
        taste_score: existingScore.taste_score,
        effect_score: existingScore.effect_score,
        overall_score: existingScore.overall_score,
        notes: existingScore.notes ?? "",
      });
    }
  }, [existingScore, form]);

  const scoreMutation = useMutation({
    mutationFn: async (data: EvaluationFormValues) => {
      if (!entryId || !user?.id) throw new Error("Données manquantes");

      if (existingScore) {
        // Mettre à jour l'évaluation existante
        const { error } = await supabase
          .from("judge_scores")
          .update({
            appearance_score: data.appearance_score,
            aroma_score: data.aroma_score,
            taste_score: data.taste_score,
            effect_score: data.effect_score,
            overall_score: data.overall_score,
            notes: data.notes || null,
          })
          .eq("id", existingScore.id);

        if (error) throw error;
      } else {
        // Créer une nouvelle évaluation
        const { error } = await supabase.from("judge_scores").insert({
          entry_id: entryId,
          judge_id: user.id,
          appearance_score: data.appearance_score,
          aroma_score: data.aroma_score,
          taste_score: data.taste_score,
          effect_score: data.effect_score,
          overall_score: data.overall_score,
          notes: data.notes || null,
        });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["judge-score", entryId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ["entry", entryId] });
      toast.success(existingScore ? "Évaluation mise à jour !" : "Évaluation enregistrée !");
      navigate(-1);
    },
    onError: (error: any) => {
      // Gérer les erreurs de conflit d'intérêt de manière explicite
      if (error.message?.includes("Conflict of interest") || error.message?.includes("conflit")) {
        toast.error(
          "Conflit d'intérêt : vous ne pouvez pas évaluer vos propres entrées.",
          { duration: 6000 }
        );
      } else {
        toast.error(error.message || "Erreur lors de l'enregistrement de l'évaluation");
      }
    },
  });

  const onSubmit = (data: EvaluationFormValues) => {
    scoreMutation.mutate(data);
  };

  if (!user || !profile || (profile.role !== "judge" && profile.role !== "organizer")) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="pt-28 pb-16">
          <div className="container mx-auto px-4">
            <ErrorState message="Seuls les juges peuvent évaluer les entrées" />
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="pt-28 pb-16">
          <div className="container mx-auto px-4">
            <LoadingState message="Chargement de l'entrée…" />
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
            <ErrorState message="Impossible de charger l'entrée" />
          </div>
        </div>
      </div>
    );
  }

  // Vérifier le conflit d'intérêt : le juge ne peut pas évaluer ses propres entrées
  const isProducer = entry.producer_id === user?.id;
  if (isProducer) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="pt-28 pb-16">
          <div className="container mx-auto px-4">
            <ErrorState 
              message="Conflit d'intérêt détecté"
              description="Vous ne pouvez pas évaluer vos propres entrées. Cette entrée vous appartient."
            />
          </div>
        </div>
      </div>
    );
  }

  const ScoreField = ({
    name,
    label,
    description,
  }: {
    name: keyof EvaluationFormValues;
    label: string;
    description: string;
  }) => {
    const value = form.watch(name);
    return (
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{description}</span>
                  <span className="text-lg font-semibold text-accent">{value}/100</span>
                </div>
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={[field.value]}
                  onValueChange={(vals) => field.onChange(vals[0])}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

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

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-2xl">{entry.strain_name}</CardTitle>
              <CardDescription>
                {entry.producer?.display_name}
                {entry.producer?.organization && ` • ${entry.producer.organization}`}
                {entry.contest && ` • ${entry.contest.name}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="bg-muted/40 rounded-xl p-4">
                <p className="text-sm text-muted-foreground mb-1">THC / CBD</p>
                <p className="text-lg font-semibold text-foreground">
                  {entry.thc_percent ?? "—"}% / {entry.cbd_percent ?? "—"}%
                </p>
              </div>
              <div className="bg-muted/40 rounded-xl p-4">
                <p className="text-sm text-muted-foreground mb-1">Catégorie</p>
                <p className="text-lg font-semibold text-foreground capitalize">
                  {categoryName || entry.category || "Autre"}
                </p>
              </div>
              <div className="bg-muted/40 rounded-xl p-4">
                <p className="text-sm text-muted-foreground mb-1">Terpènes</p>
                <p className="text-sm font-medium text-foreground line-clamp-2">
                  {entry.terpene_profile ?? "Non communiqué"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Award className="h-6 w-6 text-accent" />
                Fiche d'évaluation
              </CardTitle>
              <CardDescription>
                Évaluez cette variété selon les critères suivants (0-100 points chacun)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <ScoreField
                    name="appearance_score"
                    label="Apparence"
                    description="Couleur, structure, densité, trichomes"
                  />

                  <ScoreField
                    name="aroma_score"
                    label="Arôme"
                    description="Intensité, complexité, profil terpénique"
                  />

                  <ScoreField
                    name="taste_score"
                    label="Goût"
                    description="Saveur, texture, persistance en bouche"
                  />

                  <ScoreField
                    name="effect_score"
                    label="Effets"
                    description="Intensité, qualité, durée des effets"
                  />

                  <div className="space-y-2">
                    <ScoreField
                      name="overall_score"
                      label="Note globale"
                      description={`Appréciation générale (moyenne calculée : ${calculatedOverall}/100 - ajustable)`}
                    />
                    {!existingScore && (
                      <p className="text-xs text-muted-foreground">
                        💡 La note globale est calculée automatiquement comme moyenne des 4 critères. Vous pouvez l'ajuster selon votre appréciation globale.
                      </p>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes et commentaires</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Ajoutez vos observations détaillées sur cette variété..."
                            rows={6}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Décrivez vos impressions, points forts, points à améliorer, etc.
                        </FormDescription>
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
                      disabled={scoreMutation.isPending}
                      className="bg-gradient-gold"
                    >
                      {scoreMutation.isPending
                        ? "Enregistrement..."
                        : existingScore
                          ? "Mettre à jour l'évaluation"
                          : "Enregistrer l'évaluation"}
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
const JudgeEvaluationPage = () => (
  <ProtectedRoute requiredRole="judge">
    <JudgeEvaluation />
  </ProtectedRoute>
);

export default JudgeEvaluationPage;

