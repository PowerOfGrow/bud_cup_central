import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Hook pour mettre à jour les résultats de concours en temps réel
 * Écoute les changements sur :
 * - judge_scores (nouveaux scores, modifications)
 * - public_votes (nouveaux votes, modifications)
 * - entries (changements de statut)
 */
export const useRealtimeResults = (contestId: string | undefined) => {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!contestId) return;

    // Utiliser un Set pour stocker les IDs des entrées (plus efficace pour les recherches)
    const entryIdsSet = new Set<string>();
    
    // Fonction pour charger les IDs d'entrées et configurer les subscriptions
    const setupSubscriptions = async () => {
      // Récupérer les IDs des entrées du concours
      const { data: entriesData } = await supabase
        .from("entries")
        .select("id")
        .eq("contest_id", contestId);

      if (entriesData) {
        entriesData.forEach(e => entryIdsSet.add(e.id));
      }

      // Créer un canal Supabase pour les subscriptions
      const channel = supabase
        .channel(`contest-results:${contestId}`)
        // Écouter les changements sur les entrées du concours
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "entries",
            filter: `contest_id=eq.${contestId}`,
          },
          (payload) => {
            console.log("Entry changed for contest:", payload);
            queryClient.invalidateQueries({ queryKey: ["contest-results", contestId] });
            queryClient.invalidateQueries({ queryKey: ["contest-entries", contestId] });
            
            // Mettre à jour le Set des entryIds
            if (payload.eventType === "INSERT" && payload.new?.id) {
              entryIdsSet.add(payload.new.id);
            } else if (payload.eventType === "DELETE" && payload.old?.id) {
              entryIdsSet.delete(payload.old.id);
            }
          }
        )
        // Écouter tous les changements de scores
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "judge_scores",
          },
          (payload) => {
            // Vérifier si le score appartient à une entrée de ce concours
            const entryId = payload.new?.entry_id || payload.old?.entry_id;
            if (entryId && entryIdsSet.has(entryId)) {
              console.log("Judge score changed for contest entry:", payload);
              queryClient.invalidateQueries({ queryKey: ["contest-results", contestId] });
            }
          }
        )
        // Écouter tous les changements de votes publics
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "public_votes",
          },
          (payload) => {
            // Vérifier si le vote appartient à une entrée de ce concours
            const entryId = payload.new?.entry_id || payload.old?.entry_id;
            if (entryId && entryIdsSet.has(entryId)) {
              console.log("Public vote changed for contest entry:", payload);
              queryClient.invalidateQueries({ queryKey: ["contest-results", contestId] });
              queryClient.invalidateQueries({ queryKey: ["contest-entries", contestId] });
            }
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log(`Subscribed to realtime updates for contest ${contestId}`);
          } else if (status === "CHANNEL_ERROR") {
            console.error("Error subscribing to realtime updates");
          }
        });

      channelRef.current = channel;
    };

    setupSubscriptions();

    // Nettoyer la subscription au démontage
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [contestId, queryClient]);
};

/**
 * Hook pour mettre à jour les entrées d'un concours en temps réel
 * Utile pour la page Contests.tsx qui affiche la liste des entrées
 */
export const useRealtimeEntries = (contestId: string | undefined) => {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!contestId) return;

    // Utiliser un Set pour stocker les IDs des entrées (plus efficace)
    const entryIdsSet = new Set<string>();

    const setupSubscriptions = async () => {
      // Récupérer les IDs des entrées du concours
      const { data: entriesData } = await supabase
        .from("entries")
        .select("id")
        .eq("contest_id", contestId);

      if (entriesData) {
        entriesData.forEach(e => entryIdsSet.add(e.id));
      }

      const channel = supabase
        .channel(`contest-entries:${contestId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "entries",
            filter: `contest_id=eq.${contestId}`,
          },
          (payload) => {
            console.log("Entry changed:", payload);
            queryClient.invalidateQueries({ queryKey: ["contest-entries", contestId] });
            
            if (payload.eventType === "INSERT" && payload.new?.id) {
              entryIdsSet.add(payload.new.id);
            } else if (payload.eventType === "DELETE" && payload.old?.id) {
              entryIdsSet.delete(payload.old.id);
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "public_votes",
          },
          (payload) => {
            const entryId = payload.new?.entry_id || payload.old?.entry_id;
            if (entryId && entryIdsSet.has(entryId)) {
              console.log("Vote changed for entries:", payload);
              queryClient.invalidateQueries({ queryKey: ["contest-entries", contestId] });
            }
          }
        )
        .subscribe();

      channelRef.current = channel;
    };

    setupSubscriptions();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [contestId, queryClient]);
};

