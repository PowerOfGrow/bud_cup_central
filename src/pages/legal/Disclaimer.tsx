import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Shield, Info, Ban } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Disclaimer = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="pt-28 pb-16 flex-1">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-16 w-16 text-amber-500" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Avertissements Légaux
              </h1>
              <p className="text-lg text-muted-foreground">
                Informations importantes concernant l'utilisation de la plateforme CBD Flower Cup
              </p>
            </div>

            <Alert className="mb-6 border-amber-500 bg-amber-50 dark:bg-amber-950">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="font-bold text-amber-900 dark:text-amber-100">
                Avertissement Important
              </AlertTitle>
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                La plateforme CBD Flower Cup est destinée exclusivement aux produits CBD conformes à la réglementation européenne (THC ≤ 0,3%). 
                L'utilisation de cette plateforme est soumise aux lois et réglementations applicables dans votre juridiction.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ban className="h-5 w-5" />
                  1. Restrictions d'Âge
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  <strong className="font-semibold">L'accès à cette plateforme est strictement réservé aux personnes majeures.</strong>
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>En France et dans la plupart des pays européens : <strong>18 ans minimum</strong></li>
                  <li>Dans certains pays (États-Unis, etc.) : <strong>21 ans minimum</strong></li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  En accédant et en utilisant cette plateforme, vous certifiez être majeur selon la législation de votre pays de résidence. 
                  Toute utilisation par un mineur est strictement interdite.
                </p>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  2. Conformité Réglementaire CBD
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">2.1. Limite de THC</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Tous les produits présentés sur cette plateforme doivent être conformes à la réglementation européenne concernant le CBD :
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li><strong>THC ≤ 0,3%</strong> (limite légale en Europe)</li>
                    <li>Certificat d'Analyse (COA) obligatoire pour chaque entrée</li>
                    <li>Traçabilité complète (codes de lot, laboratoire d'analyse)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">2.2. Restrictions Géographiques</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Les réglementations concernant le CBD varient selon les pays. Certaines fonctionnalités de la plateforme peuvent être restreintes 
                    selon votre localisation géographique. Il est de votre responsabilité de vérifier la légalité du CBD dans votre juridiction.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">2.3. Aucune Allégation de Santé</h3>
                  <p className="text-muted-foreground leading-relaxed font-semibold text-amber-600 dark:text-amber-400">
                    Cette plateforme et les produits présentés ne font AUCUNE allégation de santé ou thérapeutique concernant le CBD.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Les informations présentées sur cette plateforme sont à des fins éducatives et informatives uniquement. 
                    Elles ne constituent pas un avis médical et ne doivent pas être utilisées pour :
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li>Diagnostiquer, traiter, guérir ou prévenir une maladie</li>
                    <li>Remplacer un traitement médical prescrit</li>
                    <li>Se substituer aux conseils d'un professionnel de santé</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  3. Nature de la Plateforme
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  CBD Flower Cup est une plateforme de <strong>compétition et d'évaluation</strong> de produits CBD. Cette plateforme :
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Ne vend PAS de produits CBD</li>
                  <li>N'est PAS un site e-commerce</li>
                  <li>Ne garantit PAS la qualité, la sécurité ou la conformité des produits présentés</li>
                  <li>Ne fournit PAS de conseils médicaux ou thérapeutiques</li>
                  <li>N'est PAS responsable des contenus soumis par les utilisateurs</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  Les classements et résultats présentés sont basés sur des critères d'évaluation esthétiques, aromatiques et sensoriels. 
                  Ils ne reflètent en aucun cas une évaluation médicale, thérapeutique ou sanitaire.
                </p>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>4. Responsabilité des Utilisateurs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Chaque utilisateur est seul responsable :
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>De la conformité des produits qu'il soumet avec la réglementation locale et européenne</li>
                  <li>De l'exactitude des informations fournies (descriptions, COA, photos)</li>
                  <li>De l'utilisation qu'il fait des informations disponibles sur la plateforme</li>
                  <li>Du respect des lois et réglementations applicables dans sa juridiction</li>
                  <li>Des conséquences découlant de l'utilisation de la plateforme</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>5. Limitation de Responsabilité</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Gard Eau Arbres, en tant qu'organisateur de la plateforme, décline toute responsabilité concernant :
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>La qualité, la sécurité ou la conformité des produits présentés</li>
                  <li>L'exactitude des informations soumises par les utilisateurs</li>
                  <li>Les dommages directs ou indirects résultant de l'utilisation de la plateforme</li>
                  <li>Les conséquences légales ou réglementaires liées à l'utilisation de produits CBD</li>
                  <li>Les interactions entre utilisateurs ou transactions commerciales externes à la plateforme</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  L'utilisation de la plateforme se fait à vos propres risques. Nous ne garantissons pas l'absence d'erreurs, 
                  d'interruptions ou de défauts dans le fonctionnement de la plateforme.
                </p>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>6. Propriété Intellectuelle et Contenu Utilisateur</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Les contenus soumis par les utilisateurs (photos, descriptions, COA) sont publics et visibles par tous. 
                  Gard Eau Arbres n'exerce pas de contrôle a priori sur ces contenus et ne peut être tenu responsable de :
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>La violation de droits de propriété intellectuelle par un utilisateur</li>
                  <li>Le contenu diffamatoire, offensant ou illégal publié par un utilisateur</li>
                  <li>La diffusion d'informations erronées ou trompeuses</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  En soumettant du contenu, chaque utilisateur garantit qu'il détient tous les droits nécessaires et que 
                  le contenu respecte les lois applicables.
                </p>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>7. Modifications des Avertissements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Ces avertissements peuvent être modifiés à tout moment. Les modifications entrent en vigueur dès leur publication 
                  sur cette page. Il est recommandé de consulter régulièrement cette page pour rester informé des conditions d'utilisation.
                </p>
              </CardContent>
            </Card>

            <Alert className="mt-6 border-blue-500 bg-blue-50 dark:bg-blue-950">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertTitle className="font-bold text-blue-900 dark:text-blue-100">
                Questions ou Préoccupations ?
              </AlertTitle>
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                Pour toute question concernant ces avertissements ou l'utilisation de la plateforme, 
                veuillez nous contacter via la page de contact. Consultez également nos{" "}
                <a href="/legal/terms" className="text-accent hover:underline font-semibold">Conditions Générales d'Utilisation</a> et notre{" "}
                <a href="/legal/privacy" className="text-accent hover:underline font-semibold">Politique de Confidentialité</a>.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Disclaimer;

