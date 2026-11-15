export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      pages: {
        Row: {
          id: string;
          slug: string;
          title: string;
          content: string;
          category: string | null;
          tags: string[] | null;
          status: "draft" | "pending" | "published" | "rejected";
          author_id: string | null;
          created_at: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          content: string;
          category?: string | null;
          tags?: string[] | null;
          status?: "draft" | "pending" | "published" | "rejected";
          author_id?: string | null;
          created_at?: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          content?: string;
          category?: string | null;
          tags?: string[] | null;
          status?: "draft" | "pending" | "published" | "rejected";
          author_id?: string | null;
          created_at?: string;
          updated_at?: string;
          version?: number;
        };
      };
      page_versions: {
        Row: {
          id: string;
          page_id: string;
          content: string;
          title: string;
          version: number;
          author_id: string | null;
          created_at: string;
          change_summary: string | null;
        };
        Insert: {
          id?: string;
          page_id: string;
          content: string;
          title: string;
          version: number;
          author_id?: string | null;
          created_at?: string;
          change_summary?: string | null;
        };
        Update: {
          id?: string;
          page_id?: string;
          content?: string;
          title?: string;
          version?: number;
          author_id?: string | null;
          created_at?: string;
          change_summary?: string | null;
        };
      };
      profiles: {
        Row: {
          id: string;
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
          role: "user" | "admin" | "moderator";
          created_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: "user" | "admin" | "moderator";
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: "user" | "admin" | "moderator";
          created_at?: string;
        };
      };
    };
  };
}

export type Page = Database["public"]["Tables"]["pages"]["Row"];
export type PageInsert = Database["public"]["Tables"]["pages"]["Insert"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
