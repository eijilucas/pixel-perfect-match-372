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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          company_id: string | null
          completed_at: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          due_date: string | null
          id: string
          notes: string | null
          opportunity_id: string | null
          owner_id: string | null
          status: Database["public"]["Enums"]["activity_status"]
          title: string
          type: Database["public"]["Enums"]["activity_type"]
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          opportunity_id?: string | null
          owner_id?: string | null
          status?: Database["public"]["Enums"]["activity_status"]
          title: string
          type: Database["public"]["Enums"]["activity_type"]
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          opportunity_id?: string | null
          owner_id?: string | null
          status?: Database["public"]["Enums"]["activity_status"]
          title?: string
          type?: Database["public"]["Enums"]["activity_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          answered_contact: boolean | null
          best_return_date: string | null
          can_stop: Database["public"]["Enums"]["bi_state"] | null
          city: string | null
          cnpj: string | null
          created_at: string
          created_by: string | null
          disqualification_reason: string | null
          employees_count: number | null
          future_opportunity_reason: string | null
          has_backup: Database["public"]["Enums"]["tri_state"] | null
          has_buying_potential: boolean | null
          has_it_contract: Database["public"]["Enums"]["bi_state"] | null
          has_support: Database["public"]["Enums"]["bi_state"] | null
          id: string
          interested_now: boolean | null
          it_users_count: number | null
          lead_status: Database["public"]["Enums"]["lead_status"] | null
          main_goal: string | null
          main_pain: string | null
          main_risk: string | null
          name: string
          notes: string | null
          origin: Database["public"]["Enums"]["company_origin"] | null
          owner_id: string | null
          priority: Database["public"]["Enums"]["priority_level"] | null
          segment: string | null
          service_of_interest: string | null
          state: string | null
          status: Database["public"]["Enums"]["company_status"]
          updated_at: string
          urgency: Database["public"]["Enums"]["urgency_level"] | null
          uses_cloud: Database["public"]["Enums"]["tri_state"] | null
          website: string | null
        }
        Insert: {
          answered_contact?: boolean | null
          best_return_date?: string | null
          can_stop?: Database["public"]["Enums"]["bi_state"] | null
          city?: string | null
          cnpj?: string | null
          created_at?: string
          created_by?: string | null
          disqualification_reason?: string | null
          employees_count?: number | null
          future_opportunity_reason?: string | null
          has_backup?: Database["public"]["Enums"]["tri_state"] | null
          has_buying_potential?: boolean | null
          has_it_contract?: Database["public"]["Enums"]["bi_state"] | null
          has_support?: Database["public"]["Enums"]["bi_state"] | null
          id?: string
          interested_now?: boolean | null
          it_users_count?: number | null
          lead_status?: Database["public"]["Enums"]["lead_status"] | null
          main_goal?: string | null
          main_pain?: string | null
          main_risk?: string | null
          name: string
          notes?: string | null
          origin?: Database["public"]["Enums"]["company_origin"] | null
          owner_id?: string | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          segment?: string | null
          service_of_interest?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["company_status"]
          updated_at?: string
          urgency?: Database["public"]["Enums"]["urgency_level"] | null
          uses_cloud?: Database["public"]["Enums"]["tri_state"] | null
          website?: string | null
        }
        Update: {
          answered_contact?: boolean | null
          best_return_date?: string | null
          can_stop?: Database["public"]["Enums"]["bi_state"] | null
          city?: string | null
          cnpj?: string | null
          created_at?: string
          created_by?: string | null
          disqualification_reason?: string | null
          employees_count?: number | null
          future_opportunity_reason?: string | null
          has_backup?: Database["public"]["Enums"]["tri_state"] | null
          has_buying_potential?: boolean | null
          has_it_contract?: Database["public"]["Enums"]["bi_state"] | null
          has_support?: Database["public"]["Enums"]["bi_state"] | null
          id?: string
          interested_now?: boolean | null
          it_users_count?: number | null
          lead_status?: Database["public"]["Enums"]["lead_status"] | null
          main_goal?: string | null
          main_pain?: string | null
          main_risk?: string | null
          name?: string
          notes?: string | null
          origin?: Database["public"]["Enums"]["company_origin"] | null
          owner_id?: string | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          segment?: string | null
          service_of_interest?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["company_status"]
          updated_at?: string
          urgency?: Database["public"]["Enums"]["urgency_level"] | null
          uses_cloud?: Database["public"]["Enums"]["tri_state"] | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_services: {
        Row: {
          annual_value: number | null
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          ended_at: string | null
          id: string
          monthly_value: number | null
          name: string
          owner_id: string | null
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          annual_value?: number | null
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          ended_at?: string | null
          id?: string
          monthly_value?: number | null
          name: string
          owner_id?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          annual_value?: number | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          ended_at?: string | null
          id?: string
          monthly_value?: number | null
          name?: string
          owner_id?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_services_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_services_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          company_id: string
          contact_preference: string | null
          created_at: string
          decision_role: Database["public"]["Enums"]["contact_role"] | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          role_title: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          company_id: string
          contact_preference?: string | null
          created_at?: string
          decision_role?: Database["public"]["Enums"]["contact_role"] | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          role_title?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          company_id?: string
          contact_preference?: string | null
          created_at?: string
          decision_role?: Database["public"]["Enums"]["contact_role"] | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          role_title?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      interactions: {
        Row: {
          company_id: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          id: string
          occurred_at: string
          opportunity_id: string | null
          summary: string
          type: Database["public"]["Enums"]["interaction_type"]
        }
        Insert: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          occurred_at?: string
          opportunity_id?: string | null
          summary: string
          type: Database["public"]["Enums"]["interaction_type"]
        }
        Update: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          occurred_at?: string
          opportunity_id?: string | null
          summary?: string
          type?: Database["public"]["Enums"]["interaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "interactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          annual_value: number | null
          company_id: string
          created_at: string
          created_by: string | null
          diagnosis_summary: string | null
          expected_close_date: string | null
          id: string
          loss_reason: string | null
          main_pain: string | null
          monthly_value: number | null
          name: string
          next_step: string | null
          owner_id: string | null
          primary_contact_id: string | null
          probability: number | null
          recommended_solution: string | null
          service_of_interest: string | null
          setup_value: number | null
          stage: Database["public"]["Enums"]["pipeline_stage"]
          updated_at: string
        }
        Insert: {
          annual_value?: number | null
          company_id: string
          created_at?: string
          created_by?: string | null
          diagnosis_summary?: string | null
          expected_close_date?: string | null
          id?: string
          loss_reason?: string | null
          main_pain?: string | null
          monthly_value?: number | null
          name: string
          next_step?: string | null
          owner_id?: string | null
          primary_contact_id?: string | null
          probability?: number | null
          recommended_solution?: string | null
          service_of_interest?: string | null
          setup_value?: number | null
          stage?: Database["public"]["Enums"]["pipeline_stage"]
          updated_at?: string
        }
        Update: {
          annual_value?: number | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          diagnosis_summary?: string | null
          expected_close_date?: string | null
          id?: string
          loss_reason?: string | null
          main_pain?: string | null
          monthly_value?: number | null
          name?: string
          next_step?: string | null
          owner_id?: string | null
          primary_contact_id?: string | null
          probability?: number | null
          recommended_solution?: string | null
          service_of_interest?: string | null
          setup_value?: number | null
          stage?: Database["public"]["Enums"]["pipeline_stage"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_primary_contact_id_fkey"
            columns: ["primary_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_stage_changes: {
        Row: {
          changed_at: string
          changed_by: string | null
          from_stage: Database["public"]["Enums"]["pipeline_stage"] | null
          id: string
          opportunity_id: string
          to_stage: Database["public"]["Enums"]["pipeline_stage"]
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          from_stage?: Database["public"]["Enums"]["pipeline_stage"] | null
          id?: string
          opportunity_id: string
          to_stage: Database["public"]["Enums"]["pipeline_stage"]
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          from_stage?: Database["public"]["Enums"]["pipeline_stage"] | null
          id?: string
          opportunity_id?: string
          to_stage?: Database["public"]["Enums"]["pipeline_stage"]
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stage_changes_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_stage_changes_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      activity_status: "pendente" | "concluida" | "atrasada" | "cancelada"
      activity_type:
        | "whatsapp"
        | "ligacao"
        | "email"
        | "reuniao"
        | "visita"
        | "diagnostico"
        | "desenvolver_proposta"
        | "apresentar_proposta"
        | "follow_up"
        | "notificar_equipe"
        | "solicitar_onboarding"
        | "renovacao"
      bi_state: "sim" | "nao" | "nao_sei"
      company_origin:
        | "indicacao"
        | "site"
        | "prospeccao_ativa"
        | "parceiro"
        | "evento"
        | "campanha"
        | "outro"
      company_status:
        | "lead"
        | "qualificado"
        | "oportunidade_futura"
        | "cliente_ativo"
        | "cliente_inativo"
        | "desqualificado"
      contact_role:
        | "decisor"
        | "influenciador"
        | "tecnico"
        | "financeiro"
        | "operacional"
      interaction_type:
        | "nota"
        | "whatsapp"
        | "ligacao"
        | "reuniao"
        | "diagnostico"
        | "mudanca_etapa"
        | "proposta_criada"
        | "proposta_apresentada"
        | "proposta_aceita"
        | "cliente_ativado"
      lead_status:
        | "novo"
        | "em_contato"
        | "qualificado"
        | "desqualificado"
        | "oportunidade_futura"
      pipeline_stage:
        | "novo_lead"
        | "em_qualificacao"
        | "oportunidade_futura"
        | "reuniao_agendada"
        | "diagnostico_ti"
        | "proposta_a_desenvolver"
        | "proposta_em_desenvolvimento"
        | "proposta_apresentada"
        | "negociacao"
        | "contrato_aceito"
        | "onboarding"
        | "cliente_ativo"
        | "desqualificado"
        | "perdido"
      priority_level: "baixa" | "media" | "alta"
      tri_state: "sim" | "nao" | "parcial" | "nao_sei"
      urgency_level: "baixo" | "medio" | "alto"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activity_status: ["pendente", "concluida", "atrasada", "cancelada"],
      activity_type: [
        "whatsapp",
        "ligacao",
        "email",
        "reuniao",
        "visita",
        "diagnostico",
        "desenvolver_proposta",
        "apresentar_proposta",
        "follow_up",
        "notificar_equipe",
        "solicitar_onboarding",
        "renovacao",
      ],
      bi_state: ["sim", "nao", "nao_sei"],
      company_origin: [
        "indicacao",
        "site",
        "prospeccao_ativa",
        "parceiro",
        "evento",
        "campanha",
        "outro",
      ],
      company_status: [
        "lead",
        "qualificado",
        "oportunidade_futura",
        "cliente_ativo",
        "cliente_inativo",
        "desqualificado",
      ],
      contact_role: [
        "decisor",
        "influenciador",
        "tecnico",
        "financeiro",
        "operacional",
      ],
      interaction_type: [
        "nota",
        "whatsapp",
        "ligacao",
        "reuniao",
        "diagnostico",
        "mudanca_etapa",
        "proposta_criada",
        "proposta_apresentada",
        "proposta_aceita",
        "cliente_ativado",
      ],
      lead_status: [
        "novo",
        "em_contato",
        "qualificado",
        "desqualificado",
        "oportunidade_futura",
      ],
      pipeline_stage: [
        "novo_lead",
        "em_qualificacao",
        "oportunidade_futura",
        "reuniao_agendada",
        "diagnostico_ti",
        "proposta_a_desenvolver",
        "proposta_em_desenvolvimento",
        "proposta_apresentada",
        "negociacao",
        "contrato_aceito",
        "onboarding",
        "cliente_ativo",
        "desqualificado",
        "perdido",
      ],
      priority_level: ["baixa", "media", "alta"],
      tri_state: ["sim", "nao", "parcial", "nao_sei"],
      urgency_level: ["baixo", "medio", "alto"],
    },
  },
} as const
