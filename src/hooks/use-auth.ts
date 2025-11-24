import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

export interface AuthUser {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupérer la session initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchProfile(session.user);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (user: User) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        // Si le profil n'existe pas, le créer
        if (error.code === "PGRST116") {
          console.log("Profil non trouvé, création en cours...");
          const displayName = user.user_metadata?.display_name || 
                             user.email?.split("@")[0] || 
                             "Utilisateur";
          // Récupérer le rôle depuis les metadata, sinon utiliser "viewer" par défaut
          const role = user.user_metadata?.role || "viewer";
          
          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert({
              id: user.id,
              display_name: displayName,
              role: role as "viewer" | "producer" | "judge" | "organizer",
            })
            .select()
            .single();

          if (createError) {
            console.error("Error creating profile:", createError);
            setProfile(null);
          } else {
            setProfile(newProfile);
          }
        } else {
          console.error("Error fetching profile:", error);
          setProfile(null);
        }
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return {
    user,
    profile,
    loading,
    signOut,
    isAuthenticated: !!user,
  };
}

