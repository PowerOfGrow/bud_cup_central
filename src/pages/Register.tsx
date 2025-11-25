import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/use-auth";

type UserRole = "viewer" | "producer" | "judge" | "organizer";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("viewer");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();

  // Rediriger si déjà connecté
  useEffect(() => {
    if (!authLoading && user && profile) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, profile, authLoading, navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !displayName) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    if (password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setLoading(true);

    try {
      console.log("Tentative d'inscription pour:", email, "avec le rôle:", role);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            role: role,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?type=signup`,
        },
      });

      if (error) {
        console.error("Erreur Supabase:", error);
        throw error;
      }

      console.log("Inscription réussie:", data);
      
      // Si l'utilisateur est automatiquement connecté (email confirmation désactivée)
      if (data.user && data.session) {
        toast.success("Inscription réussie ! Redirection vers le dashboard...");
        // Attendre un peu pour que le profil soit créé
        await new Promise(resolve => setTimeout(resolve, 1000));
        navigate("/dashboard", { replace: true });
      } else {
        toast.success("Inscription réussie ! Vérifiez votre email pour confirmer votre compte.");
        // Attendre un peu avant de rediriger pour que l'utilisateur voie le message
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (error: any) {
      console.error("Erreur lors de l'inscription:", error);
      const errorMessage = error?.message || "Erreur lors de l'inscription. Vérifiez vos informations.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Afficher un loader pendant la vérification de l'authentification
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="pt-28 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Inscription</CardTitle>
                <CardDescription>
                  Créez votre compte pour participer aux concours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Nom d'affichage</Label>
                    <Input
                      id="displayName"
                      type="text"
                      placeholder="Votre nom"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Type de compte</Label>
                    <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Sélectionnez votre type de compte" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Membre gratuit</SelectItem>
                        <SelectItem value="producer">Producteur</SelectItem>
                        <SelectItem value="judge">Juge</SelectItem>
                        <SelectItem value="organizer">Organisateur</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {role === "viewer" && "Accès gratuit pour voter et découvrir les concours"}
                      {role === "producer" && "Soumettez vos fleurs CBD aux concours"}
                      {role === "judge" && "Évaluez les entrées en tant qu'expert"}
                      {role === "organizer" && "Créez et gérez des concours"}
                    </p>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading || !email || !password || !displayName}
                  >
                    {loading ? "Inscription en cours..." : "S'inscrire"}
                  </Button>
                </form>
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  Déjà un compte ?{" "}
                  <Link to="/login" className="text-accent hover:underline">
                    Se connecter
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

