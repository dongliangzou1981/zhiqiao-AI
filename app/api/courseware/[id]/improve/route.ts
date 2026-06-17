import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth/profile";
import { getAIModelConfig } from "@/lib/ai";
import { generateCoursewareInteractiveHtml } from "@/lib/courseware-html";
import {
  buildCoursewareJsonReference,
  buildCoursewareQualityImprovementFeedback,
} from "@/lib/courseware-improvement";
import { generateCoursewareJson } from "@/lib/courseware-json";
import type { CoursewareJson } from "@/lib/courseware-types";
import { assessCoursewareQuality } from "@/lib/courseware-quality";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type RequestBody = {
  instruction?: string;
};

function clean(value: string | undefined) {
  return value?.trim() ?? "";
}

function isCoursewareJson(value: unknown): value is CoursewareJson {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      (value as { version?: unknown }).version === "courseware_json_v1"
  );
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as RequestBody;
    const extraInstruction = clean(body.instruction);

    if (!id) {
      return NextResponse.json({ error: "缺少课件 id" }, { status: 400 });
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
      return NextResponse.json({ error: "只有教师可以优化课件" }, { status: 403 });
    }

    const { data: record, error: recordError } = await supabase
      .from("coursewares")
      .select(
        "id, knowledge_point_code, knowledge_point_name, subject, grade, semester, chapter, content_markdown, content_json"
      )
      .eq("id", id)
      .maybeSingle();

    if (recordError) {
      throw recordError;
    }

    if (!record) {
      return NextResponse.json({ error: "未找到该课件" }, { status: 404 });
    }

    const contentMarkdown = clean(record.content_markdown);
    if (!contentMarkdown) {
      return NextResponse.json(
        { error: "课件正文为空，无法按质量问题优化" },
        { status: 400 }
      );
    }

    const currentJson = isCoursewareJson(record.content_json) ? record.content_json : null;
    if (!currentJson) {
      return NextResponse.json(
        { error: "当前课件还没有结构化内容，无法生成优化候选版" },
        { status: 400 }
      );
    }

    const currentQuality = currentJson ? assessCoursewareQuality(currentJson) : null;
    const qualityFeedback = buildCoursewareQualityImprovementFeedback(
      currentQuality,
      extraInstruction
    );
    const referenceCoursewareJson = buildCoursewareJsonReference(currentJson);

    const generatedCoursewareJson = await generateCoursewareJson({
      subject: record.subject,
      grade: record.grade,
      semester: record.semester,
      chapter: record.chapter,
      knowledge_point_code: record.knowledge_point_code,
      knowledge_point_name: record.knowledge_point_name,
      description: `${record.chapter} - ${record.knowledge_point_name}`,
      content_markdown: contentMarkdown,
      quality_feedback: qualityFeedback,
      reference_courseware_json: referenceCoursewareJson,
    });
    const jsonConfig = getAIModelConfig("courseware-json");

    const generatedInteractiveHtml = await generateCoursewareInteractiveHtml({
      subject: record.subject,
      grade: record.grade,
      semester: record.semester,
      chapter: record.chapter,
      knowledge_point_code: record.knowledge_point_code,
      knowledge_point_name: record.knowledge_point_name,
      description: `${record.chapter} - ${record.knowledge_point_name}`,
      content_markdown: contentMarkdown,
      structured_courseware: generatedCoursewareJson,
    });
    const htmlConfig = getAIModelConfig("courseware-html");
    const contentQuality = assessCoursewareQuality({
      ...generatedCoursewareJson,
      interactive_html: generatedInteractiveHtml,
    });

    const coursewareJson = {
      ...generatedCoursewareJson,
      interactive_html: generatedInteractiveHtml,
      asset_metadata: {
        source_type: "teacher_generated",
        visibility: "private",
        quality_status: "draft",
        license_status: "private_use",
        creator_type: "teacher",
        generated_by: {
          markdown_provider: "teacher_confirmed",
          markdown_model: "confirmed_markdown",
          json_provider: jsonConfig.provider,
          json_model: jsonConfig.model,
          html_provider: htmlConfig.provider,
          html_model: htmlConfig.model,
        },
        generated_at: new Date().toISOString(),
        content_quality: contentQuality,
      },
    } satisfies CoursewareJson;

    const admin = createAdminClient();
    const { error: discardOldPendingError } = await admin
      .from("courseware_revisions")
      .update({
        status: "discarded",
      })
      .eq("courseware_id", id)
      .eq("user_id", user.id)
      .eq("status", "pending");

    if (discardOldPendingError) {
      throw discardOldPendingError;
    }

    const { data: revision, error: insertRevisionError } = await admin
      .from("courseware_revisions")
      .insert({
        courseware_id: id,
        user_id: user.id,
        source_content_json: currentJson,
        candidate_content_json: coursewareJson,
        instruction: extraInstruction || null,
        quality_before: currentQuality,
        quality_after: contentQuality,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertRevisionError) {
      throw insertRevisionError;
    }

    return NextResponse.json({
      record: { id },
      revisionId: revision.id,
      qualityBefore: currentQuality,
      qualityAfter: contentQuality,
    });
  } catch (error) {
    console.error("[courseware-improve]", error);
    const detail = error instanceof Error ? error.message : JSON.stringify(error);

    return NextResponse.json(
      { error: `课件优化失败：${detail}` },
      { status: 500 }
    );
  }
}
