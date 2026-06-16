import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StudentReviewClient } from "./student-review-client";

export const metadata: Metadata = {
  title: "智能复习 · 知桥AI",
};

export type StudentReviewTask = {
  id: string;
  source_practice_record_id: string | null;
  knowledge_point_code: string;
  knowledge_point_name: string;
  task_type: "mistake_review" | "weekly_review";
  status: "pending" | "completed";
  due_date: string;
  created_at: string;
  completed_at: string | null;
  source_practice_record: {
    courseware_id: string | null;
    practice_item_index: number;
    question: string;
    student_answer: string;
    expected_answer: string;
    is_correct: boolean;
    error_reason: string | null;
  } | null;
};

type SourcePracticeRecord = NonNullable<StudentReviewTask["source_practice_record"]>;

type RawStudentReviewTask = Omit<StudentReviewTask, "source_practice_record"> & {
  source_practice_record: SourcePracticeRecord | SourcePracticeRecord[] | null;
};

type LoadResult =
  | {
      status: "success";
      tasks: StudentReviewTask[];
    }
  | { status: "error"; message: string };

type StudentReviewPageProps = {
  searchParams?: Promise<{
    code?: string;
  }>;
};

function normalizeSourcePracticeRecord(
  value: RawStudentReviewTask["source_practice_record"]
): SourcePracticeRecord | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

async function loadReviewTasks(): Promise<LoadResult> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("student_review_tasks")
      .select(
        "id, source_practice_record_id, knowledge_point_code, knowledge_point_name, task_type, status, due_date, created_at, completed_at, source_practice_record:student_practice_records(courseware_id, practice_item_index, question, student_answer, expected_answer, is_correct, error_reason)"
      )
      .order("status", { ascending: false })
      .order("due_date", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      return { status: "error", message: error.message };
    }

    const tasks = ((data ?? []) as unknown as RawStudentReviewTask[]).map((task) => ({
      ...task,
      source_practice_record: normalizeSourcePracticeRecord(task.source_practice_record),
    }));

    return { status: "success", tasks };
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return { status: "error", message };
  }
}

export default async function StudentReviewPage({ searchParams }: StudentReviewPageProps) {
  const params = (await searchParams) ?? {};
  const focusCode = params.code?.trim() || undefined;
  const result = await loadReviewTasks();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/40">
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <Link
          href="/student"
          className="inline-flex items-center gap-1 text-sm font-medium text-teal-600 transition hover:text-teal-700"
        >
          <span aria-hidden>←</span>
          返回学生学习中心
        </Link>

        <section className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-teal-600">
                知桥AI · 学生端
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                智能复习
              </h1>
              <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">
                根据基础练习记录安排轻量复习，先把错过和容易忘的知识点捡回来。
              </p>
            </div>
            {result.status === "success" ? (
              <span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700 ring-1 ring-teal-600/20">
                {result.tasks.filter((task) => task.status === "pending").length} 个待复习
              </span>
            ) : null}
          </div>

          <div className="mt-8">
            {result.status === "error" ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
                <p className="font-semibold">复习任务查询失败</p>
                <p className="mt-1 break-words">{result.message}</p>
              </div>
            ) : (
              <StudentReviewClient tasks={result.tasks} focusCode={focusCode} />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
