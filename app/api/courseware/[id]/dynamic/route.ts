import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth/profile";
import { getAIModelConfig } from "@/lib/ai";
import { generateCoursewareInteractiveHtml } from "@/lib/courseware-html";
import { generateCoursewareJson } from "@/lib/courseware-json";
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
  contentMarkdown?: string;
};

function clean(value: string | undefined) {
  return value?.trim() ?? "";
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as RequestBody;
    const editedMarkdown = clean(body.contentMarkdown);

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
      return NextResponse.json({ error: "只有教师账号可以生成动态课件" }, { status: 403 });
    }

    const { data: record, error: recordError } = await supabase
      .from("coursewares")
      .select(
        "id, knowledge_point_code, knowledge_point_name, subject, grade, semester, chapter, content_markdown"
      )
      .eq("id", id)
      .maybeSingle();

    if (recordError) {
      throw recordError;
    }

    if (!record) {
      return NextResponse.json({ error: "未找到该课件记录" }, { status: 404 });
    }

    const contentMarkdown = editedMarkdown || clean(record.content_markdown);
    if (!contentMarkdown) {
      return NextResponse.json(
        { error: "课件文本为空，请先生成或填写文本课件" },
        { status: 400 }
      );
    }

    const generatedCoursewareJson = await generateCoursewareJson({
      subject: record.subject,
      grade: record.grade,
      semester: record.semester,
      chapter: record.chapter,
      knowledge_point_code: record.knowledge_point_code,
      knowledge_point_name: record.knowledge_point_name,
      description: `${record.chapter} · ${record.knowledge_point_name}`,
      content_markdown: contentMarkdown,
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
    } satisfies typeof generatedCoursewareJson;

    const admin = createAdminClient();
    const { error: updateError } = await admin
      .from("coursewares")
      .update({
        content_markdown: contentMarkdown,
        content_json: coursewareJson,
        is_published: false,
        published_at: null,
      })
      .eq("id", id)
      .select("id")
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ coursewareJson, record: { id } });
  } catch (error) {
    console.error("[courseware-dynamic]", error);
    const detail = error instanceof Error ? error.message : JSON.stringify(error);

    return NextResponse.json(
      { error: `生成动态课件失败：${detail}` },
      { status: 500 }
    );
  }
}
