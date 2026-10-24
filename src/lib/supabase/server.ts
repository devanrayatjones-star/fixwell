import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseUrl, supabasePublishableKey } from "./env";

/**
 * Supabase client tied to the visitor's login cookies. Used only for
 * authentication (who is logged in); data access goes through db().
 */
export async function createAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl(), supabasePublishableKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a page render, where cookies can't be set. The proxy
          // refreshes sessions, so this is safe to ignore.
        }
      },
    },
  });
}
