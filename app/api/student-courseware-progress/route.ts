import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth/profile";
import type { CoursewareJson } from "@/lib/courseware-types";
import { refreshStudentKnowledgeMastery } from "@/lib/student-mastery";
import { createClient } from "@/lib/supabase/server";

type RequestBody = {
  coursewareId?: string;
  lastSlideIndex?: number;
  slideCount?: number;
  completed?: boolean;
};

function clean(value: string | undefined) {
  return value?.trim() ?? "";
}

function isCoursewareJson(value: unknown): value is CoursewareJson {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      (value as { version?: unknown }).version === "courseware_json_v1"
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    const coursewareId = clean(body.coursewareId);
    const lastSlideIndex = Number(body.lastSlideIndex);
    const slideCount = Number(body.slideCount);
    const completed = Boolean(body.completed);

    if (
      !coursewareId ||
      !Number.isInteger(lastSlideIndex) ||
      lastSlideIndex < 0 ||
      !Number.isInteger(slideCount) ||
      slideCount < 1
    ) {
      return NextResponse.json({ error: "缺少有效的课件进度" }, { status: 400 });
    }

    const boundedSlideIndex = Math.min(lastSlideIndex, slideCount - 1);
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
      return NextResponse.json({ error: "仅学生可以记录课件学习进度" }, { status: 403 });
    }

    const { data: courseware, error: coursewareError } = await supabase
      .from("coursewares")
      .select("id, knowledge_point_code, knowledge_point_name, content_json")
      .eq("id", coursewareId)
      .eq("is_published", true)
      .not("content_json", "is", null)
      .maybeSingle();

    if (coursewareError) {
      throw coursewareError;
    }

    if (!courseware || !isCoursewareJson(courseware.content_json)) {
      return NextResponse.json({ error: "未找到可学习的已发布课件" }, { status: 404 });
    }

    const progressSelect =
      "id, courseware_id, knowledge_point_code, last_slide_index, slide_count, status, last_viewed_at, completed_at";
    const now = new Date().toISOString();
    const { data: existingProgress, error: existingError } = await supabase
      .from("student_courseware_progress")
      .select("id, status, completed_at")
      .eq("courseware_id", courseware.id)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    const nextCompleted = completed || existingProgress?.status === "completed";
    const savePayload = {
      last_slide_index: boundedSlideIndex,
      slide_count: slideCount,
      status: nextCompleted ? "completed" : "in_progress",
      last_viewed_at: now,
      ...(completed && !existingProgress?.completed_at ? { completed_at: now } : {}),
    };

    const { data: progress, error: saveError } = existingProgress
      ? await supabase
          .from("student_courseware_progress")
          .update(savePayload)
          .eq("id", existingProgress.id)
          .select(progressSelect)
          .single()
      : await supabase
          .from("student_courseware_progress")
          .insert({
            user_id: user.id,
            courseware_id: courseware.id,
            knowledge_point_code: courseware.knowledge_point_code,
            knowledge_point_name: courseware.knowledge_point_name,
            ...savePayload,
            completed_at: completed ? now : null,
          })
          .select(progressSelect)
          .single();

    if (saveError) {
      throw saveError;
    }

    try {
      await refreshStudentKnowledgeMastery(
        supabase,
        user.id,
        courseware.knowledge_point_code
      );
    } catch (masteryError) {
      console.error("[student-courseware-progress:mastery-refresh]", masteryError);
    }

    return NextResponse.json({ progress });
  } catch (error) {
    console.error("[student-courseware-progress]", error);
    return NextResponse.json(
      { error: "保存课件学习进度失败，请稍后重试" },
      { status: 500 }
    );
  }
}
