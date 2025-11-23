import { Award, CheckCircle, Shield, TrendingUp, Users, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Features = () => {
  const features = [
    {
      icon: Award,
      title: "Notation Professionnelle",
      description: "Des jurés experts évaluent l'apparence, la densité, les terpènes et la qualité globale avec un système de notation transparent.",
    },
    {
      icon: Shield,
      title: "100% Conforme",
      description: "Toutes les entrées doivent respecter les réglementations UE (≤0,3% THC) avec vérification obligatoire du certificat COA.",
    },
    {
      icon: Users,
      title: "Vote Public",
      description: "Système de vote public sécurisé avec mesures anti-fraude et comptes utilisateurs vérifiés.",
    },
    {
      icon: TrendingUp,
      title: "Classements en Temps Réel",
      description: "Tableaux de bord en direct, statistiques détaillées et analyses complètes des performances pour toutes les entrées.",
    },
    {
      icon: Zap,
      title: "Intégration QR Code",
      description: "Chaque fleur dispose d'un QR code unique pour un accès instantané aux profils complets et certificats.",
    },
    {
      icon: CheckCircle,
      title: "Badges & Récompenses",
      description: "Gagnez des badges prestigieux et des trophées pour des réalisations exceptionnelles dans diverses catégories.",
    },
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-full px-6 py-2 mb-6 hover:border-accent/50 hover:scale-105 transition-all duration-300 cursor-pointer">
            <Zap className="h-4 w-4 text-accent animate-pulse" />
            <span className="text-sm font-medium text-foreground">Fonctionnalités Premium</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Tout ce Dont Vous Avez Besoin pour
            <span className="block bg-gradient-gold bg-clip-text text-transparent">Concourir & Gagner</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Une plateforme complète conçue pour les producteurs et jurés sérieux de l'industrie du CBD
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="border-border hover:border-accent/50 hover:shadow-elegant transition-all duration-500 group hover:scale-105 cursor-pointer bg-card/50 backdrop-blur-sm"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: "fade-in 0.6s ease-out forwards",
                }}
              >
                <CardHeader>
                  <div className="mb-4 inline-flex p-3 bg-gradient-premium rounded-lg shadow-elegant group-hover:shadow-gold transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
                    <Icon className="h-6 w-6 text-accent group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <CardTitle className="text-xl text-foreground group-hover:text-accent transition-colors duration-300">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;