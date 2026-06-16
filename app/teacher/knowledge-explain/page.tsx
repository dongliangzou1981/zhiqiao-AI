import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { KnowledgeExplainClient } from "./knowledge-explain-client";

export const metadata: Metadata = {
  title: "AI知识点讲解 · 知桥AI",
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
    const message = error instanceof Error ? error.message : "未知错误";
    return { status: "error", message };
  }
}

export default async function KnowledgeExplainPage() {
  const result = await loadKnowledgePoints();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <Link
          href="/teacher"
          className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
        >
          <span aria-hidden>←</span>
          返回教师工作台
        </Link>

        <section className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-indigo-600">
                知桥AI · 教师端
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                AI知识点讲解
              </h1>
              <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">
                从 Supabase 知识点库读取教材目录，后续可在此基础上生成分步讲解、例题演示与易错点提示。
              </p>
            </div>
            {result.status === "success" ? (
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 ring-1 ring-indigo-600/20">
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
              <div className="grid gap-4 md:grid-cols-2">
                <KnowledgeExplainClient points={result.points} />
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
