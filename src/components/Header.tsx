import { Button } from "@/components/ui/button";
import { Award, Menu, X, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "next-themes";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="bg-gradient-premium p-2 rounded-lg shadow-elegant group-hover:shadow-gold transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
              <Award className="h-8 w-8 text-accent transition-transform duration-300" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground group-hover:text-accent transition-colors duration-300">CBD Flower Cup</h1>
              <p className="text-xs text-muted-foreground">Plateforme de Compétition Premium</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-foreground hover:text-accent transition-all duration-300 hover:scale-110 font-medium relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-accent after:transition-all after:duration-300 hover:after:w-full">
              Accueil
            </Link>
            <Link to="/contests" className="text-foreground hover:text-accent transition-all duration-300 hover:scale-110 font-medium relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-accent after:transition-all after:duration-300 hover:after:w-full">
              Concours
            </Link>
            <Link to="/about" className="text-foreground hover:text-accent transition-all duration-300 hover:scale-110 font-medium relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-accent after:transition-all after:duration-300 hover:after:w-full">
              À propos
            </Link>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="transition-all duration-300 hover:scale-110 hover:rotate-12"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5 text-accent" />
                ) : (
                  <Moon className="h-5 w-5 text-accent" />
                )}
              </Button>
            )}
            <Button variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground transition-all duration-300 hover:scale-105">
              Connexion
            </Button>
            <Button className="bg-gradient-gold shadow-gold hover:shadow-elegant transition-all duration-300 hover:scale-105">
              S'inscrire
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-foreground"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <nav className="flex flex-col gap-4">
              <Link 
                to="/" 
                className="text-foreground hover:text-accent transition-colors font-medium py-2 hover:pl-2 transition-all duration-300"
                onClick={() => setMobileMenuOpen(false)}
              >
                Accueil
              </Link>
              <Link 
                to="/contests" 
                className="text-foreground hover:text-accent transition-colors font-medium py-2 hover:pl-2 transition-all duration-300"
                onClick={() => setMobileMenuOpen(false)}
              >
                Concours
              </Link>
              <Link 
                to="/about" 
                className="text-foreground hover:text-accent transition-colors font-medium py-2 hover:pl-2 transition-all duration-300"
                onClick={() => setMobileMenuOpen(false)}
              >
                À propos
              </Link>
              <div className="flex flex-col gap-3 pt-4 border-t border-border">
                {mounted && (
                  <Button
                    variant="outline"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="w-full gap-2"
                  >
                    {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    {theme === "dark" ? "Mode Clair" : "Mode Sombre"}
                  </Button>
                )}
                <Button variant="outline" className="w-full border-accent text-accent">
                  Connexion
                </Button>
                <Button className="w-full bg-gradient-gold">
                  S'inscrire
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;