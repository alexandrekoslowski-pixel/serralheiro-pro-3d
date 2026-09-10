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
      catalogo: {
        Row: {
          dados: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          dados?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          dados?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      empresa: {
        Row: {
          codigo_oficina: string
          dados: Json
          limite_amarelo_dias: number
          limite_vermelho_dias: number
          prazo_padrao_dias: number
          updated_at: string
          user_id: string
        }
        Insert: {
          codigo_oficina?: string
          dados?: Json
          limite_amarelo_dias?: number
          limite_vermelho_dias?: number
          prazo_padrao_dias?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          codigo_oficina?: string
          dados?: Json
          limite_amarelo_dias?: number
          limite_vermelho_dias?: number
          prazo_padrao_dias?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pagamentos: {
        Row: {
          created_at: string
          data: string
          forma: string
          id: string
          observacao: string
          projeto_id: string
          user_id: string
          valor: number
        }
        Insert: {
          created_at?: string
          data?: string
          forma?: string
          id?: string
          observacao?: string
          projeto_id: string
          user_id: string
          valor?: number
        }
        Update: {
          created_at?: string
          data?: string
          forma?: string
          id?: string
          observacao?: string
          projeto_id?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          nome: string | null
        }
        Insert: {
          created_at?: string
          id: string
          nome?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string | null
        }
        Relationships: []
      }
      projetos: {
        Row: {
          aprovado_em: string | null
          cliente: string
          created_at: string
          dados: Json
          entregue_em: string | null
          etapa: Database["public"]["Enums"]["etapa_oficina"]
          etapa_em: string
          faturado_em: string | null
          id: string
          nome: string
          prazo_entrega: string | null
          status: Database["public"]["Enums"]["ordem_status"]
          total: number
          updated_at: string
          user_id: string
          valor_faturado: number
        }
        Insert: {
          aprovado_em?: string | null
          cliente?: string
          created_at?: string
          dados?: Json
          entregue_em?: string | null
          etapa?: Database["public"]["Enums"]["etapa_oficina"]
          etapa_em?: string
          faturado_em?: string | null
          id: string
          nome?: string
          prazo_entrega?: string | null
          status?: Database["public"]["Enums"]["ordem_status"]
          total?: number
          updated_at?: string
          user_id: string
          valor_faturado?: number
        }
        Update: {
          aprovado_em?: string | null
          cliente?: string
          created_at?: string
          dados?: Json
          entregue_em?: string | null
          etapa?: Database["public"]["Enums"]["etapa_oficina"]
          etapa_em?: string
          faturado_em?: string | null
          id?: string
          nome?: string
          prazo_entrega?: string | null
          status?: Database["public"]["Enums"]["ordem_status"]
          total?: number
          updated_at?: string
          user_id?: string
          valor_faturado?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      mover_etapa_oficina: {
        Args: {
          _codigo: string
          _etapa: Database["public"]["Enums"]["etapa_oficina"]
          _projeto_id: string
        }
        Returns: undefined
      }
      ordens_oficina: {
        Args: { _codigo: string }
        Returns: {
          cliente: string
          dados: Json
          etapa: Database["public"]["Enums"]["etapa_oficina"]
          etapa_em: string
          id: string
          nome: string
          prazo_entrega: string
          status: Database["public"]["Enums"]["ordem_status"]
        }[]
      }
    }
    Enums: {
      etapa_oficina:
        | "fila"
        | "producao"
        | "pintura"
        | "acabamento"
        | "pos_venda"
        | "pronto"
      ordem_status:
        | "orcamento"
        | "aprovado"
        | "producao"
        | "entregue"
        | "faturado"
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
    Enums: {
      etapa_oficina: [
        "fila",
        "producao",
        "pintura",
        "acabamento",
        "pos_venda",
        "pronto",
      ],
      ordem_status: [
        "orcamento",
        "aprovado",
        "producao",
        "entregue",
        "faturado",
      ],
    },
  },
} as const
