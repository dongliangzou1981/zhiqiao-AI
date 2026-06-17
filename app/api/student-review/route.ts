import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth/profile";
import { refreshStudentKnowledgeMastery } from "@/lib/student-mastery";
import { createClient } from "@/lib/supabase/server";

type RequestBody = {
  taskId?: string;
};

type SourcePracticeRecord = {
  courseware_id: string | null;
  practice_item_index: number;
  question: string;
  student_answer: string;
  expected_answer: string;
  is_correct: boolean;
  error_reason: string | null;
};

type ReviewTaskPayload = {
  id: string;
  source_practice_record_id: string | null;
  knowledge_point_code: string;
  knowledge_point_name: string;
  task_type: "mistake_review" | "weekly_review" | "teacher_review";
  status: "pending" | "completed";
  due_date: string;
  created_at: string;
  completed_at: string | null;
  source_practice_record: SourcePracticeRecord | SourcePracticeRecord[] | null;
};

function clean(value: string | undefined) {
  return value?.trim() ?? "";
}

function normalizeSourcePracticeRecord(value: ReviewTaskPayload["source_practice_record"]) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    const taskId = clean(body.taskId);

    if (!taskId) {
      return NextResponse.json({ error: "缺少复习任务编号" }, { status: 400 });
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
    if (!profile || profile.role !== "student") {
      return NextResponse.json({ error: "仅学生可以完成复习任务" }, { status: 403 });
    }

    const { data: task, error } = await supabase
      .from("student_review_tasks")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", taskId)
      .eq("user_id", user.id)
      .select(
        "id, source_practice_record_id, knowledge_point_code, knowledge_point_name, task_type, status, due_date, created_at, completed_at, source_practice_record:student_practice_records(courseware_id, practice_item_index, question, student_answer, expected_answer, is_correct, error_reason)"
      )
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!task) {
      return NextResponse.json(
        { error: "未找到可完成的复习任务" },
        { status: 404 }
      );
    }

    await refreshStudentKnowledgeMastery(
      supabase,
      user.id,
      task.knowledge_point_code
    );

    const normalizedTask = {
      ...(task as ReviewTaskPayload),
      source_practice_record: normalizeSourcePracticeRecord(
        (task as ReviewTaskPayload).source_practice_record
      ),
    };

    return NextResponse.json({ task: normalizedTask });
  } catch (error) {
    console.error("[student-review]", error);
    return NextResponse.json(
      { error: "完成复习任务失败，请稍后重试" },
      { status: 500 }
    );
  }
}
