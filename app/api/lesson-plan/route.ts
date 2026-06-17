import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth/profile";
import { formatK12KnowledgeContext } from "@/lib/k12-knowledge/context";
import { getK12KnowledgeContextByCode } from "@/lib/k12-knowledge/queries";
import { generateLessonPlan } from "@/lib/lesson-plan";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

type RequestBody = {
  code?: string;
  name?: string;
  description?: string;
};

export async function POST(request: Request) {
  try {
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
      return NextResponse.json({ error: "仅教师账号可生成教案" }, { status: 403 });
    }

    const body = (await request.json()) as RequestBody;
    const code = body.code?.trim();
    const name = body.name?.trim();
    const description = body.description?.trim();

    if (!code) {
      return NextResponse.json({ error: "缺少知识点编码（code）" }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: "缺少知识点名称（name）" }, { status: 400 });
    }
    if (!description) {
      return NextResponse.json({ error: "缺少知识点说明（description）" }, { status: 400 });
    }

    const knowledgeContext = await getK12KnowledgeContextByCode(code, supabase);
    const lessonPlan = await generateLessonPlan({
      code,
      name,
      description,
      knowledgeContext: formatK12KnowledgeContext(knowledgeContext),
    });
    const { data: savedRecord, error: saveError } = await supabase
      .from("lesson_plans")
      .insert({
        user_id: user.id,
        knowledge_point_code: code,
        knowledge_point_name: name,
        content: lessonPlan,
      })
      .select("id, created_at")
      .single();

    if (saveError) {
      throw saveError;
    }

    return NextResponse.json({ lessonPlan, record: savedRecord });
  } catch (err) {
    console.error("[lesson-plan]", err);
    return NextResponse.json(
      { error: "生成教案失败，请稍后重试" },
      { status: 500 }
    );
  }
}
