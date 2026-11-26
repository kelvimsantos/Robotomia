import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, anonKey);

export interface Robot {
  id: number;
  name: string;
  energy: number;
  mood: number;
  knowledge: number;
  autonomy: number;
  aspiration: string;
  updated_at: string;
  created_at: string;
}

export interface Memory {
  id: string;
  content: string;
  speaker: 'user' | 'robot' | 'system';
  mood_delta: number;
  knowledge_delta: number;
  created_at: string;
}
