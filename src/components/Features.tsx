import { Award, CheckCircle, Shield, TrendingUp, Users, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Features = () => {
  const features = [
    {
      icon: Award,
      title: "Professional Judging",
      description: "Expert judges evaluate based on appearance, density, terpenes, and overall quality with transparent scoring.",
    },
    {
      icon: Shield,
      title: "100% Compliant",
      description: "All entries must meet EU regulations (≤0.3% THC) with mandatory COA certificate verification.",
    },
    {
      icon: Users,
      title: "Public Voting",
      description: "Secure public voting system with anti-fraud measures and verified user accounts.",
    },
    {
      icon: TrendingUp,
      title: "Real-time Rankings",
      description: "Live leaderboards, detailed statistics, and comprehensive performance analytics for all entries.",
    },
    {
      icon: Zap,
      title: "QR Code Integration",
      description: "Each flower gets a unique QR code for instant access to complete profiles and certificates.",
    },
    {
      icon: CheckCircle,
      title: "Badges & Rewards",
      description: "Earn prestigious badges and trophies for outstanding achievements in various categories.",
    },
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-full px-6 py-2 mb-6">
            <Zap className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-foreground">Premium Features</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Everything You Need to
            <span className="block bg-gradient-gold bg-clip-text text-transparent">Compete & Win</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A comprehensive platform designed for serious producers and judges in the CBD industry
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="border-border hover:border-accent/50 hover:shadow-elegant transition-all duration-300 group"
              >
                <CardHeader>
                  <div className="mb-4 inline-flex p-3 bg-gradient-premium rounded-lg shadow-elegant group-hover:shadow-gold transition-all duration-300">
                    <Icon className="h-6 w-6 text-accent" />
                  </div>
                  <CardTitle className="text-xl text-foreground">{feature.title}</CardTitle>
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