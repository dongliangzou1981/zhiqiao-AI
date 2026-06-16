import type { Metadata } from "next";
import Link from "next/link";
import type { CoursewareJson } from "@/lib/courseware-types";
import { createClient } from "@/lib/supabase/server";
import { StudentKnowledgeClient } from "./student-knowledge-client";

export const metadata: Metadata = {
  title: "知识点讲解 · 知桥AI",
};

type KnowledgePoint = {
  id: string;
  code: string;
  subject: string;
  grade: string;
  semester: string;
  chapter: string;
  name: string;
  description: string;
};

type KnowledgeExplanationRecord = {
  id: string;
  knowledge_point_code: string;
  content: string;
  created_at: string;
};

type CoursewareLearningResource = {
  id: string;
  knowledge_point_code: string;
  content_json: CoursewareJson;
  created_at: string;
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

type LoadResult =
  | {
      status: "success";
      points: KnowledgePoint[];
      explanations: KnowledgeExplanationRecord[];
      coursewares: CoursewareLearningResource[];
      practiceRecords: StudentPracticeRecord[];
    }
  | { status: "error"; message: string };

type StudentKnowledgePageProps = {
  searchParams?: Promise<{
    code?: string;
  }>;
};

function isCoursewareJson(value: unknown): value is CoursewareJson {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      (value as { version?: unknown }).version === "courseware_json_v1"
  );
}

async function loadKnowledgeLearningData(): Promise<LoadResult> {
  try {
    const supabase = await createClient();
    const { data: points, error: pointsError } = await supabase
      .from("knowledge_points")
      .select("id, code, subject, grade, semester, chapter, name, description")
      .order("subject", { ascending: true })
      .order("grade", { ascending: true })
      .order("semester", { ascending: true })
      .order("chapter", { ascending: true })
      .order("name", { ascending: true });

    if (pointsError) {
      return { status: "error", message: pointsError.message };
    }

    const { data: explanations, error: explanationsError } = await supabase
      .from("knowledge_explanations")
      .select("id, knowledge_point_code, content, created_at")
      .order("created_at", { ascending: false });

    if (explanationsError) {
      return { status: "error", message: explanationsError.message };
    }

    const { data: coursewares, error: coursewaresError } = await supabase
      .from("coursewares")
      .select("id, knowledge_point_code, content_json, created_at")
      .eq("is_published", true)
      .not("content_json", "is", null)
      .order("created_at", { ascending: false });

    if (coursewaresError) {
      return { status: "error", message: coursewaresError.message };
    }

    const { data: practiceRecords, error: practiceRecordsError } = await supabase
      .from("student_practice_records")
      .select(
        "id, courseware_id, knowledge_point_code, practice_item_index, student_answer, expected_answer, is_correct, error_reason, created_at"
      )
      .order("created_at", { ascending: false });

    if (practiceRecordsError) {
      return { status: "error", message: practiceRecordsError.message };
    }

    const latestExplanations = new Map<string, KnowledgeExplanationRecord>();
    for (const record of (explanations ?? []) as KnowledgeExplanationRecord[]) {
      if (!latestExplanations.has(record.knowledge_point_code)) {
        latestExplanations.set(record.knowledge_point_code, record);
      }
    }

    const validCoursewares: CoursewareLearningResource[] = [];
    for (const record of coursewares ?? []) {
      const resource = {
        id: record.id as string,
        knowledge_point_code: record.knowledge_point_code as string,
        content_json: record.content_json,
        created_at: record.created_at as string,
      };

      if (isCoursewareJson(resource.content_json)) {
        validCoursewares.push({
          ...resource,
          content_json: resource.content_json,
        });
      }
    }

    const latestPracticeRecords = new Map<string, StudentPracticeRecord>();
    for (const record of (practiceRecords ?? []) as StudentPracticeRecord[]) {
      const key = `${record.courseware_id ?? "none"}:${record.practice_item_index}`;
      if (!latestPracticeRecords.has(key)) {
        latestPracticeRecords.set(key, record);
      }
    }

    return {
      status: "success",
      points: (points ?? []) as KnowledgePoint[],
      explanations: Array.from(latestExplanations.values()),
      coursewares: validCoursewares,
      practiceRecords: Array.from(latestPracticeRecords.values()),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return { status: "error", message };
  }
}

export default async function StudentKnowledgePage({ searchParams }: StudentKnowledgePageProps) {
  const params = (await searchParams) ?? {};
  const initialCode = params.code?.trim() || undefined;
  const result = await loadKnowledgeLearningData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/40">
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
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
                知识点学习
              </h1>
              <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">
                围绕教材基础知识点学习讲解、例题、易错点和基础练习，先把知识点真正弄懂。
              </p>
            </div>
            {result.status === "success" ? (
              <span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700 ring-1 ring-teal-600/20">
                共 {result.points.length} 个知识点
              </span>
            ) : null}
          </div>

          <div className="mt-8">
            {result.status === "error" ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
                <p className="font-semibold">知识点查询失败</p>
                <p className="mt-1 break-words">{result.message}</p>
              </div>
            ) : result.points.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                暂无知识点数据。请先确认 Supabase 中的 knowledge_points 已导入。
              </div>
            ) : (
              <StudentKnowledgeClient
                points={result.points}
                explanations={result.explanations}
                coursewares={result.coursewares}
                practiceRecords={result.practiceRecords}
                initialCode={initialCode}
              />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
