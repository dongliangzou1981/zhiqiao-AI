import { NextResponse } from "next/server";
import { generateKnowledgeExplanation } from "@/lib/knowledge-explain";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

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
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = (await request.json()) as RequestBody;
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

    const content = await generateKnowledgeExplanation({
      subject,
      grade,
      semester,
      chapter,
      knowledge_point_code: code,
      knowledge_point_name: name,
      description,
    });

    const { data: savedRecord, error: saveError } = await supabase
      .from("knowledge_explanations")
      .insert({
        user_id: user.id,
        knowledge_point_code: code,
        knowledge_point_name: name,
        content,
      })
      .select("id")
      .single();

    if (saveError) {
      throw saveError;
    }

    return NextResponse.json({ content, recordId: savedRecord.id });
  } catch (err) {
    console.error("[knowledge-explain]", err);
    return NextResponse.json(
      { error: "知识点讲解生成失败，请稍后重试" },
      { status: 500 }
    );
  }
}
