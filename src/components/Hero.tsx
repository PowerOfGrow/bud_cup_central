import { Button } from "@/components/ui/button";
import { Award, TrendingUp, Users } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-premium opacity-90" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI0NCQTEzNSIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-20" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-accent/10 backdrop-blur-sm border border-accent/30 rounded-full px-6 py-2 mb-8 animate-fade-in">
            <Award className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-primary-foreground">Premium CBD Competition Platform</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold text-primary-foreground mb-6 leading-tight">
            Showcase Your
            <span className="block bg-gradient-gold bg-clip-text text-transparent">
              Premium CBD Flowers
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-primary-foreground/80 mb-12 max-w-2xl mx-auto leading-relaxed">
            Join Europe's most prestigious CBD flower competition. Connect with producers, judges, and enthusiasts in a compliant, professional environment.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button 
              size="lg" 
              className="bg-gradient-gold shadow-gold hover:shadow-elegant transition-all duration-300 text-lg px-8 py-6"
            >
              Enter Competition
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-accent text-primary-foreground hover:bg-accent/10 text-lg px-8 py-6"
            >
              View Contests
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="bg-card/10 backdrop-blur-sm border border-accent/20 rounded-xl p-6 hover:shadow-gold transition-all duration-300">
              <Award className="h-8 w-8 text-accent mx-auto mb-3" />
              <div className="text-3xl font-bold text-primary-foreground mb-1">500+</div>
              <div className="text-sm text-primary-foreground/70">Entries Judged</div>
            </div>
            <div className="bg-card/10 backdrop-blur-sm border border-accent/20 rounded-xl p-6 hover:shadow-gold transition-all duration-300">
              <Users className="h-8 w-8 text-accent mx-auto mb-3" />
              <div className="text-3xl font-bold text-primary-foreground mb-1">200+</div>
              <div className="text-sm text-primary-foreground/70">Producers</div>
            </div>
            <div className="bg-card/10 backdrop-blur-sm border border-accent/20 rounded-xl p-6 hover:shadow-gold transition-all duration-300">
              <TrendingUp className="h-8 w-8 text-accent mx-auto mb-3" />
              <div className="text-3xl font-bold text-primary-foreground mb-1">50+</div>
              <div className="text-sm text-primary-foreground/70">Expert Judges</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;