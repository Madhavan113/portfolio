import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabase: SupabaseClient | null = null;

export function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase server credentials are not configured.");
  }

  if (!supabase) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }

  return supabase;
}

