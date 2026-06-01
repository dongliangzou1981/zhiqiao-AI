import type { Metadata } from "next";
import Link from "next/link";
import { juniorMathKnowledgeBase } from "@/data/junior-math";
import { KnowledgeBaseTree } from "./knowledge-base-tree";

export const metadata: Metadata = {
  title: "知识库 · 知桥AI",
  description: "教材知识点结构浏览与管理",
};

function IconBook() {
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
        d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
      />
    </svg>
  );
}

export default function TeacherKnowledgeBasePage() {
  const { textbook, grades } = juniorMathKnowledgeBase;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <Link
              href="/teacher"
              className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
            >
              <span aria-hidden>←</span>
              返回教师工作台
            </Link>
            <div className="mt-2 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                <IconBook />
              </span>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  知识库
                </h1>
                <p className="text-sm text-slate-500">浏览教材章节与知识点结构</p>
              </div>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200/80">
            本地数据
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <KnowledgeBaseTree textbook={textbook} grades={grades} />
        <p className="mt-8 text-center text-xs text-slate-400">
          数据来源：人教版初中数学 · 七年级上册节选 · 知桥AI V1.0
        </p>
      </main>
    </div>
  );
}
