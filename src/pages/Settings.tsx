import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useNotificationPreferences } from "@/hooks/use-notification-preferences";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import Header from "@/components/Header";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PrivacyOperations } from "@/components/PrivacyOperations";
import { Bell, Mail, Smartphone, Settings as SettingsIcon } from "lucide-react";

const Settings = () => {
  const { preferences, isLoading, error, updatePreferences, isUpdating } = useNotificationPreferences();

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="pt-28 pb-16">
          <LoadingState message="Chargement des préférences..." />
        </div>
      </div>
    );
  }

  if (error || !preferences) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="pt-28 pb-16">
          <ErrorState message="Erreur lors du chargement des préférences" />
        </div>
      </div>
    );
  }

  const handleToggle = (key: keyof typeof preferences, value: boolean) => {
    updatePreferences({ [key]: value });
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main id="main-content" tabIndex={-1} className="focus:outline-none">
        <div className="pt-28 pb-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              {/* Header */}
              <div className="text-center mb-8">
                <Badge className="mb-4 bg-gradient-gold text-foreground/80">
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  Paramètres
                </Badge>
                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                  Préférences de notification
                </h1>
                <p className="text-muted-foreground text-lg">
                  Gérez vos préférences de notification par email et in-app
                </p>
              </div>

              {/* Notifications Email */}
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-accent" />
                    <div>
                      <CardTitle>Notifications Email</CardTitle>
                      <CardDescription>
                        Recevez des notifications par email pour rester informé
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-enabled" className="text-base">
                        Activer les notifications email
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Active ou désactive toutes les notifications email
                      </p>
                    </div>
                    <Switch
                      id="email-enabled"
                      checked={preferences.email_enabled}
                      onCheckedChange={(checked) => handleToggle("email_enabled", checked)}
                      disabled={isUpdating}
                    />
                  </div>

                  <Separator />

                  {preferences.email_enabled && (
                    <div className="space-y-4 pl-4 border-l-2 border-accent/20">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="email-contest-created">Nouveau concours</Label>
                          <p className="text-sm text-muted-foreground">
                            Recevoir un email lorsqu'un nouveau concours est créé
                          </p>
                        </div>
                        <Switch
                          id="email-contest-created"
                          checked={preferences.email_contest_created}
                          onCheckedChange={(checked) => handleToggle("email_contest_created", checked)}
                          disabled={isUpdating}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="email-entry-approved">Entrée approuvée</Label>
                          <p className="text-sm text-muted-foreground">
                            Recevoir un email lorsque votre entrée est approuvée
                          </p>
                        </div>
                        <Switch
                          id="email-entry-approved"
                          checked={preferences.email_entry_approved}
                          onCheckedChange={(checked) => handleToggle("email_entry_approved", checked)}
                          disabled={isUpdating}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="email-judge-assigned">Assignation juge</Label>
                          <p className="text-sm text-muted-foreground">
                            Recevoir un email lorsque vous êtes assigné comme juge
                          </p>
                        </div>
                        <Switch
                          id="email-judge-assigned"
                          checked={preferences.email_judge_assigned}
                          onCheckedChange={(checked) => handleToggle("email_judge_assigned", checked)}
                          disabled={isUpdating}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="email-results-published">Résultats publiés</Label>
                          <p className="text-sm text-muted-foreground">
                            Recevoir un email lorsque les résultats d'un concours sont publiés
                          </p>
                        </div>
                        <Switch
                          id="email-results-published"
                          checked={preferences.email_results_published}
                          onCheckedChange={(checked) => handleToggle("email_results_published", checked)}
                          disabled={isUpdating}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="email-vote-received">Vote reçu</Label>
                          <p className="text-sm text-muted-foreground">
                            Recevoir un email lorsqu'un vote est déposé sur votre entrée
                          </p>
                        </div>
                        <Switch
                          id="email-vote-received"
                          checked={preferences.email_vote_received}
                          onCheckedChange={(checked) => handleToggle("email_vote_received", checked)}
                          disabled={isUpdating}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="email-score-received">Score reçu</Label>
                          <p className="text-sm text-muted-foreground">
                            Recevoir un email lorsqu'un score est attribué à votre entrée
                          </p>
                        </div>
                        <Switch
                          id="email-score-received"
                          checked={preferences.email_score_received}
                          onCheckedChange={(checked) => handleToggle("email_score_received", checked)}
                          disabled={isUpdating}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notifications In-App */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-accent" />
                    <div>
                      <CardTitle>Notifications In-App</CardTitle>
                      <CardDescription>
                        Gérez les notifications affichées dans l'application
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="in-app-enabled" className="text-base">
                        Activer les notifications in-app
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Active ou désactive toutes les notifications in-app
                      </p>
                    </div>
                    <Switch
                      id="in-app-enabled"
                      checked={preferences.in_app_enabled}
                      onCheckedChange={(checked) => handleToggle("in_app_enabled", checked)}
                      disabled={isUpdating}
                    />
                  </div>

                  <Separator />

                  {preferences.in_app_enabled && (
                    <div className="space-y-4 pl-4 border-l-2 border-accent/20">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="in-app-contest-created">Nouveau concours</Label>
                          <p className="text-sm text-muted-foreground">
                            Afficher une notification lorsqu'un nouveau concours est créé
                          </p>
                        </div>
                        <Switch
                          id="in-app-contest-created"
                          checked={preferences.in_app_contest_created}
                          onCheckedChange={(checked) => handleToggle("in_app_contest_created", checked)}
                          disabled={isUpdating}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="in-app-entry-approved">Entrée approuvée</Label>
                          <p className="text-sm text-muted-foreground">
                            Afficher une notification lorsque votre entrée est approuvée
                          </p>
                        </div>
                        <Switch
                          id="in-app-entry-approved"
                          checked={preferences.in_app_entry_approved}
                          onCheckedChange={(checked) => handleToggle("in_app_entry_approved", checked)}
                          disabled={isUpdating}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="in-app-judge-assigned">Assignation juge</Label>
                          <p className="text-sm text-muted-foreground">
                            Afficher une notification lorsque vous êtes assigné comme juge
                          </p>
                        </div>
                        <Switch
                          id="in-app-judge-assigned"
                          checked={preferences.in_app_judge_assigned}
                          onCheckedChange={(checked) => handleToggle("in_app_judge_assigned", checked)}
                          disabled={isUpdating}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="in-app-results-published">Résultats publiés</Label>
                          <p className="text-sm text-muted-foreground">
                            Afficher une notification lorsque les résultats sont publiés
                          </p>
                        </div>
                        <Switch
                          id="in-app-results-published"
                          checked={preferences.in_app_results_published}
                          onCheckedChange={(checked) => handleToggle("in_app_results_published", checked)}
                          disabled={isUpdating}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="in-app-vote-received">Vote reçu</Label>
                          <p className="text-sm text-muted-foreground">
                            Afficher une notification lorsqu'un vote est déposé
                          </p>
                        </div>
                        <Switch
                          id="in-app-vote-received"
                          checked={preferences.in_app_vote_received}
                          onCheckedChange={(checked) => handleToggle("in_app_vote_received", checked)}
                          disabled={isUpdating}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="in-app-score-received">Score reçu</Label>
                          <p className="text-sm text-muted-foreground">
                            Afficher une notification lorsqu'un score est attribué
                          </p>
                        </div>
                        <Switch
                          id="in-app-score-received"
                          checked={preferences.in_app_score_received}
                          onCheckedChange={(checked) => handleToggle("in_app_score_received", checked)}
                          disabled={isUpdating}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Privacy Operations - RGPD */}
              <div className="mt-8">
                <PrivacyOperations />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Wrapper avec ProtectedRoute
const SettingsPage = () => (
  <ProtectedRoute>
    <Settings />
  </ProtectedRoute>
);

export default SettingsPage;

