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
      briefings: {
        Row: {
          cliente_id: string | null
          created_at: string
          id: string
          observacoes: string
          respostas: Json
          tipo_servico: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          id?: string
          observacoes?: string
          respostas?: Json
          tipo_servico?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          id?: string
          observacoes?: string
          respostas?: Json
          tipo_servico?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "briefings_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
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
      clientes: {
        Row: {
          bairro: string
          cep: string
          cidade: string
          created_at: string
          documento: string
          email: string
          endereco: string
          estrategico: boolean
          id: string
          nome: string
          observacoes: string
          origem: string
          telefone: string
          updated_at: string
          user_id: string
          whatsapp: string
        }
        Insert: {
          bairro?: string
          cep?: string
          cidade?: string
          created_at?: string
          documento?: string
          email?: string
          endereco?: string
          estrategico?: boolean
          id?: string
          nome?: string
          observacoes?: string
          origem?: string
          telefone?: string
          updated_at?: string
          user_id: string
          whatsapp?: string
        }
        Update: {
          bairro?: string
          cep?: string
          cidade?: string
          created_at?: string
          documento?: string
          email?: string
          endereco?: string
          estrategico?: boolean
          id?: string
          nome?: string
          observacoes?: string
          origem?: string
          telefone?: string
          updated_at?: string
          user_id?: string
          whatsapp?: string
        }
        Relationships: []
      }
      cores_catalogo: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          hex_aproximado: string
          id: string
          multiplicador: number
          nome: string
          ordem: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          hex_aproximado?: string
          id: string
          multiplicador?: number
          nome: string
          ordem?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          hex_aproximado?: string
          id?: string
          multiplicador?: number
          nome?: string
          ordem?: number
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
      materiais: {
        Row: {
          acabamento: string
          altura_mm: number | null
          ativo: boolean
          categoria: string
          codigo_calculo: string
          codigo_fornecedor: string
          comprimento_comercial_mm: number | null
          created_at: string
          custo: number
          descricao_original: string
          espessura_mm: number | null
          fornecedor: string
          id: string
          largura_mm: number | null
          nome: string
          observacoes: string
          subtipo: string
          unidade: string
          unidade_compra: string
          updated_at: string
          user_id: string
        }
        Insert: {
          acabamento?: string
          altura_mm?: number | null
          ativo?: boolean
          categoria?: string
          codigo_calculo?: string
          codigo_fornecedor?: string
          comprimento_comercial_mm?: number | null
          created_at?: string
          custo?: number
          descricao_original?: string
          espessura_mm?: number | null
          fornecedor?: string
          id?: string
          largura_mm?: number | null
          nome?: string
          observacoes?: string
          subtipo?: string
          unidade?: string
          unidade_compra?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          acabamento?: string
          altura_mm?: number | null
          ativo?: boolean
          categoria?: string
          codigo_calculo?: string
          codigo_fornecedor?: string
          comprimento_comercial_mm?: number | null
          created_at?: string
          custo?: number
          descricao_original?: string
          espessura_mm?: number | null
          fornecedor?: string
          id?: string
          largura_mm?: number | null
          nome?: string
          observacoes?: string
          subtipo?: string
          unidade?: string
          unidade_compra?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      material_importacoes: {
        Row: {
          created_at: string
          fornecedor: string
          id: string
          nome_arquivo: string
          observacoes: string
          referencia: string
          total_itens: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          fornecedor?: string
          id?: string
          nome_arquivo?: string
          observacoes?: string
          referencia: string
          total_itens?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          fornecedor?: string
          id?: string
          nome_arquivo?: string
          observacoes?: string
          referencia?: string
          total_itens?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      material_precos: {
        Row: {
          created_at: string
          fornecedor: string
          id: string
          importacao_id: string | null
          material_id: string
          observacoes: string
          origem: string
          promocional: boolean
          referencia: string
          unidade: string
          user_id: string
          valor: number
        }
        Insert: {
          created_at?: string
          fornecedor?: string
          id?: string
          importacao_id?: string | null
          material_id: string
          observacoes?: string
          origem?: string
          promocional?: boolean
          referencia: string
          unidade?: string
          user_id: string
          valor?: number
        }
        Update: {
          created_at?: string
          fornecedor?: string
          id?: string
          importacao_id?: string | null
          material_id?: string
          observacoes?: string
          origem?: string
          promocional?: boolean
          referencia?: string
          unidade?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "material_precos_importacao_id_fkey"
            columns: ["importacao_id"]
            isOneToOne: false
            referencedRelation: "material_importacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_precos_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_precos_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiais_precos_atuais"
            referencedColumns: ["material_id"]
          },
        ]
      }
      ordem_etapas: {
        Row: {
          concluida_em: string | null
          created_at: string
          etapa: Database["public"]["Enums"]["etapa_oficina"]
          id: string
          iniciada_em: string
          observacao: string
          projeto_id: string
          responsavel_id: string | null
          responsavel_nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          concluida_em?: string | null
          created_at?: string
          etapa: Database["public"]["Enums"]["etapa_oficina"]
          id?: string
          iniciada_em?: string
          observacao?: string
          projeto_id: string
          responsavel_id?: string | null
          responsavel_nome?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          concluida_em?: string | null
          created_at?: string
          etapa?: Database["public"]["Enums"]["etapa_oficina"]
          id?: string
          iniciada_em?: string
          observacao?: string
          projeto_id?: string
          responsavel_id?: string | null
          responsavel_nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordem_etapas_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      ordem_fotos: {
        Row: {
          caminho: string
          created_at: string
          enviado_nome: string
          enviado_por: string | null
          etapa: string
          id: string
          observacao: string
          projeto_id: string
          user_id: string
        }
        Insert: {
          caminho: string
          created_at?: string
          enviado_nome?: string
          enviado_por?: string | null
          etapa?: string
          id?: string
          observacao?: string
          projeto_id: string
          user_id: string
        }
        Update: {
          caminho?: string
          created_at?: string
          enviado_nome?: string
          enviado_por?: string | null
          etapa?: string
          id?: string
          observacao?: string
          projeto_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordem_fotos_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
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
          briefing_id: string | null
          cliente: string
          cliente_id: string | null
          created_at: string
          dados: Json
          entregue_em: string | null
          etapa: Database["public"]["Enums"]["etapa_oficina"]
          etapa_em: string
          faturado_em: string | null
          id: string
          nome: string
          prazo_entrega: string | null
          prioridade_manual: string | null
          responsavel_id: string | null
          status: Database["public"]["Enums"]["ordem_status"]
          total: number
          updated_at: string
          user_id: string
          valor_faturado: number
        }
        Insert: {
          aprovado_em?: string | null
          briefing_id?: string | null
          cliente?: string
          cliente_id?: string | null
          created_at?: string
          dados?: Json
          entregue_em?: string | null
          etapa?: Database["public"]["Enums"]["etapa_oficina"]
          etapa_em?: string
          faturado_em?: string | null
          id: string
          nome?: string
          prazo_entrega?: string | null
          prioridade_manual?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["ordem_status"]
          total?: number
          updated_at?: string
          user_id: string
          valor_faturado?: number
        }
        Update: {
          aprovado_em?: string | null
          briefing_id?: string | null
          cliente?: string
          cliente_id?: string | null
          created_at?: string
          dados?: Json
          entregue_em?: string | null
          etapa?: Database["public"]["Enums"]["etapa_oficina"]
          etapa_em?: string
          faturado_em?: string | null
          id?: string
          nome?: string
          prazo_entrega?: string | null
          prioridade_manual?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["ordem_status"]
          total?: number
          updated_at?: string
          user_id?: string
          valor_faturado?: number
        }
        Relationships: [
          {
            foreignKeyName: "projetos_briefing_id_fkey"
            columns: ["briefing_id"]
            isOneToOne: false
            referencedRelation: "briefings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projetos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      servicos_catalogo: {
        Row: {
          ativo: boolean
          campos: Json
          categoria: string
          created_at: string
          descricao: string
          id: string
          nome: string
          preco_base: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          campos?: Json
          categoria?: string
          created_at?: string
          descricao?: string
          id?: string
          nome?: string
          preco_base?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          campos?: Json
          categoria?: string
          created_at?: string
          descricao?: string
          id?: string
          nome?: string
          preco_base?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          dono_id: string
          id: string
          nome: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          dono_id: string
          id?: string
          nome?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          dono_id?: string
          id?: string
          nome?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      materiais_precos_atuais: {
        Row: {
          fornecedor: string | null
          material_id: string | null
          observacoes: string | null
          promocional: boolean | null
          referencia: string | null
          unidade: string | null
          valor: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      dono_atual: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      mover_etapa_oficina: {
        Args: {
          _codigo: string
          _etapa: Database["public"]["Enums"]["etapa_oficina"]
          _projeto_id: string
        }
        Returns: undefined
      }
      mover_etapa_resp: {
        Args: {
          _codigo: string
          _etapa: Database["public"]["Enums"]["etapa_oficina"]
          _projeto_id: string
          _responsavel: string
        }
        Returns: undefined
      }
      ordens_oficina: {
        Args: { _codigo: string }
        Returns: {
          cliente: string
          dados: Json
          endereco: string
          etapa: Database["public"]["Enums"]["etapa_oficina"]
          etapa_em: string
          fotos: number
          id: string
          nome: string
          prazo_entrega: string
          responsavel: string
          status: Database["public"]["Enums"]["ordem_status"]
        }[]
      }
    }
    Enums: {
      app_role: "gestor" | "vendedora" | "serralheiro"
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
      app_role: ["gestor", "vendedora", "serralheiro"],
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
