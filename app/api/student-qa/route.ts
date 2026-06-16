import { NextResponse } from "next/server";
import { generateStudentAnswer } from "@/lib/student-qa";
import { getProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

type RequestBody = {
  question?: string;
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
    if (!profile || profile.role !== "student") {
      return NextResponse.json({ error: "仅学生账号可使用答疑" }, { status: 403 });
    }

    const body = (await request.json()) as RequestBody;
    const question = body.question?.trim();

    if (!question) {
      return NextResponse.json({ error: "缺少问题（question）" }, { status: 400 });
    }

    const answer = await generateStudentAnswer({ question });
    const { data: savedRecord, error: saveError } = await supabase
      .from("qa_records")
      .insert({
        user_id: user.id,
        question,
        answer,
      })
      .select("id, created_at")
      .single();

    if (saveError) {
      throw saveError;
    }

    return NextResponse.json({ answer, record: savedRecord });
  } catch (err) {
    console.error("[student-qa]", err);
    return NextResponse.json({ error: "答疑失败，请稍后重试" }, { status: 500 });
  }
}
