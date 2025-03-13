export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          image_url: string | null
          is_admin: boolean | null
          updated_at: string | null
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          image_url?: string | null
          is_admin?: boolean | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          image_url?: string | null
          is_admin?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      action_paths: {
        Row: {
          id: string
          name: string
          deal_size: string
          user_id: string
          created_at: string | null
          updated_at: string | null
          sales_cycle_days: number
          estimated_value: number
          confidence_factor: number
        }
        Insert: {
          id?: string
          name: string
          deal_size: string
          user_id: string
          created_at?: string | null
          updated_at?: string | null
          sales_cycle_days?: number
          estimated_value?: number
          confidence_factor?: number
        }
        Update: {
          id?: string
          name?: string
          deal_size?: string
          user_id?: string
          created_at?: string | null
          updated_at?: string | null
          sales_cycle_days?: number
          estimated_value?: number
          confidence_factor?: number
        }
        Relationships: [
          {
            foreignKeyName: "action_paths_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      actions: {
        Row: {
          id: string
          title: string
          description: string
          category: string
          target_date: string
          assigned_to: string | null
          action_path_id: string | null
          methodology: string | null
          source: string | null
          user_id: string
          created_at: string | null
          updated_at: string | null
          account: string
          tags: string[] | null
        }
        Insert: {
          id?: string
          title: string
          description: string
          category: string
          target_date: string
          assigned_to?: string | null
          action_path_id?: string | null
          methodology?: string | null
          source?: string | null
          user_id: string
          created_at?: string | null
          updated_at?: string | null
          account?: string
          tags?: string[] | null
        }
        Update: {
          id?: string
          title?: string
          description?: string
          category?: string
          target_date?: string
          assigned_to?: string | null
          action_path_id?: string | null
          methodology?: string | null
          source?: string | null
          user_id?: string
          created_at?: string | null
          updated_at?: string | null
          account?: string
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "actions_action_path_id_fkey"
            columns: ["action_path_id"]
            isOneToOne: false
            referencedRelation: "action_paths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
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
      [_ in never]: never
    }
  }
}