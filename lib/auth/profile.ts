import type { SupabaseClient } from "@supabase/supabase-js";

export type UserRole = "teacher" | "student";

export type Profile = {
  id: string;
  role: UserRole;
  display_name: string;
  created_at: string;
};

export function isUserRole(value: string | null | undefined): value is UserRole {
  return value === "teacher" || value === "student";
}

export function getHomePathForRole(role: UserRole): string {
  return role === "teacher" ? "/teacher" : "/student";
}

export async function getProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, display_name, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as Profile | null;
}
