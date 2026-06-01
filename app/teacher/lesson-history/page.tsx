import type { Metadata } from "next";
import Link from "next/link";
import { LessonHistoryCount, LessonHistoryList } from "./lesson-history-list";

export const metadata: Metadata = {
  title: "教案历史记录 · 知桥AI",
  description: "查看已生成的 AI 教案历史",
};

function IconHistory() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

export default function LessonHistoryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <Link
              href="/teacher"
              className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
            >
              <span aria-hidden>←</span>
              返回教师工作台
            </Link>
            <div className="mt-2 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                <IconHistory />
              </span>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  教案历史记录
                </h1>
                <p className="text-sm text-slate-500">查看已生成的 AI 教案</p>
              </div>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200/80">
            本地存储
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              共 <LessonHistoryCount /> 条记录 · 按创建时间倒序
            </p>
            <Link
              href="/teacher/lesson-generator"
              className="text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
            >
              去生成新教案 →
            </Link>
          </div>

          <LessonHistoryList />
        </section>

        <p className="mt-8 text-center text-xs text-slate-400">
          数据保存在浏览器本地 · 知桥AI V1.0
        </p>
      </main>
    </div>
  );
}
