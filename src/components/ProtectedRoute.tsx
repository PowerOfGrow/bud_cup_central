import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { ReactNode, useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "organizer" | "producer" | "judge" | "viewer";
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();
  const [profileCreationTimeout, setProfileCreationTimeout] = useState(false);

  // Timeout pour la création du profil (5 secondes max)
  useEffect(() => {
    if (user && !profile && !loading) {
      const timer = setTimeout(() => {
        setProfileCreationTimeout(true);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setProfileCreationTimeout(false);
    }
  }, [user, profile, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si l'utilisateur est connecté mais le profil n'existe pas encore, attendre un peu
  if (user && !profile && !loading) {
    // Si le timeout est atteint, rediriger vers login
    if (profileCreationTimeout) {
      return <Navigate to="/login" replace />;
    }
    // Le profil devrait être créé automatiquement par useAuth
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Création du profil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    // Si après un délai raisonnable le profil n'existe toujours pas, rediriger vers login
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && profile.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Accès refusé</h1>
          <p className="text-muted-foreground mb-4">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
          <p className="text-sm text-muted-foreground">
            Rôle requis : {requiredRole} | Votre rôle : {profile.role}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

