import { Link } from "react-router-dom";
import { Award, Mail } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background/80 backdrop-blur-md" role="contentinfo">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo et Description */}
          <div className="col-span-1 md:col-span-2">
            <Link 
              to="/" 
              className="flex items-center gap-3 mb-4 group"
              aria-label="Retour à l'accueil"
            >
              <div className="bg-gradient-premium p-2 rounded-lg shadow-elegant">
                <Award className="h-6 w-6 text-accent" />
              </div>
              <span className="text-xl font-bold text-foreground">CBD Flower Cup</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
              La plateforme de référence pour les compétitions de fleurs CBD en Europe. 
              Organisée par l'association Gard Eau Arbres.
            </p>
            <p className="text-xs text-muted-foreground">
              © {currentYear} Gard Eau Arbres. Tous droits réservés.
            </p>
          </div>

          {/* Liens Utiles */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/" 
                  className="text-sm text-muted-foreground hover:text-accent transition-colors"
                >
                  Accueil
                </Link>
              </li>
              <li>
                <Link 
                  to="/contests" 
                  className="text-sm text-muted-foreground hover:text-accent transition-colors"
                >
                  Concours
                </Link>
              </li>
              <li>
                <Link 
                  to="/about" 
                  className="text-sm text-muted-foreground hover:text-accent transition-colors"
                >
                  À propos
                </Link>
              </li>
            </ul>
          </div>

          {/* Liens Légaux */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Informations Légales</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/legal/terms" 
                  className="text-sm text-muted-foreground hover:text-accent transition-colors"
                >
                  Conditions Générales d'Utilisation
                </Link>
              </li>
              <li>
                <Link 
                  to="/legal/privacy" 
                  className="text-sm text-muted-foreground hover:text-accent transition-colors"
                >
                  Politique de Confidentialité
                </Link>
              </li>
              <li>
                <Link 
                  to="/legal/disclaimer" 
                  className="text-sm text-muted-foreground hover:text-accent transition-colors"
                >
                  Avertissements Légaux
                </Link>
              </li>
              <li>
                <Link 
                  to="/legal/cookies" 
                  className="text-sm text-muted-foreground hover:text-accent transition-colors"
                >
                  Politique des Cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Séparateur */}
        <div className="border-t border-border mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted-foreground text-center md:text-left">
              Conforme RGPD • Hébergé en Europe • Données sécurisées
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>Contact via la plateforme</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

