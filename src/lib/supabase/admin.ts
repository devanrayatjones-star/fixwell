import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl, supabaseSecretKey } from "./env";

let client: SupabaseClient | null = null;

/**
 * Server-only database client using the secret key. It bypasses Row Level
 * Security, so every caller must check permissions first (see lib/auth.ts).
 * The "server-only" import makes the build fail if this is ever pulled into
 * browser code.
 */
export function db(): SupabaseClient {
  if (!client) {
    client = createClient(supabaseUrl(), supabaseSecretKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export function publicPhotoUrl(path: string): string {
  return db().storage.from("photos").getPublicUrl(path).data.publicUrl;
}
