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
      autoblog_runs: {
        Row: {
          details: string | null
          error: string | null
          finished_at: string | null
          id: string
          post_ids: string
          posts_created: number
          posts_requested: number
          started_at: string
          status: string
          trigger_source: string
        }
        Insert: {
          details?: string | null
          error?: string | null
          finished_at?: string | null
          id: string
          post_ids?: string
          posts_created?: number
          posts_requested?: number
          started_at?: string
          status?: string
          trigger_source?: string
        }
        Update: {
          details?: string | null
          error?: string | null
          finished_at?: string | null
          id?: string
          post_ids?: string
          posts_created?: number
          posts_requested?: number
          started_at?: string
          status?: string
          trigger_source?: string
        }
        Relationships: []
      }
      autoblog_settings: {
        Row: {
          author: string | null
          category_id: string | null
          created_at: string
          enabled: number
          id: string
          last_run_at: string | null
          master_prompt: string
          next_topic_seed: number
          posts_per_day: number
          publish_status: string
          run_hours: string
          topic_pool: string
          total_generated: number
          updated_at: string
          with_image: number
        }
        Insert: {
          author?: string | null
          category_id?: string | null
          created_at?: string
          enabled?: number
          id: string
          last_run_at?: string | null
          master_prompt?: string
          next_topic_seed?: number
          posts_per_day?: number
          publish_status?: string
          run_hours?: string
          topic_pool?: string
          total_generated?: number
          updated_at?: string
          with_image?: number
        }
        Update: {
          author?: string | null
          category_id?: string | null
          created_at?: string
          enabled?: number
          id?: string
          last_run_at?: string | null
          master_prompt?: string
          next_topic_seed?: number
          posts_per_day?: number
          publish_status?: string
          run_hours?: string
          topic_pool?: string
          total_generated?: number
          updated_at?: string
          with_image?: number
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          parent_id: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id: string
          name: string
          parent_id?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      blog_post_tags: {
        Row: {
          created_at: string
          post_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          tag_id?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author: string | null
          canonical_url: string | null
          category_id: string | null
          content: string | null
          cover_image: string | null
          created_at: string
          excerpt: string | null
          focus_keyword: string | null
          id: string
          indexable: number
          published_at: string | null
          robots: string
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string
          tags_csv: string
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          canonical_url?: string | null
          category_id?: string | null
          content?: string | null
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          focus_keyword?: string | null
          id: string
          indexable?: number
          published_at?: string | null
          robots?: string
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          tags_csv?: string
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          canonical_url?: string | null
          category_id?: string | null
          content?: string | null
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          focus_keyword?: string | null
          id?: string
          indexable?: number
          published_at?: string | null
          robots?: string
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          tags_csv?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_tags: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          seo_description: string | null
          seo_title: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id: string
          name: string
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      catalog_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          name: string
          sort_order?: number
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      catalog_items: {
        Row: {
          bullets_json: string
          category_id: string | null
          created_at: string
          description: string
          icon: string
          id: string
          published: number
          short_desc: string
          slug: string
          sort_order: number
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          bullets_json?: string
          category_id?: string | null
          created_at?: string
          description?: string
          icon?: string
          id: string
          published?: number
          short_desc?: string
          slug: string
          sort_order?: number
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          bullets_json?: string
          category_id?: string | null
          created_at?: string
          description?: string
          icon?: string
          id?: string
          published?: number
          short_desc?: string
          slug?: string
          sort_order?: number
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string | null
          id: string
          ip_address: string | null
          message: string
          name: string
          phone: string | null
          status: string
          subject: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          ip_address?: string | null
          message: string
          name: string
          phone?: string | null
          status?: string
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          ip_address?: string | null
          message?: string
          name?: string
          phone?: string | null
          status?: string
          subject?: string | null
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          created_at: string
          email: string
          id: string
          ip_address: string | null
          reason: string | null
          success: number
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          ip_address?: string | null
          reason?: string | null
          success?: number
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          reason?: string | null
          success?: number
          user_agent?: string | null
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          alt: string | null
          created_at: string
          filename: string
          height: number | null
          id: string
          mime_type: string | null
          path: string
          provider: string
          size_bytes: number | null
          updated_at: string
          uploaded_by: string | null
          url: string
          width: number | null
        }
        Insert: {
          alt?: string | null
          created_at?: string
          filename: string
          height?: number | null
          id: string
          mime_type?: string | null
          path: string
          provider?: string
          size_bytes?: number | null
          updated_at?: string
          uploaded_by?: string | null
          url: string
          width?: number | null
        }
        Update: {
          alt?: string | null
          created_at?: string
          filename?: string
          height?: number | null
          id?: string
          mime_type?: string | null
          path?: string
          provider?: string
          size_bytes?: number | null
          updated_at?: string
          uploaded_by?: string | null
          url?: string
          width?: number | null
        }
        Relationships: []
      }
      seo_pages: {
        Row: {
          canonical_url: string | null
          created_at: string
          description: string | null
          id: string
          og_image: string | null
          page_key: string
          path: string
          robots: string
          schema_json: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          canonical_url?: string | null
          created_at?: string
          description?: string | null
          id: string
          og_image?: string | null
          page_key: string
          path?: string
          robots?: string
          schema_json?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          canonical_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          og_image?: string | null
          page_key?: string
          path?: string
          robots?: string
          schema_json?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      seo_proposals: {
        Row: {
          action: string
          after_json: string
          applied_at: string | null
          before_json: string
          created_at: string
          decided_at: string | null
          detail: string
          error: string
          id: string
          kind: string
          severity: string
          source: string
          status: string
          target: string
          title: string
        }
        Insert: {
          action: string
          after_json?: string
          applied_at?: string | null
          before_json?: string
          created_at?: string
          decided_at?: string | null
          detail?: string
          error?: string
          id: string
          kind?: string
          severity?: string
          source?: string
          status?: string
          target?: string
          title?: string
        }
        Update: {
          action?: string
          after_json?: string
          applied_at?: string | null
          before_json?: string
          created_at?: string
          decided_at?: string | null
          detail?: string
          error?: string
          id?: string
          kind?: string
          severity?: string
          source?: string
          status?: string
          target?: string
          title?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          id: string
          is_private: number
          setting_key: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          id: string
          is_private?: number
          setting_key: string
          setting_value?: string
          updated_at?: string
        }
        Update: {
          id?: string
          is_private?: number
          setting_key?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_presence: {
        Row: {
          last_seen: string
          path: string
          session_id: string
        }
        Insert: {
          last_seen?: string
          path: string
          session_id: string
        }
        Update: {
          last_seen?: string
          path?: string
          session_id?: string
        }
        Relationships: []
      }
      site_visits: {
        Row: {
          created_at: string
          id: string
          path: string
          session_id: string
        }
        Insert: {
          created_at?: string
          id: string
          path: string
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          path?: string
          session_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: string | null
          token_hash: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id: string
          ip_address?: string | null
          token_hash: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          token_hash?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          id: string
          is_active: number
          last_login_at: string | null
          password_hash: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          is_active?: number
          last_login_at?: string | null
          password_hash: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          is_active?: number
          last_login_at?: string | null
          password_hash?: string
          role?: string
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
