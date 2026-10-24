import "server-only";
import { redirect } from "next/navigation";
import { adminEmails } from "./config";
import { db } from "./supabase/admin";
import { createAuthClient } from "./supabase/server";
import type { Tradesperson } from "./types";

/** The logged-in user, verified with Supabase (not just trusted from the cookie). */
export async function currentUser() {
  const supabase = await createAuthClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && adminEmails().includes(email.toLowerCase());
}

export async function requireAdmin() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/admin");
  if (!isAdminEmail(user.email)) redirect("/");
  return user;
}

/** For dashboard pages and actions: the logged-in tradesperson's own record. */
export async function requireTradesperson(): Promise<Tradesperson> {
  const user = await currentUser();
  if (!user) redirect("/login?next=/dashboard");
  const { data } = await db().from("tradespeople").select("*").eq("user_id", user.id).maybeSingle();
  if (!data) {
    if (isAdminEmail(user.email)) redirect("/admin");
    redirect("/join?no_profile=1");
  }
  return data as Tradesperson;
}
