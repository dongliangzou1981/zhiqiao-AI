import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth/profile";
import type { CoursewareJson } from "@/lib/courseware-types";
import { refreshStudentKnowledgeMastery } from "@/lib/student-mastery";
import { createClient } from "@/lib/supabase/server";

type RequestBody = {
  coursewareId?: string;
  practiceItemIndex?: number;
  studentAnswer?: string;
};

function clean(value: string | undefined) {
  return value?.trim() ?? "";
}

function normalizeAnswer(value: string) {
  return value
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[，。；：、,.，\s]/g, "")
    .replace(/（/g, "(")
    .replace(/）/g, ")");
}

function isCoursewareJson(value: unknown): value is CoursewareJson {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      (value as { version?: unknown }).version === "courseware_json_v1"
  );
}

function addDaysDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    const coursewareId = clean(body.coursewareId);
    const studentAnswer = clean(body.studentAnswer);
    const practiceItemIndex = Number(body.practiceItemIndex);

    if (!coursewareId || !Number.isInteger(practiceItemIndex) || practiceItemIndex < 0) {
      return NextResponse.json(
        { error: "缺少有效的课件或题目编号" },
        { status: 400 }
      );
    }

    if (!studentAnswer) {
      return NextResponse.json({ error: "请先填写答案" }, { status: 400 });
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
      return NextResponse.json({ error: "仅学生可以提交基础练习" }, { status: 403 });
    }

    const { data: courseware, error: coursewareError } = await supabase
      .from("coursewares")
      .select("id, knowledge_point_code, knowledge_point_name, content_json")
      .eq("id", coursewareId)
      .maybeSingle();

    if (coursewareError) {
      throw coursewareError;
    }

    if (!courseware || !isCoursewareJson(courseware.content_json)) {
      return NextResponse.json(
        { error: "未找到可练习的已发布课件" },
        { status: 404 }
      );
    }

    const item = courseware.content_json.practice_items[practiceItemIndex];
    if (!item) {
      return NextResponse.json({ error: "未找到该练习题" }, { status: 404 });
    }

    const isCorrect = normalizeAnswer(studentAnswer) === normalizeAnswer(item.answer);
    const errorReason = isCorrect
      ? null
      : "答案与标准答案不一致，请对照解析复盘。";

    const { data: savedRecord, error: saveError } = await supabase
      .from("student_practice_records")
      .insert({
        user_id: user.id,
        courseware_id: courseware.id,
        knowledge_point_code: courseware.knowledge_point_code,
        knowledge_point_name: courseware.knowledge_point_name,
        practice_item_index: practiceItemIndex,
        question: item.question,
        expected_answer: item.answer,
        student_answer: studentAnswer,
        is_correct: isCorrect,
        error_reason: errorReason,
        difficulty: item.difficulty,
      })
      .select(
        "id, courseware_id, knowledge_point_code, practice_item_index, student_answer, expected_answer, is_correct, error_reason, created_at"
      )
      .single();

    if (saveError) {
      throw saveError;
    }

    const reviewTasks = [
      {
        user_id: user.id,
        source_practice_record_id: savedRecord.id,
        knowledge_point_code: courseware.knowledge_point_code,
        knowledge_point_name: courseware.knowledge_point_name,
        task_type: "weekly_review",
        status: "pending",
        due_date: addDaysDate(7),
      },
    ];

    if (!isCorrect) {
      reviewTasks.unshift({
        user_id: user.id,
        source_practice_record_id: savedRecord.id,
        knowledge_point_code: courseware.knowledge_point_code,
        knowledge_point_name: courseware.knowledge_point_name,
        task_type: "mistake_review",
        status: "pending",
        due_date: addDaysDate(1),
      });
    }

    const { error: reviewTaskError } = await supabase
      .from("student_review_tasks")
      .insert(reviewTasks);

    if (reviewTaskError) {
      throw reviewTaskError;
    }

    await refreshStudentKnowledgeMastery(
      supabase,
      user.id,
      courseware.knowledge_point_code
    );

    return NextResponse.json({
      record: savedRecord,
      expectedAnswer: item.answer,
      explanation: item.explanation,
      isCorrect,
      errorReason,
    });
  } catch (error) {
    console.error("[student-practice]", error);
    return NextResponse.json(
      { error: "提交基础练习失败，请稍后重试" },
      { status: 500 }
    );
  }
}
