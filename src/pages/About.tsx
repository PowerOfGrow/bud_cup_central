import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Shield, Users, TrendingUp } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="pt-28 pb-16">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;

