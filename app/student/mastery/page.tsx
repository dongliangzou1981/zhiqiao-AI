import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "我的弱项知识点 · 知桥AI",
};

type MasteryLevel = "needs_work" | "basic" | "stable";

type KnowledgeMastery = {
  id: string;
  knowledge_point_code: string;
  knowledge_point_name: string;
  courseware_opened_count: number;
  courseware_completed_count: number;
  practice_attempts: number;
  correct_attempts: number;
  wrong_attempts: number;
  accuracy: number;
  pending_review_count: number;
  completed_review_count: number;
  mastery_score: number;
  mastery_level: MasteryLevel;
  reasons: string[];
  last_activity_at: string | null;
  calculated_at: string;
};

type LoadResult =
  | {
      status: "success";
      masteryRows: KnowledgeMastery[];
    }
  | { status: "error"; message: string };

function formatDateTime(iso: string | null) {
  if (!iso) return "暂无";

  return new Date(iso).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getMasteryLabel(level: MasteryLevel) {
  if (level === "stable") return "持续稳定";
  if (level === "basic") return "基本掌握";
  return "待巩固";
}

function getMasteryBadgeClass(level: MasteryLevel) {
  if (level === "stable") return "bg-emerald-100 text-emerald-700 ring-emerald-200";
  if (level === "basic") return "bg-sky-100 text-sky-700 ring-sky-200";
  return "bg-rose-100 text-rose-700 ring-rose-200";
}

function getNextStepText(row: KnowledgeMastery) {
  if (row.pending_review_count > 0) return "先完成待复习任务";
  if (row.practice_attempts === 0) return "先做 1 组基础练习";
  if (row.courseware_completed_count === 0) return "先完整看完课件";
  if (row.accuracy < 80) return "重新练易错题";
  return "保持一周回顾";
}

function getKnowledgePracticeHref(code: string) {
  return `/student/knowledge?code=${encodeURIComponent(code)}#practice`;
}

function getReviewHref(code: string) {
  return `/student/review?code=${encodeURIComponent(code)}`;
}

async function loadMasteryRows(): Promise<LoadResult> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("student_knowledge_mastery")
      .select(
        "id, knowledge_point_code, knowledge_point_name, courseware_opened_count, courseware_completed_count, practice_attempts, correct_attempts, wrong_attempts, accuracy, pending_review_count, completed_review_count, mastery_score, mastery_level, reasons, last_activity_at, calculated_at"
      )
      .order("mastery_score", { ascending: true })
      .order("last_activity_at", { ascending: false });

    if (error) {
      return { status: "error", message: error.message };
    }

    return {
      status: "success",
      masteryRows: (data ?? []) as KnowledgeMastery[],
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "知识点掌握数据读取失败",
    };
  }
}

function MasteryCard({ row }: { row: KnowledgeMastery }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold text-slate-900">{row.knowledge_point_name}</p>
          <code className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-600">
            {row.knowledge_point_code}
          </code>
        </div>
        <span
          className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getMasteryBadgeClass(
            row.mastery_level
          )}`}
        >
          {getMasteryLabel(row.mastery_level)} · {row.mastery_score}
        </span>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500">练习正确</p>
          <p className="mt-1 font-semibold text-slate-900">
            {row.correct_attempts}/{row.practice_attempts} 题
            <span className="ml-1 text-xs font-normal text-slate-500">
              正确率 {row.accuracy}%
            </span>
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500">复习任务</p>
          <p className="mt-1 font-semibold text-slate-900">
            待 {row.pending_review_count} / 完成 {row.completed_review_count}
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500">课件学习</p>
          <p className="mt-1 font-semibold text-slate-900">
            {row.courseware_completed_count}/{row.courseware_opened_count}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
        <p className="font-medium">下一步：{getNextStepText(row)}</p>
        <p className="mt-1 leading-6">{row.reasons.join("，")}</p>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-400">
          最近活动：{formatDateTime(row.last_activity_at)}
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={getReviewHref(row.knowledge_point_code)}
            className="rounded-lg border border-teal-200 bg-white px-3 py-2 text-xs font-semibold text-teal-700 transition hover:bg-teal-50"
          >
            针对复习
          </Link>
          <Link
            href={getKnowledgePracticeHref(row.knowledge_point_code)}
            className="rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-teal-700"
          >
            去做基础练习
          </Link>
        </div>
      </div>
    </article>
  );
}

export default async function StudentMasteryPage() {
  const result = await loadMasteryRows();

  const rows = result.status === "success" ? result.masteryRows : [];
  const needsWorkRows = rows.filter((row) => row.mastery_level === "needs_work");
  const stableRows = rows.filter((row) => row.mastery_level === "stable");
  const displayRows = rows.length > 0 ? rows : [];

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
                我的弱项知识点
              </h1>
              <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">
                根据课件学习、基础练习和复习任务生成轻量掌握信号，帮助你先补最基础、最容易丢分的知识点。
              </p>
            </div>
            {result.status === "success" ? (
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-rose-50 px-3 py-1 font-medium text-rose-700 ring-1 ring-rose-100">
                  {needsWorkRows.length} 个待巩固
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700 ring-1 ring-emerald-100">
                  {stableRows.length} 个持续稳定
                </span>
              </div>
            ) : null}
          </div>

          <div className="mt-8">
            {result.status === "error" ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
                <p className="font-semibold">知识点掌握数据查询失败</p>
                <p className="mt-1 break-words">{result.message}</p>
              </div>
            ) : displayRows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <h2 className="text-lg font-semibold text-slate-900">暂无掌握度记录</h2>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-500">
                  完成课件学习、基础练习或复习任务后，这里会自动生成你的知识点掌握信号。
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <Link
                    href="/student/knowledge"
                    className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
                  >
                    去学习知识点
                  </Link>
                  <Link
                    href="/student/review"
                    className="rounded-lg border border-teal-200 bg-white px-4 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-50"
                  >
                    去智能复习
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                {displayRows.map((row) => (
                  <MasteryCard key={row.id} row={row} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
