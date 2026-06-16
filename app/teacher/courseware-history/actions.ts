"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/profile";
import { getCoursewareAssetMetadata } from "@/lib/courseware-asset";
import type { CoursewareJson } from "@/lib/courseware-types";
import { createClient } from "@/lib/supabase/server";

function getRequiredString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isCoursewareJson(value: unknown): value is CoursewareJson {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      (value as { version?: unknown }).version === "courseware_json_v1"
  );
}

export async function setCoursewarePublishedAction(formData: FormData) {
  const id = getRequiredString(formData, "id");
  const isPublished = getRequiredString(formData, "isPublished") === "true";

  if (!id) {
    redirect("/teacher/courseware-history");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(`/auth/login?redirect=/teacher/courseware-history/${id}`);
  }

  const profile = await getProfile(supabase, user.id);
  if (!profile || profile.role !== "teacher") {
    redirect("/teacher");
  }

  const { data: existingRecord, error: readError } = await supabase
    .from("coursewares")
    .select("content_json")
    .eq("id", id)
    .maybeSingle();

  if (readError) {
    redirect(`/teacher/courseware-history/${id}?publish=failed`);
  }

  const contentJson = isCoursewareJson(existingRecord?.content_json)
    ? {
        ...existingRecord.content_json,
        asset_metadata: {
          ...getCoursewareAssetMetadata(existingRecord.content_json),
          visibility: isPublished ? "class" : "private",
          quality_status: isPublished ? "teacher_verified" : "draft",
        },
      }
    : existingRecord?.content_json;

  const { error } = await supabase
    .from("coursewares")
    .update({
      is_published: isPublished,
      published_at: isPublished ? new Date().toISOString() : null,
      content_json: contentJson,
    })
    .eq("id", id)
    .select("id")
    .single();

  const status = error ? "failed" : isPublished ? "published" : "unpublished";

  revalidatePath("/teacher/courseware-history");
  revalidatePath(`/teacher/courseware-history/${id}`);
  revalidatePath("/student/knowledge");
  redirect(`/teacher/courseware-history/${id}?publish=${status}`);
}
