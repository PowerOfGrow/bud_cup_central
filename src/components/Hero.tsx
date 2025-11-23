import { Button } from "@/components/ui/button";
import { Award, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-premium opacity-90" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI0NCQTEzNSIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-20" />
      
      {/* Animated floating elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-accent/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-accent/10 backdrop-blur-sm border border-accent/30 rounded-full px-6 py-2 mb-8 animate-fade-in hover:border-accent/50 hover:scale-105 transition-all duration-300 cursor-pointer group">
            <Award className="h-4 w-4 text-accent animate-pulse" />
            <span className="text-sm font-medium text-primary-foreground">Plateforme de Compétition CBD Premium</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold text-primary-foreground mb-6 leading-tight animate-fade-in delay-200">
            Mettez en Valeur Vos
            <span className="block bg-gradient-gold bg-clip-text text-transparent animate-fade-in delay-300">
              Fleurs CBD Premium
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-primary-foreground/80 mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in delay-500">
            Rejoignez la compétition de fleurs CBD la plus prestigieuse d'Europe. Connectez-vous avec des producteurs, des jurés et des passionnés dans un environnement professionnel et conforme.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in delay-700">
            <Button 
              size="lg" 
              asChild
              className="bg-gradient-gold shadow-gold hover:shadow-elegant transition-all duration-300 text-lg px-8 py-6 hover:scale-105 group"
            >
              <Link to="/register">
                <Award className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                Participer au Concours
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              asChild
              className="border-accent text-primary-foreground hover:bg-accent/10 text-lg px-8 py-6 hover:scale-105 transition-all duration-300"
            >
              <Link to="/contests">Voir les Concours</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="bg-card/10 backdrop-blur-sm border border-accent/20 rounded-xl p-6 hover:shadow-gold transition-all duration-500 hover:scale-110 hover:border-accent/50 group cursor-pointer">
              <Award className="h-8 w-8 text-accent mx-auto mb-3 group-hover:rotate-12 transition-transform duration-300" />
              <div className="text-3xl font-bold text-primary-foreground mb-1 bg-gradient-gold bg-clip-text text-transparent">500+</div>
              <div className="text-sm text-primary-foreground/70">Entrées Jugées</div>
            </div>
            <div className="bg-card/10 backdrop-blur-sm border border-accent/20 rounded-xl p-6 hover:shadow-gold transition-all duration-500 hover:scale-110 hover:border-accent/50 group cursor-pointer">
              <Users className="h-8 w-8 text-accent mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" />
              <div className="text-3xl font-bold text-primary-foreground mb-1 bg-gradient-gold bg-clip-text text-transparent">200+</div>
              <div className="text-sm text-primary-foreground/70">Producteurs</div>
            </div>
            <div className="bg-card/10 backdrop-blur-sm border border-accent/20 rounded-xl p-6 hover:shadow-gold transition-all duration-500 hover:scale-110 hover:border-accent/50 group cursor-pointer">
              <TrendingUp className="h-8 w-8 text-accent mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" />
              <div className="text-3xl font-bold text-primary-foreground mb-1 bg-gradient-gold bg-clip-text text-transparent">50+</div>
              <div className="text-sm text-primary-foreground/70">Jurés Experts</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;