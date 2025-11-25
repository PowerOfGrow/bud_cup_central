import { useState, useEffect } from "react";
import { X, CheckCircle2, ArrowRight, ArrowLeft, Users, Award, Leaf, Eye, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useOnboarding } from "@/hooks/use-onboarding";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  content: React.ReactNode;
  actions?: Array<{
    label: string;
    action: string; // route or "skip"
    variant?: "default" | "outline";
  }>;
}

interface OnboardingWizardProps {
  open: boolean;
  onClose: () => void;
  userRole: "organizer" | "producer" | "judge" | "viewer";
}

const roleConfigs = {
  organizer: {
    steps: [
      {
        id: "welcome",
        title: "Bienvenue Organisateur !",
        description: "Vous pouvez créer et gérer des concours CBD",
        icon: Users,
        content: (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              En tant qu'organisateur, vous avez accès à toutes les fonctionnalités de gestion des concours :
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Créer et configurer des concours</li>
              <li>Inviter et gérer les juges</li>
              <li>Valider les entrées des producteurs</li>
              <li>Publier les résultats et classements</li>
              <li>Consulter les analytics et statistiques</li>
            </ul>
          </div>
        ),
        actions: [
          { label: "Créer mon premier concours", action: "/manage-contests?new=true", variant: "default" as const },
          { label: "Explorer le dashboard", action: "skip" },
        ],
      },
      {
        id: "create-contest",
        title: "Créer votre premier concours",
        description: "Configurez les dates, catégories et règles",
        icon: Award,
        content: (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Pour créer un concours, vous devrez définir :
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Le nom et la description du concours</li>
              <li>Les dates (inscription, jugement, résultats)</li>
              <li>La limite légale THC (par défaut 0.3% UE)</li>
              <li>Les pondérations jury/public</li>
            </ul>
            <div className="p-3 bg-muted/50 rounded-lg mt-4">
              <p className="text-xs font-medium mb-1">💡 Astuce</p>
              <p className="text-xs text-muted-foreground">
                Vous pourrez modifier la plupart des paramètres tant que le concours est en statut "Brouillon"
              </p>
            </div>
          </div>
        ),
        actions: [
          { label: "Créer un concours", action: "/manage-contests?new=true", variant: "default" as const },
          { label: "Passer cette étape", action: "skip" },
        ],
      },
      {
        id: "invite-judges",
        title: "Inviter des juges",
        description: "Assignez des juges à votre concours",
        icon: Users,
        content: (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Les juges évaluent les entrées selon 4 critères standardisés :
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Apparence (inclut densité, trichomes)</li>
              <li>Arôme (inclut profil terpénique)</li>
              <li>Goût</li>
              <li>Effets ressentis</li>
            </ul>
            <div className="p-3 bg-muted/50 rounded-lg mt-4">
              <p className="text-xs font-medium mb-1">🔒 Sécurité</p>
              <p className="text-xs text-muted-foreground">
                Le système empêche automatiquement les conflits d'intérêt : un juge ne peut pas évaluer ses propres entrées
              </p>
            </div>
          </div>
        ),
        actions: [
          { label: "Voir les juges", action: "/manage-contest-judges", variant: "default" as const },
          { label: "Plus tard", action: "skip" },
        ],
      },
    ],
  },
  producer: {
    steps: [
      {
        id: "welcome",
        title: "Bienvenue Producteur !",
        description: "Soumettez vos variétés CBD aux concours",
        icon: Leaf,
        content: (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              En tant que producteur, vous pouvez :
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Soumettre des entrées aux concours ouverts</li>
              <li>Gérer vos entrées (brouillons, modifications)</li>
              <li>Suivre vos performances et scores</li>
              <li>Télécharger vos certificats d'analyse (COA)</li>
            </ul>
          </div>
        ),
        actions: [
          { label: "Soumettre une entrée", action: "/submit-entry", variant: "default" as const },
          { label: "Explorer le dashboard", action: "skip" },
        ],
      },
      {
        id: "submit-entry",
        title: "Soumettre votre première entrée",
        description: "Remplissez le formulaire avec vos informations produit",
        icon: Leaf,
        content: (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Pour soumettre une entrée, vous aurez besoin de :
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Informations produit (nom, cultivar, catégorie)</li>
              <li>Taux THC et CBD (depuis votre COA)</li>
              <li>Profil terpénique</li>
              <li>Photo principale de la variété</li>
              <li>Certificat d'analyse (COA) en PDF ou image</li>
            </ul>
            <div className="p-3 bg-muted/50 rounded-lg mt-4">
              <p className="text-xs font-medium mb-1">💡 Astuce</p>
              <p className="text-xs text-muted-foreground">
                Vous pouvez enregistrer en brouillon et finaliser plus tard. Les deadlines sont affichées dans votre dashboard.
              </p>
            </div>
          </div>
        ),
        actions: [
          { label: "Créer une entrée", action: "/submit-entry", variant: "default" as const },
          { label: "Plus tard", action: "skip" },
        ],
      },
      {
        id: "coa-guide",
        title: "Guide COA",
        description: "Comprendre les exigences du certificat d'analyse",
        icon: Leaf,
        content: (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Votre COA doit contenir :
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Taux THC (section "Cannabinoids" ou "THC Total")</li>
              <li>Taux CBD (section "Cannabinoids" ou "CBD")</li>
              <li>Profil terpénique (section "Terpenes")</li>
              <li>Nom du laboratoire et date d'analyse</li>
            </ul>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg mt-4 border border-amber-200 dark:border-amber-800">
              <p className="text-xs font-medium mb-1 text-amber-900 dark:text-amber-100">⚠️ Important</p>
              <p className="text-xs text-amber-800 dark:text-amber-200">
                La limite THC est vérifiée automatiquement selon le concours sélectionné (par défaut ≤0.3% UE)
              </p>
            </div>
          </div>
        ),
        actions: [
          { label: "J'ai compris", action: "skip", variant: "default" as const },
        ],
      },
    ],
  },
  judge: {
    steps: [
      {
        id: "welcome",
        title: "Bienvenue Juge !",
        description: "Évaluez les entrées selon des critères standardisés",
        icon: Award,
        content: (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              En tant que juge, vous serez invité à évaluer des entrées selon 4 critères :
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li><strong>Apparence</strong> : Couleur, structure, densité, trichomes</li>
              <li><strong>Arôme</strong> : Intensité, complexité, profil terpénique</li>
              <li><strong>Goût</strong> : Saveur, texture, persistance</li>
              <li><strong>Effets</strong> : Intensité, qualité, durée</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-4">
              Chaque critère est noté sur 100 points. Le score global est calculé automatiquement comme la moyenne des 4 critères, que vous pouvez ajuster si nécessaire.
            </p>
          </div>
        ),
        actions: [
          { label: "Voir mes assignations", action: "/dashboard", variant: "default" as const },
          { label: "Explorer", action: "skip" },
        ],
      },
      {
        id: "evaluation-process",
        title: "Processus d'évaluation",
        description: "Comment évaluer une entrée",
        icon: Award,
        content: (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Lorsqu'une entrée vous est assignée :
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Consultez les informations de l'entrée (profil cannabinoïde, terpènes, COA)</li>
              <li>Évaluez selon les 4 critères (0-100 points chacun)</li>
              <li>Le score global est calculé automatiquement (moyenne des 4)</li>
              <li>Vous pouvez ajuster le score global si nécessaire</li>
              <li>Ajoutez des commentaires et notes pour chaque critère</li>
            </ol>
            <div className="p-3 bg-muted/50 rounded-lg mt-4">
              <p className="text-xs font-medium mb-1">🔒 Conflits d'intérêt</p>
              <p className="text-xs text-muted-foreground">
                Si vous êtes aussi producteur, vous ne pourrez pas évaluer vos propres entrées. Le système bloque automatiquement cette action.
              </p>
            </div>
          </div>
        ),
        actions: [
          { label: "J'ai compris", action: "skip", variant: "default" as const },
        ],
      },
    ],
  },
  viewer: {
    steps: [
      {
        id: "welcome",
        title: "Bienvenue !",
        description: "Découvrez les meilleures variétés CBD",
        icon: Eye,
        content: (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              En tant que membre gratuit, vous pouvez :
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Parcourir les concours et entrées</li>
              <li>Voter pour vos variétés préférées (1-5 étoiles)</li>
              <li>Commenter et interagir</li>
              <li>Ajouter des entrées en favoris</li>
              <li>Partager sur les réseaux sociaux</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-4">
              Votre vote contribue au classement final combiné (30% par défaut) avec les scores du jury professionnel.
            </p>
          </div>
        ),
        actions: [
          { label: "Explorer les concours", action: "/contests", variant: "default" as const },
          { label: "Commencer", action: "skip" },
        ],
      },
    ],
  },
};

export const OnboardingWizard = ({ open, onClose, userRole }: OnboardingWizardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { onboardingStatus, completeStep, completeOnboarding, isLoading: isLoadingOnboarding } = useOnboarding();
  
  // Utiliser l'état de la DB si disponible, sinon commencer à l'étape 1
  const [currentStep, setCurrentStep] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);

  const config = roleConfigs[userRole];
  const steps = config.steps;
  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  // Initialiser l'étape courante depuis la DB
  useEffect(() => {
    if (onboardingStatus && !isLoadingOnboarding) {
      // current_step dans la DB est 1-indexed, notre state est 0-indexed
      const dbStep = Math.max(0, (onboardingStatus.current_step || 1) - 1);
      setCurrentStep(Math.min(dbStep, steps.length - 1));
    }
  }, [onboardingStatus, isLoadingOnboarding, steps.length]);

  const handleNext = async () => {
    // Marquer l'étape actuelle comme complétée dans la DB
    // Les étapes sont 1-indexed dans la DB
    completeStep(currentStep + 1);

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = (skip: boolean = false) => {
    completeOnboarding(skip);
    onClose();
  };

  const handleSkip = () => {
    handleComplete(true);
  };

  const handleAction = async (action: string) => {
    if (action === "skip") {
      handleSkip();
      return;
    }

    // Si l'action est une route, marquer l'étape comme complétée et naviguer
    if (action.startsWith("/")) {
      setIsNavigating(true);
      completeStep(currentStep + 1);
      
      // Si c'est la dernière étape, compléter l'onboarding
      if (currentStep === steps.length - 1) {
        handleComplete(false);
      }
      
      // Naviguer vers la route
      navigate(action);
      // Fermer l'onboarding après un court délai pour permettre la navigation
      setTimeout(() => {
        onClose();
        setIsNavigating(false);
      }, 100);
    } else {
      // Sinon, passer à l'étape suivante
      handleNext();
    }
  };

  if (!open || !currentStepData) return null;

  const Icon = currentStepData.icon;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Icon className="h-6 w-6 text-accent" />
              </div>
              <div>
                <DialogTitle className="text-xl">{currentStepData.title}</DialogTitle>
                <DialogDescription>{currentStepData.description}</DialogDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Étape {currentStep + 1} sur {steps.length}</span>
              <span>{Math.round(progress)}% complété</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step indicators */}
          <div className="flex gap-2 justify-center">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index < currentStep
                    ? "bg-green-500"
                    : index === currentStep
                    ? "bg-accent"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <Card className="border-border/50">
            <CardContent className="pt-6">
              {currentStepData.content}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Précédent
            </Button>

            <div className="flex gap-2">
              {currentStepData.actions?.map((action, index) => (
                action.action === "skip" ? (
                  <Button
                    key={index}
                    variant={action.variant || "outline"}
                    onClick={handleSkip}
                  >
                    {action.label}
                  </Button>
                ) : (
                  <Button
                    key={index}
                    variant={action.variant || "default"}
                    onClick={() => handleAction(action.action)}
                    disabled={isNavigating}
                  >
                    {action.label}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )
              ))}
              
              {(!currentStepData.actions || currentStepData.actions.length === 0) && (
                <>
                  {currentStep < steps.length - 1 ? (
                    <Button onClick={handleNext}>
                      Suivant
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button onClick={handleComplete}>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Terminer
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

