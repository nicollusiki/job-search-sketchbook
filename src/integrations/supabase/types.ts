export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      cv_answers: {
        Row: {
          ai_filled: boolean
          completed: boolean
          current_step: number
          data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_filled?: boolean
          completed?: boolean
          current_step?: number
          data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_filled?: boolean
          completed?: boolean
          current_step?: number
          data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      job_matches: {
        Row: {
          created_at: string
          cv_version: string
          job_id: string
          model: string
          reason: string
          score: number
          user_id: string
        }
        Insert: {
          created_at?: string
          cv_version: string
          job_id: string
          model: string
          reason: string
          score: number
          user_id: string
        }
        Update: {
          created_at?: string
          cv_version?: string
          job_id?: string
          model?: string
          reason?: string
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_matches_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          city: string
          company: string
          contract_type: string
          description: string
          id: string
          is_sample: boolean
          languages: string[]
          pay_max: number
          pay_min: number
          pay_period: string
          posted_at: string
          remote: string
          role: string
          skills: string[]
          source_name: string
          source_url: string
        }
        Insert: {
          city: string
          company: string
          contract_type: string
          description: string
          id?: string
          is_sample?: boolean
          languages?: string[]
          pay_max: number
          pay_min: number
          pay_period?: string
          posted_at?: string
          remote: string
          role: string
          skills?: string[]
          source_name: string
          source_url: string
        }
        Update: {
          city?: string
          company?: string
          contract_type?: string
          description?: string
          id?: string
          is_sample?: boolean
          languages?: string[]
          pay_max?: number
          pay_min?: number
          pay_period?: string
          posted_at?: string
          remote?: string
          role?: string
          skills?: string[]
          source_name?: string
          source_url?: string
        }
        Relationships: []
      }
      kyc_attempts: {
        Row: {
          created_at: string
          id: string
          passed: boolean
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          passed: boolean
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          passed?: boolean
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          date_of_birth: string
          first_name: string
          id: string
          last_name: string
          location: string
          phone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_of_birth: string
          first_name?: string
          id: string
          last_name?: string
          location?: string
          phone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string
          first_name?: string
          id?: string
          last_name?: string
          location?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      rate_events: {
        Row: {
          action: string
          created_at: string
          id: number
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: number
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: number
          user_id?: string
        }
        Relationships: []
      }
      rejections: {
        Row: {
          company: string
          created_at: string
          id: string
          note: string | null
          reason: string | null
          rejected_on: string
          role: string
          stage_at: string
          user_id: string
          user_job_id: string | null
        }
        Insert: {
          company: string
          created_at?: string
          id?: string
          note?: string | null
          reason?: string | null
          rejected_on?: string
          role: string
          stage_at: string
          user_id: string
          user_job_id?: string | null
        }
        Update: {
          company?: string
          created_at?: string
          id?: string
          note?: string | null
          reason?: string | null
          rejected_on?: string
          role?: string
          stage_at?: string
          user_id?: string
          user_job_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rejections_user_job_id_fkey"
            columns: ["user_job_id"]
            isOneToOne: false
            referencedRelation: "user_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      review_reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_reports_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string
          contract_type: string
          created_at: string
          description: string
          id: string
          is_sample: boolean
          job_id: string
          job_title: string
          learning: number
          location: string
          management: number
          moderation_reason: string | null
          months_worked: number
          overall: number
          pay_fairness: number
          proof_path: string | null
          recommend: boolean
          status: string
          user_id: string | null
          workload: number
          year: number
        }
        Insert: {
          comment: string
          contract_type: string
          created_at?: string
          description?: string
          id?: string
          is_sample?: boolean
          job_id: string
          job_title: string
          learning: number
          location?: string
          management: number
          moderation_reason?: string | null
          months_worked: number
          overall: number
          pay_fairness: number
          proof_path?: string | null
          recommend: boolean
          status?: string
          user_id?: string | null
          workload: number
          year: number
        }
        Update: {
          comment?: string
          contract_type?: string
          created_at?: string
          description?: string
          id?: string
          is_sample?: boolean
          job_id?: string
          job_title?: string
          learning?: number
          location?: string
          management?: number
          moderation_reason?: string | null
          months_worked?: number
          overall?: number
          pay_fairness?: number
          proof_path?: string | null
          recommend?: boolean
          status?: string
          user_id?: string | null
          workload?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_jobs: {
        Row: {
          created_at: string
          external_company: string | null
          external_role: string | null
          id: string
          job_id: string | null
          stage: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          external_company?: string | null
          external_role?: string | null
          id?: string
          job_id?: string | null
          stage: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          external_company?: string | null
          external_role?: string | null
          id?: string
          job_id?: string | null
          stage?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_jobs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      verifications: {
        Row: {
          dob_match: boolean | null
          name_match: boolean | null
          over_18: boolean | null
          provider_ref: string | null
          status: string
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          dob_match?: boolean | null
          name_match?: boolean | null
          over_18?: boolean | null
          provider_ref?: string | null
          status?: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          dob_match?: boolean | null
          name_match?: boolean | null
          over_18?: boolean | null
          provider_ref?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_job_ratings: {
        Args: never
        Returns: {
          avg_rating: number
          job_id: string
          review_count: number
        }[]
      }
      get_job_reviews: {
        Args: { _job_id: string }
        Returns: {
          comment: string
          contract_type: string
          created_at: string
          id: string
          is_sample: boolean
          learning: number
          management: number
          overall: number
          pay_fairness: number
          recommend: boolean
          workload: number
          year: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
