export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      contests: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          featured_image_url: string | null
          id: string
          location: string | null
          name: string
          prize_pool: number | null
          registration_close_date: string | null
          rules_url: string | null
          slug: string
          start_date: string | null
          status: Database["public"]["Enums"]["contest_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          featured_image_url?: string | null
          id?: string
          location?: string | null
          name: string
          prize_pool?: number | null
          registration_close_date?: string | null
          rules_url?: string | null
          slug: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["contest_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          featured_image_url?: string | null
          id?: string
          location?: string | null
          name?: string
          prize_pool?: number | null
          registration_close_date?: string | null
          rules_url?: string | null
          slug?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["contest_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contests_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      contest_judges: {
        Row: {
          contest_id: string
          created_at: string
          id: number
          invitation_status: string
          judge_id: string
          judge_role: string
        }
        Insert: {
          contest_id: string
          created_at?: string
          id?: number
          invitation_status?: string
          judge_id: string
          judge_role?: string
        }
        Update: {
          contest_id?: string
          created_at?: string
          id?: number
          invitation_status?: string
          judge_id?: string
          judge_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_judges_contest_id_fkey"
            columns: ["contest_id"]
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contest_judges_judge_id_fkey"
            columns: ["judge_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      entries: {
        Row: {
          batch_code: string | null
          cbd_percent: number | null
          category: Database["public"]["Enums"]["entry_category"]
          coa_url: string | null
          contest_id: string
          created_at: string
          cultivar: string | null
          id: string
          photo_url: string | null
          producer_id: string
          qr_code_url: string | null
          status: Database["public"]["Enums"]["entry_status"]
          strain_name: string
          submission_notes: string | null
          terpene_profile: string | null
          thc_percent: number | null
          updated_at: string
        }
        Insert: {
          batch_code?: string | null
          cbd_percent?: number | null
          category?: Database["public"]["Enums"]["entry_category"]
          coa_url?: string | null
          contest_id: string
          created_at?: string
          cultivar?: string | null
          id?: string
          photo_url?: string | null
          producer_id: string
          qr_code_url?: string | null
          status?: Database["public"]["Enums"]["entry_status"]
          strain_name: string
          submission_notes?: string | null
          terpene_profile?: string | null
          thc_percent?: number | null
          updated_at?: string
        }
        Update: {
          batch_code?: string | null
          cbd_percent?: number | null
          category?: Database["public"]["Enums"]["entry_category"]
          coa_url?: string | null
          contest_id?: string
          created_at?: string
          cultivar?: string | null
          id?: string
          photo_url?: string | null
          producer_id?: string
          qr_code_url?: string | null
          status?: Database["public"]["Enums"]["entry_status"]
          strain_name?: string
          submission_notes?: string | null
          terpene_profile?: string | null
          thc_percent?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entries_contest_id_fkey"
            columns: ["contest_id"]
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entries_producer_id_fkey"
            columns: ["producer_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      entry_badges: {
        Row: {
          awarded_at: string
          badge: Database["public"]["Enums"]["badge_type"]
          description: string | null
          entry_id: string
          id: string
          label: string
        }
        Insert: {
          awarded_at?: string
          badge: Database["public"]["Enums"]["badge_type"]
          description?: string | null
          entry_id: string
          id?: string
          label: string
        }
        Update: {
          awarded_at?: string
          badge?: Database["public"]["Enums"]["badge_type"]
          description?: string | null
          entry_id?: string
          id?: string
          label?: string
        }
        Relationships: [
          {
            foreignKeyName: "entry_badges_entry_id_fkey"
            columns: ["entry_id"]
            referencedRelation: "entries"
            referencedColumns: ["id"]
          }
        ]
      }
      entry_documents: {
        Row: {
          created_at: string
          document_type: Database["public"]["Enums"]["document_type"]
          entry_id: string
          id: string
          label: string | null
          storage_path: string
        }
        Insert: {
          created_at?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          entry_id: string
          id?: string
          label?: string | null
          storage_path: string
        }
        Update: {
          created_at?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          entry_id?: string
          id?: string
          label?: string | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "entry_documents_entry_id_fkey"
            columns: ["entry_id"]
            referencedRelation: "entries"
            referencedColumns: ["id"]
          }
        ]
      }
      judge_scores: {
        Row: {
          appearance_score: number
          aroma_score: number
          created_at: string
          effect_score: number
          entry_id: string
          id: string
          judge_id: string
          notes: string | null
          overall_score: number
          taste_score: number
        }
        Insert: {
          appearance_score: number
          aroma_score: number
          created_at?: string
          effect_score: number
          entry_id: string
          id?: string
          judge_id: string
          notes?: string | null
          overall_score: number
          taste_score: number
        }
        Update: {
          appearance_score?: number
          aroma_score?: number
          created_at?: string
          effect_score?: number
          entry_id?: string
          id?: string
          judge_id?: string
          notes?: string | null
          overall_score?: number
          taste_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "judge_scores_entry_id_fkey"
            columns: ["entry_id"]
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "judge_scores_judge_id_fkey"
            columns: ["judge_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          country: string | null
          created_at: string
          display_name: string
          id: string
          is_verified: boolean
          organization: string | null
          role: Database["public"]["Enums"]["profile_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string
          display_name: string
          id: string
          is_verified?: boolean
          organization?: string | null
          role?: Database["public"]["Enums"]["profile_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_verified?: boolean
          organization?: string | null
          role?: Database["public"]["Enums"]["profile_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      public_votes: {
        Row: {
          comment: string | null
          created_at: string
          entry_id: string
          id: string
          score: number
          voter_profile_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          entry_id: string
          id?: string
          score: number
          voter_profile_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          entry_id?: string
          id?: string
          score?: number
          voter_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_votes_entry_id_fkey"
            columns: ["entry_id"]
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_votes_voter_profile_id_fkey"
            columns: ["voter_profile_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      badge_type: "gold" | "silver" | "bronze" | "people_choice" | "innovation" | "terpene" | "compliance"
      contest_status: "draft" | "registration" | "judging" | "completed" | "archived"
      document_type: "coa" | "photo" | "lab_report" | "marketing" | "other"
      entry_category: "indica" | "sativa" | "hybrid" | "outdoor" | "hash" | "other"
      entry_status: "draft" | "submitted" | "under_review" | "approved" | "rejected" | "disqualified" | "archived"
      profile_role: "organizer" | "producer" | "judge" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] & Database["public"]["Views"]) | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] & Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] & Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : Database["public"]["Tables"][PublicTableNameOrOptions] extends { Row: infer R }
    ? R
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends keyof Database["public"]["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends { Insert: infer I }
    ? I
    : never
  : Database["public"]["Tables"][PublicTableNameOrOptions] extends { Insert: infer I }
    ? I
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof Database["public"]["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends { Update: infer U }
    ? U
    : never
  : Database["public"]["Tables"][PublicTableNameOrOptions] extends { Update: infer U }
    ? U
    : never

export type Enums<
  PublicEnumNameOrOptions extends keyof Database["public"]["Enums"] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : Database["public"]["Enums"][PublicEnumNameOrOptions]
