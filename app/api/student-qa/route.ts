import { NextResponse } from "next/server";
import { generateStudentAnswer } from "@/lib/student-qa";

export const maxDuration = 60;

type RequestBody = {
  question?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    const question = body.question?.trim();

    if (!question) {
      return NextResponse.json({ error: "缺少问题（question）" }, { status: 400 });
    }

    const answer = await generateStudentAnswer({ question });

    return NextResponse.json({ answer });
  } catch (err) {
    console.error("[student-qa]", err);
    return NextResponse.json({ error: "答疑失败，请稍后重试" }, { status: 500 });
  }
}
