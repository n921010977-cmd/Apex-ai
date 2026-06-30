export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string | null;
          email: string;
          password_hash: string | null;
          avatar_url: string | null;
          is_verified: boolean;
          last_login: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["users"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string | null;
          owner_id: string | null;
          plan: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["organizations"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["organizations"]["Insert"]>;
      };
      members: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string;
          role: string;
          permissions: Json;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["members"]["Row"], "id" | "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["members"]["Insert"]>;
      };
      agents: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          type: string;
          system_prompt: string | null;
          model: string;
          temperature: number;
          max_tokens: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["agents"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["agents"]["Insert"]>;
      };
      projects: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string | null;
          name: string;
          description: string | null;
          industry: string | null;
          stage: string | null;
          goals: Json;
          target_revenue: string | null;
          timeframe: string | null;
          overall_score: number;
          status: string;
          ai_results: Json;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["projects"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
      };
      conversations: {
        Row: {
          id: string;
          organization_id: string;
          agent_id: string | null;
          user_id: string | null;
          project_id: string | null;
          title: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["conversations"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["conversations"]["Insert"]>;
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: string;
          content: string;
          tokens_used: number;
          metadata: Json;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["messages"]["Row"], "id" | "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
      };
      tasks: {
        Row: {
          id: string;
          project_id: string | null;
          organization_id: string;
          title: string;
          description: string | null;
          status: string;
          priority: string;
          assigned_to: string | null;
          due_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["tasks"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>;
      };
      subscriptions: {
        Row: {
          id: string;
          organization_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          plan: string;
          status: string;
          current_period_start: string | null;
          current_period_end: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["subscriptions"]["Row"], "id" | "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
      };
      usage_stats: {
        Row: {
          id: string;
          organization_id: string;
          date: string;
          messages_count: number;
          tokens_used: number;
          agent_runs: number;
          tool_calls: number;
        };
        Insert: Omit<Database["public"]["Tables"]["usage_stats"]["Row"], "id"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["usage_stats"]["Insert"]>;
      };
      activity_logs: {
        Row: {
          id: string;
          organization_id: string | null;
          user_id: string | null;
          type: string;
          data: Json;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["activity_logs"]["Row"], "id" | "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["activity_logs"]["Insert"]>;
      };
      api_keys: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          key_hash: string;
          last_used_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["api_keys"]["Row"], "id" | "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["api_keys"]["Insert"]>;
      };
    };
    Views: Record<string, unknown>;
    Functions: Record<string, unknown>;
    Enums: Record<string, unknown>;
  };
}

// Convenience row types
export type UserRow = Database["public"]["Tables"]["users"]["Row"];
export type OrgRow = Database["public"]["Tables"]["organizations"]["Row"];
export type MemberRow = Database["public"]["Tables"]["members"]["Row"];
export type AgentRow = Database["public"]["Tables"]["agents"]["Row"];
export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
export type ConversationRow = Database["public"]["Tables"]["conversations"]["Row"];
export type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
export type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
export type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];
export type UsageStatsRow = Database["public"]["Tables"]["usage_stats"]["Row"];
