export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      // =====================================================
      // TABELAS DE AUTENTICAÇÃO E USUÁRIOS
      // =====================================================
      
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          company: string | null
          avatar_url: string | null
          position: string | null
          department: string | null
          role: string
          phone: string | null
          address: string | null
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          company?: string | null
          avatar_url?: string | null
          position?: string | null
          department?: string | null
          role?: string
          phone?: string | null
          address?: string | null
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          company?: string | null
          avatar_url?: string | null
          position?: string | null
          department?: string | null
          role?: string
          phone?: string | null
          address?: string | null
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
      }

      // =====================================================
      // TABELAS DE EMPRESAS E ORGANIZAÇÃO
      // =====================================================
      
      companies: {
        Row: {
          id: string
          owner_id: string
          fantasy_name: string
          company_name: string | null
          cnpj: string | null
          reference: string | null
          cep: string | null
          address: string | null
          city: string | null
          state: string | null
          email: string | null
          phone: string | null
          logo_url: string | null
          description: string | null
          sector: string | null
          status: string
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          fantasy_name: string
          company_name?: string | null
          cnpj?: string | null
          reference?: string | null
          cep?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          email?: string | null
          phone?: string | null
          logo_url?: string | null
          description?: string | null
          sector?: string | null
          status?: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          fantasy_name?: string
          company_name?: string | null
          cnpj?: string | null
          reference?: string | null
          cep?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          email?: string | null
          phone?: string | null
          logo_url?: string | null
          description?: string | null
          sector?: string | null
          status?: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }

      // =====================================================
      // TABELAS DE FUNCIONÁRIOS
      // =====================================================
      
      employees: {
        Row: {
          id: string
          owner_id: string
          company_id: string | null
          name: string
          email: string | null
          position: string | null
          department: string | null
          manager_id: string | null
          hire_date: string | null
          salary: number | null
          status: string
          avatar_url: string | null
          phone: string | null
          address: string | null
          permissions: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          company_id?: string | null
          name: string
          email?: string | null
          position?: string | null
          department?: string | null
          manager_id?: string | null
          hire_date?: string | null
          salary?: number | null
          status?: string
          avatar_url?: string | null
          phone?: string | null
          address?: string | null
          permissions?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          company_id?: string | null
          name?: string
          email?: string | null
          position?: string | null
          department?: string | null
          manager_id?: string | null
          hire_date?: string | null
          salary?: number | null
          status?: string
          avatar_url?: string | null
          phone?: string | null
          address?: string | null
          permissions?: Json
          created_at?: string
          updated_at?: string
        }
      }

      // =====================================================
      // TABELAS DE PRODUTOS E SERVIÇOS
      // =====================================================
      
      products: {
        Row: {
          id: string
          owner_id: string
          company_id: string | null
          name: string
          type: string
          sku: string | null
          description: string | null
          category: string | null
          base_price: number
          currency: string
          unit: string
          stock: number | null
          min_stock: number
          image_url: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          company_id?: string | null
          name: string
          type?: string
          sku?: string | null
          description?: string | null
          category?: string | null
          base_price: number
          currency?: string
          unit?: string
          stock?: number | null
          min_stock?: number
          image_url?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          company_id?: string | null
          name?: string
          type?: string
          sku?: string | null
          description?: string | null
          category?: string | null
          base_price?: number
          currency?: string
          unit?: string
          stock?: number | null
          min_stock?: number
          image_url?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }

      // =====================================================
      // TABELAS DE INVENTÁRIO
      // =====================================================
      
      inventory: {
        Row: {
          id: string
          owner_id: string
          product_id: string
          quantity: number
          location: string | null
          last_updated: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          product_id: string
          quantity: number
          location?: string | null
          last_updated?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          product_id?: string
          quantity?: number
          location?: string | null
          last_updated?: string
          created_at?: string
          updated_at?: string
        }
      }

      // =====================================================
      // TABELAS DE VENDAS E FUNIL
      // =====================================================
      
      funnel_stages: {
        Row: {
          id: string
          owner_id: string
          name: string
          order_position: number
          color: string
          probability: number
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          order_position: number
          color?: string
          probability?: number
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          order_position?: number
          color?: string
          probability?: number
          created_at?: string
        }
      }

      leads: {
        Row: {
          id: string
          owner_id: string
          company_id: string | null
          name: string
          email: string | null
          phone: string | null
          company: string | null
          source: string | null
          status: string
          assigned_to: string | null
          value: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          company_id?: string | null
          name: string
          email?: string | null
          phone?: string | null
          company?: string | null
          source?: string | null
          status?: string
          assigned_to?: string | null
          value?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          company_id?: string | null
          name?: string
          email?: string | null
          phone?: string | null
          company?: string | null
          source?: string | null
          status?: string
          assigned_to?: string | null
          value?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      deals: {
        Row: {
          id: string
          owner_id: string
          company_id: string | null
          product_id: string | null
          stage_id: string
          responsible_id: string | null
          title: string
          value: number
          probability: number
          expected_close_date: string | null
          notes: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          company_id?: string | null
          product_id?: string | null
          stage_id: string
          responsible_id?: string | null
          title: string
          value: number
          probability?: number
          expected_close_date?: string | null
          notes?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          company_id?: string | null
          product_id?: string | null
          stage_id?: string
          responsible_id?: string | null
          title?: string
          value?: number
          probability?: number
          expected_close_date?: string | null
          notes?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }

      // =====================================================
      // TABELAS DE ATIVIDADES
      // =====================================================
      
      activities: {
        Row: {
          id: string
          created_by: string
          title: string
          description: string | null
          type: string
          priority: string
          status: string
          due_date: string | null
          start_date: string | null
          end_date: string | null
          responsible_id: string | null
          company_id: string | null
          project_id: string | null
          work_group: string | null
          department: string | null
          estimated_hours: number | null
          actual_hours: number | null
          tags: string[] | null
          attachments: Json | null
          comments: Json | null
          progress: number
          is_urgent: boolean
          is_public: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_by: string
          title: string
          description?: string | null
          type?: string
          priority?: string
          status?: string
          due_date?: string | null
          start_date?: string | null
          end_date?: string | null
          responsible_id?: string | null
          company_id?: string | null
          project_id?: string | null
          work_group?: string | null
          department?: string | null
          estimated_hours?: number | null
          actual_hours?: number | null
          tags?: string[] | null
          attachments?: Json | null
          comments?: Json | null
          progress?: number
          is_urgent?: boolean
          is_public?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          created_by?: string
          title?: string
          description?: string | null
          type?: string
          priority?: string
          status?: string
          due_date?: string | null
          start_date?: string | null
          end_date?: string | null
          responsible_id?: string | null
          company_id?: string | null
          project_id?: string | null
          work_group?: string | null
          department?: string | null
          estimated_hours?: number | null
          actual_hours?: number | null
          tags?: string[] | null
          attachments?: Json | null
          comments?: Json | null
          progress?: number
          is_urgent?: boolean
          is_public?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      commercial_activities: {
        Row: {
          id: string
          owner_id: string
          company_id: string | null
          lead_id: string | null
          deal_id: string | null
          responsible_id: string | null
          title: string
          description: string | null
          type: string
          status: string
          priority: string
          start_datetime: string | null
          end_datetime: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          company_id?: string | null
          lead_id?: string | null
          deal_id?: string | null
          responsible_id?: string | null
          title: string
          description?: string | null
          type: string
          status?: string
          priority?: string
          start_datetime?: string | null
          end_datetime?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          company_id?: string | null
          lead_id?: string | null
          deal_id?: string | null
          responsible_id?: string | null
          title?: string
          description?: string | null
          type?: string
          status?: string
          priority?: string
          start_datetime?: string | null
          end_datetime?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      // =====================================================
      // TABELAS DE PROJETOS
      // =====================================================
      
      projects: {
        Row: {
          id: string
          owner_id: string
          company_id: string | null
          name: string
          description: string | null
          status: string
          priority: string
          start_date: string | null
          end_date: string | null
          budget: number | null
          manager_id: string | null
          client_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          company_id?: string | null
          name: string
          description?: string | null
          status?: string
          priority?: string
          start_date?: string | null
          end_date?: string | null
          budget?: number | null
          manager_id?: string | null
          client_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          company_id?: string | null
          name?: string
          description?: string | null
          status?: string
          priority?: string
          start_date?: string | null
          end_date?: string | null
          budget?: number | null
          manager_id?: string | null
          client_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      // =====================================================
      // TABELAS DE ARQUIVOS
      // =====================================================
      
      files: {
        Row: {
          id: string
          owner_id: string
          name: string
          path: string
          size: number
          type: string
          folder: string
          tags: string[]
          favorite: boolean
          shared: boolean
          private: boolean
          description: string | null
          created_at: string
          updated_at: string
          viewed_at: string | null
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          path: string
          size: number
          type: string
          folder?: string
          tags?: string[]
          favorite?: boolean
          shared?: boolean
          private?: boolean
          description?: string | null
          created_at?: string
          updated_at?: string
          viewed_at?: string | null
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          path?: string
          size?: number
          type?: string
          folder?: string
          tags?: string[]
          favorite?: boolean
          shared?: boolean
          private?: boolean
          description?: string | null
          created_at?: string
          updated_at?: string
          viewed_at?: string | null
        }
      }

      // =====================================================
      // TABELAS DE WHATSAPP
      // =====================================================
      
      whatsapp_atendimentos: {
        Row: {
          id: string
          owner_id: string
          company_id: string | null
          numero_cliente: string
          nome_cliente: string | null
          status: string
          data_inicio: string
          data_fim: string | null
          ultima_mensagem: string
          atendente_id: string | null
          prioridade: number
          tags: Json | null
          observacoes: string | null
          canal: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          company_id?: string | null
          numero_cliente: string
          nome_cliente?: string | null
          status?: string
          data_inicio?: string
          data_fim?: string | null
          ultima_mensagem?: string
          atendente_id?: string | null
          prioridade?: number
          tags?: Json | null
          observacoes?: string | null
          canal?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          company_id?: string | null
          numero_cliente?: string
          nome_cliente?: string | null
          status?: string
          data_inicio?: string
          data_fim?: string | null
          ultima_mensagem?: string
          atendente_id?: string | null
          prioridade?: number
          tags?: Json | null
          observacoes?: string | null
          canal?: string
          created_at?: string
          updated_at?: string
        }
      }

      whatsapp_mensagens: {
        Row: {
          id: string
          owner_id: string
          atendimento_id: string
          conteudo: string
          tipo: string
          remetente: string
          timestamp: string
          lida: boolean
          midia_url: string | null
          midia_tipo: string | null
          midia_nome: string | null
          midia_tamanho: number | null
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          atendimento_id: string
          conteudo: string
          tipo?: string
          remetente: string
          timestamp?: string
          lida?: boolean
          midia_url?: string | null
          midia_tipo?: string | null
          midia_nome?: string | null
          midia_tamanho?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          atendimento_id?: string
          conteudo?: string
          tipo?: string
          remetente?: string
          timestamp?: string
          lida?: boolean
          midia_url?: string | null
          midia_tipo?: string | null
          midia_nome?: string | null
          midia_tamanho?: number | null
          created_at?: string
        }
      }

      // =====================================================
      // TABELAS ADICIONAIS
      // =====================================================
      
      suppliers: {
        Row: {
          id: string
          owner_id: string
          company_id: string | null
          name: string
          cnpj: string | null
          email: string | null
          phone: string | null
          address: string | null
          city: string | null
          state: string | null
          contact_person: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          company_id?: string | null
          name: string
          cnpj?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          contact_person?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          company_id?: string | null
          name?: string
          cnpj?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          contact_person?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }

      work_groups: {
        Row: {
          id: string
          owner_id: string
          company_id: string | null
          name: string
          description: string | null
          leader_id: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          company_id?: string | null
          name: string
          description?: string | null
          leader_id?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          company_id?: string | null
          name?: string
          description?: string | null
          leader_id?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }

      // =====================================================
      // TABELAS DE CONFIGURAÇÕES DA EMPRESA
      // =====================================================
      
      company_settings: {
        Row: {
          id: string
          company_id: string
          company_name: string
          logo_url: string | null
          default_language: string
          default_timezone: string
          default_currency: string
          datetime_format: string
          primary_color: string
          secondary_color: string
          accent_color: string
          sidebar_color: string
          topbar_color: string
          button_color: string
          enable_2fa: boolean
          password_policy: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          company_name: string
          logo_url?: string | null
          default_language?: string
          default_timezone?: string
          default_currency?: string
          datetime_format?: string
          primary_color?: string
          secondary_color?: string
          accent_color?: string
          sidebar_color?: string
          topbar_color?: string
          button_color?: string
          enable_2fa?: boolean
          password_policy?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          company_name?: string
          logo_url?: string | null
          default_language?: string
          default_timezone?: string
          default_currency?: string
          datetime_format?: string
          primary_color?: string
          secondary_color?: string
          accent_color?: string
          sidebar_color?: string
          topbar_color?: string
          button_color?: string
          enable_2fa?: boolean
          password_policy?: Json
          created_at?: string
          updated_at?: string
        }
      }

      company_areas: {
        Row: {
          id: string
          company_id: string
          name: string
          description: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          description?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          description?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }

      company_roles: {
        Row: {
          id: string
          company_id: string
          name: string
          description: string | null
          permissions: Json
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          description?: string | null
          permissions?: Json
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          description?: string | null
          permissions?: Json
          status?: string
          created_at?: string
          updated_at?: string
        }
      }

      company_users: {
        Row: {
          id: string
          company_id: string
          full_name: string
          email: string
          password_hash: string
          birth_date: string | null
          phone: string | null
          role_id: string | null
          area_id: string | null
          status: string
          last_login: string | null
          last_login_ip: string | null
          invite_token: string | null
          invite_expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          full_name: string
          email: string
          password_hash: string
          birth_date?: string | null
          phone?: string | null
          role_id?: string | null
          area_id?: string | null
          status?: string
          last_login?: string | null
          last_login_ip?: string | null
          invite_token?: string | null
          invite_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          full_name?: string
          email?: string
          password_hash?: string
          birth_date?: string | null
          phone?: string | null
          role_id?: string | null
          area_id?: string | null
          status?: string
          last_login?: string | null
          last_login_ip?: string | null
          invite_token?: string | null
          invite_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      templates: {
        Row: {
          id: string
          user_id: string
          owner_id: string
          nome: string
          conteudo: string
          canal: string
          assinatura: string | null
          signature_image: string | null
          status: string
          attachments: Json
          descricao: string | null
          template_file_url: string | null
          template_file_name: string | null
          image_url: string | null
          font_size_px: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          owner_id: string
          nome: string
          conteudo: string
          canal?: string
          assinatura?: string | null
          signature_image?: string | null
          status?: string
          attachments?: Json
          descricao?: string | null
          template_file_url?: string | null
          template_file_name?: string | null
          image_url?: string | null
          font_size_px?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          owner_id?: string
          nome?: string
          conteudo?: string
          canal?: string
          assinatura?: string | null
          signature_image?: string | null
          status?: string
          attachments?: Json
          descricao?: string | null
          template_file_url?: string | null
          template_file_name?: string | null
          image_url?: string | null
          font_size_px?: string
          created_at?: string
          updated_at?: string
        }
      }

      user_profiles: {
        Row: {
          id: string
          company_id: string | null
          name: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          name: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          name?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }

      // Adicione outras tabelas conforme necessário...
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

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
    Enums: {},
  },
} as const
