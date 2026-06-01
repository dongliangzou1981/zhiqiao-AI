import { NextResponse } from "next/server";
import { generateLessonPlan } from "@/lib/deepseek";

export const maxDuration = 60;

type RequestBody = {
  code?: string;
  name?: string;
  description?: string;
};

export async function POST(request: Request) {
  try {
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

    const lessonPlan = await generateLessonPlan({ code, name, description });

    return NextResponse.json({ lessonPlan });
  } catch (err) {
    console.error("[lesson-plan]", err);
    return NextResponse.json(
      { error: "生成教案失败，请稍后重试" },
      { status: 500 }
    );
  }
}
