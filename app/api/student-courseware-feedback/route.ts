import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth/profile";
import type { CoursewareJson } from "@/lib/courseware-types";
import {
  buildCoursewareFeedbackStatus,
  normalizeCoursewareFeedbackLevel,
} from "@/lib/student-courseware-feedback";
import { createClient } from "@/lib/supabase/server";

type RequestBody = {
  coursewareId?: string;
  understandingLevel?: string;
  needTeacherHelp?: boolean;
  feedbackText?: string;
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
    const understandingLevel = normalizeCoursewareFeedbackLevel(body.understandingLevel);
    const needTeacherHelp = Boolean(body.needTeacherHelp);
    const feedbackText = clean(body.feedbackText).slice(0, 600);

    if (!coursewareId || !understandingLevel) {
      return NextResponse.json({ error: "缺少课件或理解反馈参数" }, { status: 400 });
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
      return NextResponse.json({ error: "只有学生可以提交课件理解反馈" }, { status: 403 });
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

    const now = new Date().toISOString();
    const feedbackSelect =
      "id, courseware_id, knowledge_point_code, knowledge_point_name, understanding_level, need_teacher_help, feedback_text, updated_at";
    const feedbackPayload = {
      user_id: user.id,
      courseware_id: courseware.id,
      knowledge_point_code: courseware.knowledge_point_code,
      knowledge_point_name: courseware.knowledge_point_name,
      understanding_level: understandingLevel,
      need_teacher_help: needTeacherHelp,
      feedback_text: feedbackText || null,
      updated_at: now,
    };
    let saveResult = await supabase
      .from("student_courseware_feedback")
      .insert(feedbackPayload)
      .select(feedbackSelect)
      .single();

    if (saveResult.error?.code === "23505") {
      saveResult = await supabase
        .from("student_courseware_feedback")
        .update({
          understanding_level: understandingLevel,
          need_teacher_help: needTeacherHelp,
          feedback_text: feedbackText || null,
          updated_at: now,
        })
        .eq("user_id", user.id)
        .eq("courseware_id", courseware.id)
        .select(feedbackSelect)
        .single();
    }

    if (saveResult.error) {
      throw saveResult.error;
    }

    return NextResponse.json({
      feedback: saveResult.data,
      status: buildCoursewareFeedbackStatus(understandingLevel, needTeacherHelp),
    });
  } catch (error) {
    console.error("[student-courseware-feedback]", error);
    return NextResponse.json(
      { error: "保存课件理解反馈失败，请稍后重试" },
      { status: 500 }
    );
  }
}
