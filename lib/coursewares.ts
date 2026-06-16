import type { SupabaseClient } from "@supabase/supabase-js";

export type CoursewareRecord = {
  id: string;
  user_id: string;
  knowledge_point_code: string;
  knowledge_point_name: string;
  subject: string;
  grade: string;
  semester: string;
  chapter: string;
  content_markdown: string;
  content_json: unknown | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
};

const COURSEWARE_SELECT =
  "id, user_id, knowledge_point_code, knowledge_point_name, subject, grade, semester, chapter, content_markdown, content_json, is_published, published_at, created_at";

export async function listCoursewares(
  supabase: SupabaseClient
): Promise<CoursewareRecord[]> {
  const { data, error } = await supabase
    .from("coursewares")
    .select(COURSEWARE_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as CoursewareRecord[];
}

export async function getCoursewareById(
  supabase: SupabaseClient,
  id: string
): Promise<CoursewareRecord | null> {
  const { data, error } = await supabase
    .from("coursewares")
    .select(COURSEWARE_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as CoursewareRecord | null;
}
