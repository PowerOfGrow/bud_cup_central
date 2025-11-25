import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Award, Shield, Users, TrendingUp, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="pt-28 pb-16 flex-1">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                À propos de CBD Flower Cup
              </h1>
              <p className="text-lg text-muted-foreground">
                La plateforme de référence pour les compétitions de fleurs CBD en Europe
              </p>
            </div>

            <div className="space-y-8 mb-12">
              <Card>
                <CardHeader>
                  <CardTitle>Notre Mission</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    CBD Flower Cup est une plateforme dédiée à la promotion de l'excellence dans la production de fleurs CBD. 
                    Nous réunissons producteurs, jurés experts et passionnés pour créer un environnement professionnel et conforme 
                    aux réglementations européennes.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Nos Valeurs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-3">
                      <Shield className="h-6 w-6 text-accent mt-1" />
                      <div>
                        <h3 className="font-semibold mb-1">Conformité</h3>
                        <p className="text-sm text-muted-foreground">
                          Toutes les entrées respectent les réglementations UE (≤0,3% THC)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Award className="h-6 w-6 text-accent mt-1" />
                      <div>
                        <h3 className="font-semibold mb-1">Excellence</h3>
                        <p className="text-sm text-muted-foreground">
                          Notation professionnelle par des jurés experts reconnus
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Users className="h-6 w-6 text-accent mt-1" />
                      <div>
                        <h3 className="font-semibold mb-1">Communauté</h3>
                        <p className="text-sm text-muted-foreground">
                          Vote public sécurisé et système anti-fraude
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <TrendingUp className="h-6 w-6 text-accent mt-1" />
                      <div>
                        <h3 className="font-semibold mb-1">Transparence</h3>
                        <p className="text-sm text-muted-foreground">
                          Classements en temps réel et statistiques détaillées
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Organisé par Gard Eau Arbres</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    Cette plateforme est développée et maintenue par l'association Gard Eau Arbres, 
                    engagée dans la promotion d'une agriculture durable et responsable.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Disclaimer */}
            <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="font-bold text-amber-900 dark:text-amber-100">
                Avertissement Légal
              </AlertTitle>
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                Cette plateforme est destinée exclusivement aux produits CBD conformes à la réglementation européenne (THC ≤ 0,3%). 
                L'accès est réservé aux personnes majeures. Aucune allégation de santé ou thérapeutique n'est faite concernant les produits présentés. 
                Pour plus d'informations, consultez nos{" "}
                <Link to="/legal/disclaimer" className="text-accent hover:underline font-semibold">
                  Avertissements Légaux
                </Link>.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default About;

