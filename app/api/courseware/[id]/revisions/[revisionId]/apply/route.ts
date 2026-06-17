import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth/profile";
import { assessCoursewareQuality, type CoursewareQualityReport } from "@/lib/courseware-quality";
import { getCoursewareRevisionApplyGuard } from "@/lib/courseware-revision-apply-guard";
import type { CoursewareJson } from "@/lib/courseware-types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
    revisionId: string;
  }>;
};

function isCoursewareJson(value: unknown): value is CoursewareJson {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      (value as { version?: unknown }).version === "courseware_json_v1"
  );
}

function isCoursewareQualityReport(value: unknown): value is CoursewareQualityReport {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      (value as { version?: unknown }).version === "courseware_quality_v1"
  );
}

function readConfirmQualityRisk(value: unknown) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      (value as { confirmQualityRisk?: unknown }).confirmQualityRisk === true
  );
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id, revisionId } = await context.params;
    const body = await request.json().catch(() => null);
    const confirmQualityRisk = readConfirmQualityRisk(body);

    if (!id || !revisionId) {
      return NextResponse.json({ error: "缺少课件或修订记录 id" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const profile = await getProfile(supabase, user.id);
    if (!profile || profile.role !== "teacher") {
      return NextResponse.json({ error: "只有教师可以采用课件优化版本" }, { status: 403 });
    }

    const { data: revision, error: revisionError } = await supabase
      .from("courseware_revisions")
      .select("id, courseware_id, user_id, candidate_content_json, quality_after, status")
      .eq("id", revisionId)
      .eq("courseware_id", id)
      .eq("status", "pending")
      .maybeSingle();

    if (revisionError) {
      throw revisionError;
    }

    if (!revision) {
      return NextResponse.json({ error: "未找到可采用的课件优化版本" }, { status: 404 });
    }

    if (!isCoursewareJson(revision.candidate_content_json)) {
      return NextResponse.json({ error: "优化版本结构异常，无法采用" }, { status: 400 });
    }

    const qualityAfter = isCoursewareQualityReport(revision.quality_after)
      ? revision.quality_after
      : assessCoursewareQuality(revision.candidate_content_json);
    const applyGuard = getCoursewareRevisionApplyGuard(qualityAfter, confirmQualityRisk);

    if (!applyGuard.canApply) {
      return NextResponse.json(
        {
          error: applyGuard.message,
          requiresQualityRiskConfirmation: applyGuard.requiresRiskConfirmation,
        },
        { status: 409 }
      );
    }

    const admin = createAdminClient();
    const { error: updateCoursewareError } = await admin
      .from("coursewares")
      .update({
        content_json: revision.candidate_content_json,
        is_published: false,
        published_at: null,
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id")
      .single();

    if (updateCoursewareError) {
      throw updateCoursewareError;
    }

    const { error: updateRevisionError } = await admin
      .from("courseware_revisions")
      .update({
        status: "applied",
        applied_at: new Date().toISOString(),
      })
      .eq("id", revisionId)
      .eq("courseware_id", id)
      .eq("user_id", user.id)
      .eq("status", "pending");

    if (updateRevisionError) {
      throw updateRevisionError;
    }

    return NextResponse.json({ applied: true, record: { id }, revision: { id: revisionId } });
  } catch (error) {
    console.error("[courseware-revision-apply]", error);
    const detail = error instanceof Error ? error.message : JSON.stringify(error);

    return NextResponse.json(
      { error: `采用课件优化版本失败：${detail}` },
      { status: 500 }
    );
  }
}
