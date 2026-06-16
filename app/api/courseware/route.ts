import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth/profile";
import { generateCourseware } from "@/lib/courseware";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type RequestBody = {
  code?: string;
  name?: string;
  description?: string;
  subject?: string;
  grade?: string;
  semester?: string;
  chapter?: string;
};

function clean(value: string | undefined) {
  return value?.trim() ?? "";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as RequestBody;
    const code = clean(body.code);
    const name = clean(body.name);
    const description = clean(body.description);
    const subject = clean(body.subject);
    const grade = clean(body.grade);
    const semester = clean(body.semester);
    const chapter = clean(body.chapter);

    const required = { code, name, description, subject, grade, semester, chapter };
    const missing = Object.entries(required)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `缺少必要字段：${missing.join(", ")}` },
        { status: 400 }
      );
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
      return NextResponse.json({ error: "只有教师账号可以生成课件" }, { status: 403 });
    }

    const courseware = await generateCourseware({
      subject,
      grade,
      semester,
      chapter,
      knowledge_point_code: code,
      knowledge_point_name: name,
      description,
    });

    const { data: savedRecord, error: saveError } = await supabase
      .from("coursewares")
      .insert({
        user_id: user.id,
        knowledge_point_code: code,
        knowledge_point_name: name,
        subject,
        grade,
        semester,
        chapter,
        content_markdown: courseware,
        content_json: null,
        is_published: false,
        published_at: null,
      })
      .select("id, created_at")
      .single();

    if (saveError) {
      throw saveError;
    }

    return NextResponse.json({ courseware, coursewareJson: null, record: savedRecord });
  } catch (err) {
    console.error("[courseware]", err);
    const detail = err instanceof Error ? err.message : "unknown error";

    return NextResponse.json(
      { error: `生成文本课件失败：${detail}` },
      { status: 500 }
    );
  }
}
