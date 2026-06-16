import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth/profile";
import { normalizeEditedCoursewareJson } from "@/lib/courseware-edit";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type RequestBody = {
  contentJson?: unknown;
};

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as RequestBody;

    if (!id || !body.contentJson) {
      return NextResponse.json({ error: "缺少课件内容" }, { status: 400 });
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
      return NextResponse.json({ error: "仅教师账号可编辑课件" }, { status: 403 });
    }

    const { data: record, error: recordError } = await supabase
      .from("coursewares")
      .select("id, knowledge_point_code, knowledge_point_name, subject, grade, semester, chapter")
      .eq("id", id)
      .maybeSingle();

    if (recordError) {
      throw recordError;
    }

    if (!record) {
      return NextResponse.json({ error: "未找到课件" }, { status: 404 });
    }

    const contentJson = normalizeEditedCoursewareJson(body.contentJson, {
      knowledge_point_code: record.knowledge_point_code,
      knowledge_point_name: record.knowledge_point_name,
      subject: record.subject,
      grade: record.grade,
      semester: record.semester,
      chapter: record.chapter,
    });

    const { error } = await supabase
      .from("coursewares")
      .update({
        content_json: contentJson,
        is_published: false,
        published_at: null,
      })
      .eq("id", id)
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("[courseware-edit]", error);
    return NextResponse.json({ error: "课件编辑保存失败" }, { status: 500 });
  }
}
