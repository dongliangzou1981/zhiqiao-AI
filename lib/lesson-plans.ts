import type { SupabaseClient } from "@supabase/supabase-js";

export type LessonPlanRecord = {
  id: string;
  user_id: string;
  knowledge_point_code: string;
  knowledge_point_name: string;
  content: string;
  created_at: string;
};

export async function listLessonPlans(
  supabase: SupabaseClient
): Promise<LessonPlanRecord[]> {
  const { data, error } = await supabase
    .from("lesson_plans")
    .select("id, user_id, knowledge_point_code, knowledge_point_name, content, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as LessonPlanRecord[];
}

export async function getLessonPlanById(
  supabase: SupabaseClient,
  id: string
): Promise<LessonPlanRecord | null> {
  const { data, error } = await supabase
    .from("lesson_plans")
    .select("id, user_id, knowledge_point_code, knowledge_point_name, content, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as LessonPlanRecord | null;
}
