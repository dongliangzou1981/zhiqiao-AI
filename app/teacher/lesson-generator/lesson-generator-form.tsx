"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { juniorMathKnowledgeBase } from "@/data/junior-math";
import { createLessonHistoryId, saveLessonHistory } from "@/lib/lesson-history";
import { LessonPlanMarkdown } from "./lesson-plan-markdown";

type LessonPlanMeta = {
  textbookName: string;
  subject: string;
  version: string;
  grade: string;
  semester: string;
  chapter: string;
  code: string;
  name: string;
};

type LessonPlanResult = {
  meta: LessonPlanMeta;
  lessonPlan: string;
};

const { textbook, grades } = juniorMathKnowledgeBase;

const selectClassName =
  "mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50";

function IconSparkles() {
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
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
      />
    </svg>
  );
}

export function LessonGeneratorForm() {
  const defaultGradeId = grades[0]?.id ?? "";
  const defaultGrade = grades.find((g) => g.id === defaultGradeId);
  const defaultSemesterId = defaultGrade?.semesters[0]?.id ?? "";

  const [gradeId, setGradeId] = useState(defaultGradeId);
  const [semesterId, setSemesterId] = useState(defaultSemesterId);
  const [chapterId, setChapterId] = useState("");
  const [knowledgePointId, setKnowledgePointId] = useState("");
  const [plan, setPlan] = useState<LessonPlanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedHint, setSavedHint] = useState(false);
  const [loading, setLoading] = useState(false);

  const grade = useMemo(() => grades.find((g) => g.id === gradeId), [gradeId]);
  const semester = useMemo(
    () => grade?.semesters.find((s) => s.id === semesterId),
    [grade, semesterId]
  );
  const chapter = useMemo(
    () => semester?.chapters.find((c) => c.id === chapterId),
    [semester, chapterId]
  );
  const knowledgePoint = useMemo(
    () => chapter?.knowledgePoints.find((kp) => kp.id === knowledgePointId),
    [chapter, knowledgePointId]
  );

  const resetPlan = () => {
    setError(null);
    setSavedHint(false);
    setPlan(null);
  };

  const handleGradeChange = (id: string) => {
    const nextGrade = grades.find((g) => g.id === id);
    setGradeId(id);
    setSemesterId(nextGrade?.semesters[0]?.id ?? "");
    setChapterId("");
    setKnowledgePointId("");
    resetPlan();
  };

  const handleSemesterChange = (id: string) => {
    setSemesterId(id);
    setChapterId("");
    setKnowledgePointId("");
    resetPlan();
  };

  const handleChapterChange = (id: string) => {
    setChapterId(id);
    setKnowledgePointId("");
    resetPlan();
  };

  const handleKnowledgePointChange = (id: string) => {
    setKnowledgePointId(id);
    resetPlan();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!grade || !semester || !chapter || !knowledgePoint) {
      setError("请完整选择年级、学期、章节与知识点");
      setPlan(null);
      return;
    }

    setLoading(true);
    setError(null);
    setSavedHint(false);
    setPlan(null);

    try {
      const res = await fetch("/api/lesson-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: knowledgePoint.code,
          name: knowledgePoint.name,
          description: knowledgePoint.description,
        }),
      });

      const data = (await res.json()) as { lessonPlan?: string; error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? "生成教案失败，请稍后重试");
      }

      if (!data.lessonPlan) {
        throw new Error("未收到教案内容");
      }

      saveLessonHistory({
        id: createLessonHistoryId(),
        knowledgePointCode: knowledgePoint.code,
        knowledgePointName: knowledgePoint.name,
        createdAt: new Date().toISOString(),
        content: data.lessonPlan,
      });
      setSavedHint(true);

      setPlan({
        meta: {
          textbookName: textbook.name,
          subject: textbook.subject,
          version: textbook.version,
          grade: grade.name,
          semester: semester.name,
          chapter: chapter.name,
          code: knowledgePoint.code,
          name: knowledgePoint.name,
        },
        lessonPlan: data.lessonPlan,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成教案失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
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
                <IconSparkles />
              </span>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  AI教案生成
                </h1>
                <p className="text-sm text-slate-500">
                  从知识库选择知识点，由 DeepSeek 生成结构化教案
                </p>
              </div>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200/80">
            DeepSeek
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-5">
          <form onSubmit={handleSubmit} className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50">
              <h2 className="text-lg font-semibold text-slate-900">备课信息</h2>
              <p className="mt-1 text-sm text-slate-500">从本地知识库选择教学目标</p>

              <div className="mt-4 rounded-xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50/80 to-white px-4 py-3">
                <p className="text-xs font-medium text-indigo-600">当前教材</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">{textbook.name}</p>
                <p className="text-xs text-slate-500">
                  {textbook.stage} · {textbook.subject} · {textbook.version}
                </p>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label htmlFor="grade" className="block text-sm font-medium text-slate-700">
                    年级
                  </label>
                  <select
                    id="grade"
                    value={gradeId}
                    onChange={(e) => handleGradeChange(e.target.value)}
                    className={selectClassName}
                  >
                    {grades.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="semester" className="block text-sm font-medium text-slate-700">
                    学期
                  </label>
                  <select
                    id="semester"
                    value={semesterId}
                    onChange={(e) => handleSemesterChange(e.target.value)}
                    disabled={!grade}
                    className={selectClassName}
                  >
                    {!grade && <option value="">请先选择年级</option>}
                    {grade?.semesters.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="chapter" className="block text-sm font-medium text-slate-700">
                    章节
                  </label>
                  <select
                    id="chapter"
                    value={chapterId}
                    onChange={(e) => handleChapterChange(e.target.value)}
                    disabled={!semester}
                    className={selectClassName}
                  >
                    <option value="">请选择章节</option>
                    {semester?.chapters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="knowledgePoint"
                    className="block text-sm font-medium text-slate-700"
                  >
                    知识点
                  </label>
                  <select
                    id="knowledgePoint"
                    value={knowledgePointId}
                    onChange={(e) => handleKnowledgePointChange(e.target.value)}
                    disabled={!chapter}
                    className={selectClassName}
                  >
                    <option value="">请选择知识点</option>
                    {chapter?.knowledgePoints.map((kp) => (
                      <option key={kp.id} value={kp.id}>
                        {kp.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {knowledgePoint && (
                <div className="mt-5 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-indigo-600">
                    已选知识点
                  </p>
                  <dl className="mt-3 space-y-2.5 text-sm">
                    <div className="flex flex-wrap gap-x-2 gap-y-1">
                      <dt className="shrink-0 font-medium text-slate-500">编码</dt>
                      <dd>
                        <code className="rounded-md bg-white px-2 py-0.5 font-mono text-xs text-slate-800 ring-1 ring-slate-200/80">
                          {knowledgePoint.code}
                        </code>
                      </dd>
                    </div>
                    <div className="flex flex-wrap gap-x-2 gap-y-1">
                      <dt className="shrink-0 font-medium text-slate-500">名称</dt>
                      <dd className="font-semibold text-slate-900">{knowledgePoint.name}</dd>
                    </div>
                    <div>
                      <dt className="mb-1 font-medium text-slate-500">说明</dt>
                      <dd className="leading-relaxed text-slate-600">
                        {knowledgePoint.description}
                      </dd>
                    </div>
                  </dl>
                </div>
              )}

              {error && (
                <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}

              {savedHint && (
                <p
                  className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-200/80"
                  role="status"
                >
                  已保存到教案历史
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !knowledgePoint}
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-violet-500/25 transition hover:from-violet-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "DeepSeek 生成中…" : "生成教案"}
              </button>
            </div>

            <p className="text-center text-xs text-slate-400">
              <Link href="/teacher/knowledge-base" className="text-indigo-600 hover:text-indigo-700">
                浏览完整知识库
              </Link>
            </p>
          </form>

          <div className="lg:col-span-3">
            {!plan && !loading && (
              <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 p-8 text-center shadow-sm">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                  <svg
                    className="h-7 w-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 14.25v-2.625a3.375 3.375 0 01-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                    />
                  </svg>
                </div>
                <p className="mt-4 text-sm font-medium text-slate-600">
                  选择知识点后点击「生成教案」
                </p>
                <p className="mt-1 text-xs text-slate-400">教案将由 DeepSeek 生成并显示在右侧</p>
              </div>
            )}

            {loading && (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
                <p className="mt-4 text-sm text-slate-500">正在调用 DeepSeek 生成教案…</p>
                <p className="mt-1 text-xs text-slate-400">通常需要 10–30 秒</p>
              </div>
            )}

            {plan && !loading && (
              <article className="space-y-4">
                <div className="rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-50 to-white p-6 shadow-sm shadow-slate-200/50">
                  <h2 className="text-lg font-bold text-slate-900">教案预览</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {plan.meta.grade} · {plan.meta.semester} · {plan.meta.subject} ·{" "}
                    {plan.meta.version}
                  </p>
                  <p className="text-sm text-slate-500">
                    {plan.meta.chapter} · {plan.meta.name}
                  </p>
                  <code className="mt-2 inline-block rounded-md bg-white/80 px-2 py-0.5 font-mono text-xs text-violet-800 ring-1 ring-violet-200/60">
                    {plan.meta.code}
                  </code>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50">
                  <LessonPlanMarkdown content={plan.lessonPlan} />
                </div>

                <p className="text-center text-xs text-slate-400">
                  由 DeepSeek 生成 · 请结合学情调整后使用
                </p>
              </article>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
