import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth/profile";
import { refreshStudentKnowledgeMastery } from "@/lib/student-mastery";
import { createClient } from "@/lib/supabase/server";

type RequestBody = {
  knowledgePointCode?: string;
};

function clean(value: string | undefined) {
  return value?.trim() ?? "";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as RequestBody;
    const knowledgePointCode = clean(body.knowledgePointCode) || undefined;
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const profile = await getProfile(supabase, user.id);
    if (!profile || profile.role !== "student") {
      return NextResponse.json({ error: "仅学生可以刷新自己的掌握度" }, { status: 403 });
    }

    const mastery = await refreshStudentKnowledgeMastery(
      supabase,
      user.id,
      knowledgePointCode
    );

    return NextResponse.json({ mastery });
  } catch (error) {
    console.error("[student-mastery-refresh]", error);
    return NextResponse.json(
      { error: "刷新知识点掌握度失败，请稍后重试" },
      { status: 500 }
    );
  }
}

