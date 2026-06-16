import type { Metadata } from "next";
import Link from "next/link";
import { getAIModelConfig } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";
import { CoursewareClient } from "./courseware-client";

export const metadata: Metadata = {
  title: "AI课件生成 · 知桥AI",
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

type LoadResult =
  | { status: "success"; points: KnowledgePoint[] }
  | { status: "error"; message: string };

type CoursewarePageProps = {
  searchParams?: Promise<{
    knowledgePointCode?: string;
    source?: string;
  }>;
};

async function loadKnowledgePoints(): Promise<LoadResult> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("knowledge_points")
      .select("id, code, subject, grade, semester, chapter, name, description")
      .order("subject", { ascending: true })
      .order("grade", { ascending: true })
      .order("semester", { ascending: true })
      .order("chapter", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      return { status: "error", message: error.message };
    }

    return { status: "success", points: (data ?? []) as KnowledgePoint[] };
  } catch (error) {
    const message = error instanceof Error ? error.message : "读取知识点失败";
    return { status: "error", message };
  }
}

export default async function CoursewarePage({ searchParams }: CoursewarePageProps) {
  const params = (await searchParams) ?? {};
  const initialKnowledgePointCode =
    typeof params.knowledgePointCode === "string" ? params.knowledgePointCode : "";
  const source = typeof params.source === "string" ? params.source : "";
  const result = await loadKnowledgePoints();
  const config = getAIModelConfig("courseware");
  const modelLabel = `${config.provider} / ${config.model}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/teacher"
          className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
        >
          <span aria-hidden>←</span>
          返回教师工作台
        </Link>

        <header className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-medium uppercase tracking-wider text-indigo-600">
            知识点导向课件
          </p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                AI课件生成
              </h1>
              <p className="mt-3 max-w-3xl leading-7 text-slate-600">
                先生成中文 Markdown 文本课件，老师确认或修改后，再生成动态课件。所有内容继续围绕{" "}
                <code className="rounded bg-slate-100 px-1">knowledge_point_code</code>{" "}
                组织，优先打牢基础知识。
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 ring-1 ring-emerald-600/20">
                {modelLabel}
              </span>
              {result.status === "success" ? (
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 ring-1 ring-indigo-600/20">
                  {result.points.length} 个知识点
                </span>
              ) : null}
              <Link
                href="/teacher/courseware-history"
                className="rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700 ring-1 ring-sky-600/20 transition hover:bg-sky-100"
              >
                查看课件历史
              </Link>
            </div>
          </div>
        </header>

        <div className="mt-8">
          {result.status === "error" ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
              <p className="font-semibold">读取知识点失败</p>
              <p className="mt-1 break-words">{result.message}</p>
            </div>
          ) : result.points.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
              暂无知识点数据。请先确认 Supabase 中的 knowledge_points 已导入。
            </div>
          ) : (
            <CoursewareClient
              points={result.points}
              initialKnowledgePointCode={initialKnowledgePointCode}
              source={source}
              modelLabel={modelLabel}
            />
          )}
        </div>
      </main>
    </div>
  );
}
