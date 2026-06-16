import Link from "next/link";
import { getLessonPlanById } from "@/lib/lesson-plans";
import { createClient } from "@/lib/supabase/server";
import { LessonPlanMarkdown } from "../../lesson-generator/lesson-plan-markdown";

type LessonHistoryDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatCreatedAt(iso: string): string {
  return new Date(iso).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function LessonHistoryDetailPage({
  params,
}: LessonHistoryDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const record = await getLessonPlanById(supabase, id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
          <Link
            href="/teacher/lesson-history"
            className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
          >
            <span aria-hidden>←</span>
            返回教案历史
          </Link>
          <h1 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">教案详情</h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {!record && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-sm">
            <p className="text-slate-600">未找到该教案记录</p>
            <Link
              href="/teacher/lesson-history"
              className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              返回列表
            </Link>
          </div>
        )}

        {record && (
          <article className="space-y-4">
            <div className="rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-50 to-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                {record.knowledge_point_name}
              </h2>
              <code className="mt-2 inline-block rounded-md bg-white/80 px-2 py-0.5 font-mono text-xs text-violet-800 ring-1 ring-violet-200/60">
                {record.knowledge_point_code}
              </code>
              <p className="mt-2 text-sm text-slate-500">
                创建时间：{formatCreatedAt(record.created_at)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50">
              <LessonPlanMarkdown content={record.content} />
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
