import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { normalizeTeacherReviewAssignmentRequest } from "@/lib/teacher-review-assignment";

type KnowledgePoint = {
  code: string;
  name: string;
};

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "请求体必须是 JSON" }, { status: 400 });
    }

    const validation = normalizeTeacherReviewAssignmentRequest(body);
    if (!validation.ok) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      );
    }

    const { knowledgePointCode, studentIds, dueDate } = validation.value;
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
      return NextResponse.json({ error: "仅教师可以布置复习" }, { status: 403 });
    }

    const { data: knowledgePoint, error: knowledgePointError } = await supabase
      .from("knowledge_points")
      .select("code, name")
      .eq("code", knowledgePointCode)
      .maybeSingle();

    if (knowledgePointError) {
      throw knowledgePointError;
    }

    if (!knowledgePoint) {
      return NextResponse.json({ error: "未找到对应知识点" }, { status: 404 });
    }

    const { data: links, error: linksError } = await supabase
      .from("teacher_student_links")
      .select("student_id")
      .eq("teacher_id", user.id)
      .in("student_id", studentIds);

    if (linksError) {
      throw linksError;
    }

    const linkedStudentIds = new Set((links ?? []).map((link) => link.student_id as string));
    if (linkedStudentIds.size !== studentIds.length) {
      return NextResponse.json(
        { error: "只能给已关联学生布置复习" },
        { status: 403 }
      );
    }

    const point = knowledgePoint as KnowledgePoint;
    const rows = studentIds.map((studentId) => ({
      user_id: studentId,
      source_practice_record_id: null,
      knowledge_point_code: point.code,
      knowledge_point_name: point.name,
      task_type: "teacher_review",
      status: "pending",
      due_date: dueDate,
    }));

    const { data: tasks, error: insertError } = await supabase
      .from("student_review_tasks")
      .insert(rows)
      .select(
        "id, user_id, knowledge_point_code, knowledge_point_name, task_type, status, due_date, created_at"
      );

    if (insertError) {
      throw insertError;
    }

    revalidatePath("/teacher/analytics");
    revalidatePath("/student/review");

    return NextResponse.json({ tasks: tasks ?? [] });
  } catch (error) {
    console.error("[teacher-review-assignment]", error);
    return NextResponse.json(
      { error: "布置复习失败，请稍后重试" },
      { status: 500 }
    );
  }
}
