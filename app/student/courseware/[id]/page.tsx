import type { Metadata } from "next";
import Link from "next/link";
import { normalizeCoursewareStoryboardsForDisplay } from "@/lib/courseware-storyboard";
import type { CoursewareJson } from "@/lib/courseware-types";
import { createClient } from "@/lib/supabase/server";
import { CoursewarePlayerClient } from "./courseware-player-client";
import type { StudentCoursewareFeedback } from "./student-courseware-feedback-panel";

export const metadata: Metadata = {
  title: "课件学习 · 知桥AI",
};

type CoursewarePlayerPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    practice?: string;
  }>;
};

type StudentPracticeRecord = {
  id: string;
  courseware_id: string | null;
  knowledge_point_code: string;
  practice_item_index: number;
  student_answer: string;
  expected_answer: string;
  is_correct: boolean;
  error_reason: string | null;
  created_at: string;
};

type StudentCoursewareProgress = {
  id: string;
  courseware_id: string;
  knowledge_point_code: string;
  last_slide_index: number;
  slide_count: number;
  status: "in_progress" | "completed";
  last_viewed_at: string;
  completed_at: string | null;
};

type StudentCoursewareFeedbackRow = StudentCoursewareFeedback;

function isCoursewareJson(value: unknown): value is CoursewareJson {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      (value as { version?: unknown }).version === "courseware_json_v1"
  );
}

function parsePracticeIndex(value: string | undefined, itemCount: number): number | null {
  if (!value) return null;

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed >= itemCount) {
    return null;
  }

  return parsed;
}

export default async function CoursewarePlayerPage({
  params,
  searchParams,
}: CoursewarePlayerPageProps) {
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const supabase = await createClient();

  const { data: courseware, error: coursewareError } = await supabase
    .from("coursewares")
    .select("id, content_json, created_at")
    .eq("id", id)
    .eq("is_published", true)
    .not("content_json", "is", null)
    .maybeSingle();

  if (coursewareError) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-12 text-white">
        <div className="mx-auto max-w-2xl rounded-2xl border border-rose-300/30 bg-rose-500/10 p-8">
          <p className="font-semibold text-rose-100">课件读取失败</p>
          <p className="mt-2 text-sm text-rose-100/80">{coursewareError.message}</p>
          <Link
            href="/student/knowledge"
            className="mt-5 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900"
          >
            返回知识点学习
          </Link>
        </div>
      </div>
    );
  }

  if (!courseware || !isCoursewareJson(courseware.content_json)) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-12 text-white">
        <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center">
          <p className="text-lg font-semibold">暂时无法学习该课件</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            课件可能尚未发布，或老师正在调整内容。可以先回到知识点学习页查看其他内容。
          </p>
          <Link
            href="/student/knowledge"
            className="mt-5 inline-flex rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white"
          >
            返回知识点学习
          </Link>
        </div>
      </div>
    );
  }

  const { data: practiceRecords, error: practiceError } = await supabase
    .from("student_practice_records")
    .select(
      "id, courseware_id, knowledge_point_code, practice_item_index, student_answer, expected_answer, is_correct, error_reason, created_at"
    )
    .eq("courseware_id", id)
    .order("created_at", { ascending: false });

  if (practiceError) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-12 text-white">
        <div className="mx-auto max-w-2xl rounded-2xl border border-rose-300/30 bg-rose-500/10 p-8">
          <p className="font-semibold text-rose-100">练习记录读取失败</p>
          <p className="mt-2 text-sm text-rose-100/80">{practiceError.message}</p>
          <Link
            href="/student/knowledge"
            className="mt-5 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900"
          >
            返回知识点学习
          </Link>
        </div>
      </div>
    );
  }

  const latestPracticeRecords = new Map<string, StudentPracticeRecord>();
  for (const record of (practiceRecords ?? []) as StudentPracticeRecord[]) {
    const key = `${record.courseware_id ?? "none"}:${record.practice_item_index}`;
    if (!latestPracticeRecords.has(key)) {
      latestPracticeRecords.set(key, record);
    }
  }

  const { data: progress } = await supabase
    .from("student_courseware_progress")
    .select(
      "id, courseware_id, knowledge_point_code, last_slide_index, slide_count, status, last_viewed_at, completed_at"
    )
    .eq("courseware_id", id)
    .maybeSingle();

  const { data: feedback } = await supabase
    .from("student_courseware_feedback")
    .select(
      "id, courseware_id, knowledge_point_code, knowledge_point_name, understanding_level, need_teacher_help, feedback_text, updated_at"
    )
    .eq("courseware_id", id)
    .maybeSingle();

  const displayCourseware = normalizeCoursewareStoryboardsForDisplay(courseware.content_json);

  return (
    <CoursewarePlayerClient
      coursewareId={courseware.id as string}
      courseware={displayCourseware}
      practiceRecords={Array.from(latestPracticeRecords.values())}
      createdAt={courseware.created_at as string}
      initialProgress={(progress as StudentCoursewareProgress | null) ?? null}
      initialFeedback={(feedback as StudentCoursewareFeedbackRow | null) ?? null}
      focusPracticeIndex={parsePracticeIndex(
        query.practice,
        displayCourseware.practice_items.length
      )}
    />
  );
}
