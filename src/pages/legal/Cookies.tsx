import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cookie, Shield, Settings, BarChart } from "lucide-react";

const Cookies = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="pt-28 pb-16 flex-1">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex justify-center mb-4">
                <Cookie className="h-16 w-16 text-accent" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Politique des Cookies
              </h1>
              <p className="text-lg text-muted-foreground">
                Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cookie className="h-5 w-5" />
                  1. Qu'est-ce qu'un Cookie ?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Un cookie est un petit fichier texte stocké sur votre appareil (ordinateur, tablette, smartphone) lorsque vous visitez un site web. 
                  Les cookies permettent au site de reconnaître votre appareil et de mémoriser certaines informations sur vos préférences ou actions passées.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  CBD Flower Cup utilise des cookies pour améliorer votre expérience utilisateur, assurer le bon fonctionnement de la plateforme, 
                  et collecter des statistiques anonymisées sur l'utilisation du service.
                </p>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  2. Types de Cookies Utilisés
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    2.1. Cookies Essentiels (Nécessaires)
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-2">
                    Ces cookies sont absolument nécessaires au fonctionnement de la plateforme. Sans eux, certaines fonctionnalités ne peuvent pas être utilisées.
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li><strong>Cookies d'authentification :</strong> Maintien de votre session de connexion</li>
                    <li><strong>Cookies de sécurité :</strong> Protection contre les attaques CSRF et autres menaces</li>
                    <li><strong>Cookies de préférences :</strong> Sauvegarde de vos préférences (thème sombre/clair, langue)</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed mt-2">
                    <strong>Durée de conservation :</strong> Session (supprimés à la fermeture du navigateur) ou jusqu'à 1 an pour les préférences
                  </p>
                  <p className="text-muted-foreground leading-relaxed font-semibold text-amber-600 dark:text-amber-400">
                    Ces cookies ne peuvent pas être désactivés sans affecter le fonctionnement de la plateforme.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <BarChart className="h-4 w-4" />
                    2.2. Cookies Analytics (Statistiques)
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-2">
                    Ces cookies nous permettent de comprendre comment les visiteurs utilisent la plateforme en collectant des informations de manière anonyme.
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li><strong>Vercel Analytics :</strong> Statistiques de trafic anonymisées (pages visitées, durée de visite, parcours utilisateur)</li>
                    <li><strong>Données collectées :</strong> Toutes les données sont agrégées et anonymisées, aucune donnée personnelle identifiable n'est collectée</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed mt-2">
                    <strong>Durée de conservation :</strong> Maximum 13 mois (conformément aux recommandations CNIL)
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Vous pouvez désactiver ces cookies via les paramètres de votre navigateur (voir section 4).
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>3. Cookies Tiers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  CBD Flower Cup utilise les services suivants qui peuvent déposer des cookies :
                </p>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Vercel Analytics</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Service d'analytics web conforme RGPD, hébergé en Europe. Collecte des statistiques anonymisées sur l'utilisation de la plateforme.
                    </p>
                    <p className="text-muted-foreground leading-relaxed text-sm">
                      <a href="https://vercel.com/analytics" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                        En savoir plus sur Vercel Analytics
                      </a>
                    </p>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Nous ne partageons aucune donnée personnelle avec des tiers à des fins publicitaires ou de marketing.
                </p>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>4. Gestion des Cookies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Vous avez le contrôle sur les cookies. Vous pouvez :
                </p>
                <div>
                  <h3 className="font-semibold mb-2">4.1. Paramètres du Navigateur</h3>
                  <p className="text-muted-foreground leading-relaxed mb-2">
                    La plupart des navigateurs vous permettent de contrôler les cookies via les paramètres de confidentialité :
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li><strong>Chrome :</strong> Paramètres → Confidentialité et sécurité → Cookies et autres données de sites</li>
                    <li><strong>Firefox :</strong> Options → Vie privée et sécurité → Cookies et données de sites</li>
                    <li><strong>Safari :</strong> Préférences → Confidentialité → Cookies et données de sites web</li>
                    <li><strong>Edge :</strong> Paramètres → Cookies et autorisations de site → Cookies et données de sites</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed mt-2">
                    <strong>Attention :</strong> La désactivation des cookies essentiels peut empêcher certaines fonctionnalités de la plateforme de fonctionner correctement.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">4.2. Suppression des Cookies</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Vous pouvez supprimer les cookies déjà stockés sur votre appareil à tout moment via les paramètres de votre navigateur. 
                    Notez que cela peut vous déconnecter de la plateforme et réinitialiser vos préférences.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>5. Consentement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  En utilisant la plateforme CBD Flower Cup, vous acceptez l'utilisation des cookies conformément à cette politique.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Pour les cookies non essentiels (analytics), vous pouvez retirer votre consentement à tout moment via les paramètres de votre navigateur 
                  ou en nous contactant.
                </p>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>6. Cookies et Données Personnelles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Les cookies essentiels (authentification) contiennent des informations nécessaires au fonctionnement de votre compte. 
                  Ces données sont traitées conformément à notre{" "}
                  <a href="/legal/privacy" className="text-accent hover:underline font-semibold">Politique de Confidentialité</a>.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Les cookies analytics ne contiennent pas de données personnelles identifiables et sont entièrement anonymisés.
                </p>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>7. Modifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Cette politique des cookies peut être modifiée à tout moment. Les modifications entrent en vigueur dès leur publication sur cette page. 
                  Nous vous recommandons de consulter régulièrement cette page pour rester informé de notre utilisation des cookies.
                </p>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>8. Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Pour toute question concernant notre utilisation des cookies, vous pouvez nous contacter via la page de contact de la plateforme.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Cookies;

