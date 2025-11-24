import { Button } from "@/components/ui/button";
import { Award, Menu, X, Moon, Sun, User, LogOut, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/use-auth";
import { NotificationBell } from "./NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

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
            {user && profile ? (
              <>
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name} />
                        <AvatarFallback>
                          {profile.display_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{profile.display_name}</p>
                        <p className="text-xs leading-none text-muted-foreground capitalize">
                          {profile.role}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Mon compte
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/favorites" className="cursor-pointer">
                        <Heart className="mr-2 h-4 w-4" />
                        Mes favoris
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="outline" asChild className="border-accent text-accent hover:bg-accent hover:text-accent-foreground transition-all duration-300 hover:scale-105">
                  <Link to="/login">Connexion</Link>
                </Button>
                <Button asChild className="bg-gradient-gold shadow-gold hover:shadow-elegant transition-all duration-300 hover:scale-105">
                  <Link to="/register">S'inscrire</Link>
                </Button>
              </>
            )}
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
                {user && profile ? (
                  <>
                    <div className="flex items-center justify-between w-full p-2">
                      <span className="text-sm font-medium">{profile.display_name}</span>
                      <NotificationBell />
                    </div>
                    <Button variant="outline" asChild className="w-full">
                      <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                        <User className="mr-2 h-4 w-4" />
                        Mon compte
                      </Link>
                    </Button>
                    <Button variant="outline" onClick={handleSignOut} className="w-full">
                      <LogOut className="mr-2 h-4 w-4" />
                      Déconnexion
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" asChild className="w-full border-accent text-accent">
                      <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Connexion</Link>
                    </Button>
                    <Button asChild className="w-full bg-gradient-gold">
                      <Link to="/register" onClick={() => setMobileMenuOpen(false)}>S'inscrire</Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;