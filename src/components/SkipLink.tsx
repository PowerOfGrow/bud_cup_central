import { Link } from "react-router-dom";

/**
 * Composant SkipLink pour améliorer l'accessibilité
 * Permet aux utilisateurs de clavier de sauter directement au contenu principal
 */
export const SkipLink = () => {
  return (
    <Link
      to="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-accent focus:text-accent-foreground focus:rounded-md focus:font-medium focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
      onClick={(e) => {
        e.preventDefault();
        const mainContent = document.getElementById("main-content");
        if (mainContent) {
          mainContent.focus();
          mainContent.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }}
    >
      Aller au contenu principal
    </Link>
  );
};

