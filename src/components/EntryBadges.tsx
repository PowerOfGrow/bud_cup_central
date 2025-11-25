import { Badge } from "@/components/ui/badge";
import { Award, Trophy, Medal, Heart, Sparkles, Shield, Star } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type BadgeType = Database["public"]["Enums"]["badge_type"];

interface EntryBadge {
  id: string;
  badge: BadgeType;
  label: string;
  description: string | null;
}

interface EntryBadgesProps {
  badges: EntryBadge[];
  className?: string;
}

const badgeConfig: Record<
  BadgeType,
  { icon: typeof Award; color: string; label: string }
> = {
  gold: {
    icon: Trophy,
    color: "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white",
    label: "Or",
  },
  silver: {
    icon: Medal,
    color: "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-900",
    label: "Argent",
  },
  bronze: {
    icon: Medal,
    color: "bg-gradient-to-r from-amber-600 to-amber-700 text-white",
    label: "Bronze",
  },
  people_choice: {
    icon: Heart,
    color: "bg-gradient-to-r from-pink-500 to-rose-500 text-white",
    label: "Choix du public",
  },
  innovation: {
    icon: Sparkles,
    color: "bg-gradient-to-r from-purple-500 to-indigo-500 text-white",
    label: "Innovation",
  },
  terpene: {
    icon: Star,
    color: "bg-gradient-to-r from-cyan-500 to-blue-500 text-white",
    label: "Meilleur terpène",
  },
  compliance: {
    icon: Shield,
    color: "bg-gradient-to-r from-green-500 to-emerald-500 text-white",
    label: "Conformité",
  },
};

export const EntryBadges = ({ badges, className = "" }: EntryBadgesProps) => {
  if (!badges || badges.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {badges.map((badge) => {
        const config = badgeConfig[badge.badge];
        const Icon = config.icon;

        return (
          <Badge
            key={badge.id}
            className={`${config.color} px-3 py-1 flex items-center gap-1.5`}
            title={badge.description || badge.label}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{badge.label}</span>
          </Badge>
        );
      })}
    </div>
  );
};

