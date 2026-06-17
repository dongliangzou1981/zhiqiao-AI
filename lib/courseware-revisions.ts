import type { SupabaseClient } from "@supabase/supabase-js";
import type { CoursewareQualityReport } from "@/lib/courseware-quality";

export type CoursewareRevisionStatus = "pending" | "applied" | "discarded";

export type CoursewareRevisionSummary = {
  id: string;
  status: string | null;
  created_at: string;
};

export type PendingRevisionDiscardUpdate = {
  id: string;
  status: "discarded";
};

export type CoursewareRevisionRecord = {
  id: string;
  courseware_id: string;
  user_id: string;
  source_content_json: unknown;
  candidate_content_json: unknown;
  instruction: string | null;
  quality_before: CoursewareQualityReport | null;
  quality_after: CoursewareQualityReport | null;
  status: CoursewareRevisionStatus;
  created_at: string;
  applied_at: string | null;
};

export function normalizeCoursewareRevisionStatus(
  value: unknown
): CoursewareRevisionStatus | null {
  return value === "pending" || value === "applied" || value === "discarded" ? value : null;
}

export function getLatestPendingCoursewareRevision<T extends CoursewareRevisionSummary>(
  revisions: T[]
): T | null {
  const pending = revisions.filter((revision) => revision.status === "pending");

  pending.sort((left, right) => {
    const rightTime = new Date(right.created_at).getTime();
    const leftTime = new Date(left.created_at).getTime();
    return rightTime - leftTime;
  });

  return pending[0] ?? null;
}

export function buildDiscardPendingRevisionUpdates(
  revisions: CoursewareRevisionSummary[]
): PendingRevisionDiscardUpdate[] {
  return revisions
    .filter((revision) => revision.status === "pending")
    .map((revision) => ({
      id: revision.id,
      status: "discarded",
    }));
}

export async function getLatestPendingCoursewareRevisionRecord(
  supabase: SupabaseClient,
  coursewareId: string
): Promise<CoursewareRevisionRecord | null> {
  const { data, error } = await supabase
    .from("courseware_revisions")
    .select(
      "id, courseware_id, user_id, source_content_json, candidate_content_json, instruction, quality_before, quality_after, status, created_at, applied_at"
    )
    .eq("courseware_id", coursewareId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (
      typeof error.message === "string" &&
      /courseware_revisions|schema cache|does not exist/i.test(error.message)
    ) {
      return null;
    }

    throw error;
  }

  if (!data || normalizeCoursewareRevisionStatus(data.status) !== "pending") {
    return null;
  }

  return {
    ...data,
    status: "pending",
    quality_before: (data.quality_before as CoursewareQualityReport | null) ?? null,
    quality_after: (data.quality_after as CoursewareQualityReport | null) ?? null,
  } satisfies CoursewareRevisionRecord;
}
