import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Header from "@/components/Header";

/**
 * Page de callback pour la confirmation d'email et autres authentifications
 * Gère les tokens dans l'URL (#access_token, #refresh_token, etc.)
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Vérifier si on a un hash avec des tokens (format Supabase)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const error = hashParams.get("error");
        const errorDescription = hashParams.get("error_description");

        // Si erreur dans l'URL
        if (error) {
          console.error("Erreur d'authentification:", error, errorDescription);
          toast.error(errorDescription || "Erreur lors de la confirmation de l'email");
          navigate("/login", { replace: true });
          return;
        }

        // Si on a des tokens dans l'URL
        if (accessToken) {
          // Définir la session avec les tokens
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || "",
          });

          if (sessionError) {
            console.error("Erreur lors de la définition de la session:", sessionError);
            toast.error("Erreur lors de la confirmation de votre compte. Veuillez réessayer.");
            navigate("/login", { replace: true });
            return;
          }

          // Vérifier et corriger le rôle du profil si nécessaire
          if (data.user) {
            const expectedRole = data.user.user_metadata?.role;
            if (expectedRole) {
              // Vérifier que le profil existe et a le bon rôle
              const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", data.user.id)
                .single();

              if (!profileError && profile && profile.role !== expectedRole) {
                // Mettre à jour le rôle du profil
                console.log(`Correction du rôle: ${profile.role} -> ${expectedRole}`);
                const { error: updateError } = await supabase
                  .from("profiles")
                  .update({ role: expectedRole })
                  .eq("id", data.user.id);

                if (updateError) {
                  console.error("Erreur lors de la mise à jour du rôle:", updateError);
                } else {
                  console.log("Rôle corrigé avec succès");
                }
              }
            }
          }

          // Vérifier le type d'événement
          const type = hashParams.get("type");
          
          if (type === "signup") {
            toast.success("Email confirmé avec succès ! Redirection vers le dashboard...");
          } else if (type === "recovery") {
            toast.success("Lien de réinitialisation validé. Vous pouvez maintenant changer votre mot de passe.");
            navigate("/reset-password", { replace: true });
            return;
          } else {
            toast.success("Authentification réussie !");
          }

          // Attendre un peu pour que le profil soit chargé/mis à jour
          await new Promise((resolve) => setTimeout(resolve, 1500));

          // Rediriger vers le dashboard
          navigate("/dashboard", { replace: true });
        } else {
          // Pas de tokens dans l'URL, vérifier si on est déjà authentifié
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            navigate("/dashboard", { replace: true });
          } else {
            navigate("/login", { replace: true });
          }
        }
      } catch (error: any) {
        console.error("Erreur lors du traitement du callback:", error);
        toast.error("Une erreur est survenue. Veuillez réessayer de vous connecter.");
        navigate("/login", { replace: true });
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold mb-2">Confirmation en cours...</h1>
          <p className="text-muted-foreground">
            Veuillez patienter pendant que nous confirmons votre email.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;

