"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { DynamicCoursewareDemo } from "@/app/_components/dynamic-courseware-demo";
import {
  buildPracticeReplaySuggestion,
  getDynamicReplayTargetId,
} from "@/lib/courseware-playback";
import type { CoursewareJson } from "@/lib/courseware-types";
import {
  StudentCoursewareFeedbackPanel,
  type StudentCoursewareFeedback,
} from "./student-courseware-feedback-panel";

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

type CoursewarePlayerClientProps = {
  coursewareId: string;
  courseware: CoursewareJson;
  practiceRecords: StudentPracticeRecord[];
  createdAt: string;
  initialProgress: StudentCoursewareProgress | null;
  initialFeedback: StudentCoursewareFeedback | null;
  focusPracticeIndex: number | null;
};

type PracticeState = {
  loading: boolean;
  error: string | null;
  record: StudentPracticeRecord | null;
  expectedAnswer: string | null;
  explanation: string | null;
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

function formatCreatedAt(iso: string): string {
  return new Date(iso).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function practiceKey(coursewareId: string, index: number) {
  return `${coursewareId}:${index}`;
}

function getSlideAccent(slideType: string) {
  if (slideType.includes("example")) {
    return "border-sky-200 bg-sky-50 text-sky-800";
  }

  if (slideType.includes("mistake")) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (slideType.includes("practice")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (slideType.includes("summary") || slideType.includes("review")) {
    return "border-violet-200 bg-violet-50 text-violet-800";
  }

  return "border-teal-200 bg-teal-50 text-teal-800";
}

export function CoursewarePlayerClient({
  coursewareId,
  courseware,
  practiceRecords,
  createdAt,
  initialProgress,
  initialFeedback,
  focusPracticeIndex,
}: CoursewarePlayerClientProps) {
  const initialSlideIndex =
    initialProgress && initialProgress.last_slide_index < courseware.slides.length
      ? initialProgress.last_slide_index
      : 0;
  const [activeIndex, setActiveIndex] = useState(initialSlideIndex);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [practiceStates, setPracticeStates] = useState<Record<string, PracticeState>>({});
  const [coursewareProgress, setCoursewareProgress] =
    useState<StudentCoursewareProgress | null>(initialProgress);
  const [progressError, setProgressError] = useState<string | null>(null);
  const practiceRefs = useRef<Array<HTMLDivElement | null>>([]);
  const dynamicReplayRef = useRef<HTMLDivElement | null>(null);

  const practiceByKey = useMemo(() => {
    return new Map(
      practiceRecords.map((record) => [
        practiceKey(record.courseware_id ?? "none", record.practice_item_index),
        record,
      ])
    );
  }, [practiceRecords]);

  const activeSlide = courseware.slides[activeIndex] ?? courseware.slides[0];
  const progressPercent = Math.round(((activeIndex + 1) / courseware.slides.length) * 100);
  const dynamicReplayTargetId = getDynamicReplayTargetId(coursewareId);
  const focusedPracticeReplaySuggestion = useMemo(() => {
    if (focusPracticeIndex === null) {
      return null;
    }

    const practiceItem = courseware.practice_items[focusPracticeIndex];
    if (!practiceItem) {
      return null;
    }

    return buildPracticeReplaySuggestion({
      knowledgePointCode: courseware.knowledge_point_code,
      practiceItem,
      storyboards: courseware.dynamic_storyboards,
    });
  }, [courseware, focusPracticeIndex]);

  async function saveProgress(nextSlideIndex: number, completed = false) {
    setProgressError(null);

    try {
      const response = await fetch("/api/student-courseware-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coursewareId,
          lastSlideIndex: nextSlideIndex,
          slideCount: courseware.slides.length,
          completed,
        }),
      });

      const payload = (await response.json()) as {
        progress?: StudentCoursewareProgress;
        error?: string;
      };

      if (!response.ok || !payload.progress) {
        throw new Error(payload.error || "保存学习进度失败");
      }

      setCoursewareProgress(payload.progress);
    } catch (error) {
      setProgressError(error instanceof Error ? error.message : "保存学习进度失败");
    }
  }

  useEffect(() => {
    void saveProgress(activeIndex, coursewareProgress?.status === "completed");
    // 进入课件和翻页时记录学习进度。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  useEffect(() => {
    if (focusPracticeIndex === null) return;

    const timer = window.setTimeout(() => {
      practiceRefs.current[focusPracticeIndex]?.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
    }, 120);

    return () => window.clearTimeout(timer);
  }, [focusPracticeIndex]);

  function scrollToDynamicReplay() {
    dynamicReplayRef.current?.scrollIntoView({
      block: "start",
      behavior: "smooth",
    });
  }

  async function submitPractice(index: number) {
    const key = practiceKey(coursewareId, index);
    const studentAnswer = answers[key]?.trim() ?? "";

    setPracticeStates((current) => ({
      ...current,
      [key]: {
        loading: true,
        error: null,
        record: current[key]?.record ?? practiceByKey.get(key) ?? null,
        expectedAnswer: current[key]?.expectedAnswer ?? null,
        explanation: current[key]?.explanation ?? null,
      },
    }));

    try {
      const response = await fetch("/api/student-practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coursewareId,
          practiceItemIndex: index,
          studentAnswer,
        }),
      });

      const payload = (await response.json()) as {
        record?: StudentPracticeRecord;
        expectedAnswer?: string;
        explanation?: string;
        error?: string;
      };

      if (!response.ok || !payload.record) {
        throw new Error(payload.error || "提交练习失败");
      }

      const record = payload.record;
      setPracticeStates((current) => ({
        ...current,
        [key]: {
          loading: false,
          error: null,
          record,
          expectedAnswer: payload.expectedAnswer ?? record.expected_answer,
          explanation: payload.explanation ?? null,
        },
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "提交练习失败";
      setPracticeStates((current) => ({
        ...current,
        [key]: {
          loading: false,
          error: message,
          record: current[key]?.record ?? practiceByKey.get(key) ?? null,
          expectedAnswer: current[key]?.expectedAnswer ?? null,
          explanation: current[key]?.explanation ?? null,
        },
      }));
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/95">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <Link
              href="/student/knowledge"
              className="inline-flex items-center gap-1 text-sm font-medium text-teal-200 transition hover:text-white"
            >
              <span aria-hidden>←</span>
              返回知识点学习
            </Link>
            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              {courseware.knowledge_point_name}
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              {courseware.subject} · {courseware.grade} · {courseware.semester} ·{" "}
              {courseware.chapter}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-teal-400/10 px-3 py-1 font-medium text-teal-100 ring-1 ring-teal-300/30">
              {courseware.knowledge_point_code}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-slate-200 ring-1 ring-white/15">
              {formatCreatedAt(createdAt)}
            </span>
            <span
              className={`rounded-full px-3 py-1 font-semibold ring-1 ${
                coursewareProgress?.status === "completed"
                  ? "bg-emerald-400/10 text-emerald-100 ring-emerald-300/30"
                  : "bg-white/10 text-slate-200 ring-white/15"
              }`}
            >
              {coursewareProgress?.status === "completed" ? "已完成学习" : "学习中"}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-white">课件目录</p>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-slate-200">
              {activeIndex + 1}/{courseware.slides.length}
            </span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-teal-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {progressError ? (
            <p className="mt-3 rounded-lg bg-rose-400/10 px-3 py-2 text-xs text-rose-100">
              {progressError}
            </p>
          ) : null}
          <div className="mt-4 space-y-2">
            {courseware.slides.map((slide, index) => (
              <button
                key={`${slide.title}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                  index === activeIndex
                    ? "border-teal-300/70 bg-teal-300/10"
                    : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                }`}
              >
                <p className="text-xs text-slate-400">第 {index + 1} 页</p>
                <p className="mt-1 line-clamp-2 text-sm font-medium text-white">
                  {slide.title}
                </p>
              </button>
            ))}
          </div>
        </aside>

        <section className="space-y-6">
          <article className="min-h-[520px] rounded-3xl border border-white/10 bg-white text-slate-950 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-5">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${getSlideAccent(
                  activeSlide.slide_type
                )}`}
              >
                {activeSlide.slide_type}
              </span>
              <span className="text-sm font-medium text-slate-500">
                第 {activeIndex + 1} 页 / 共 {courseware.slides.length} 页
              </span>
            </div>

            <div className="px-6 py-8 sm:px-10 sm:py-12">
              <h2 className="max-w-4xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                {activeSlide.title}
              </h2>
              <div className="mt-8 whitespace-pre-wrap text-lg leading-9 text-slate-700">
                {activeSlide.content}
              </div>

              <div id={dynamicReplayTargetId} ref={dynamicReplayRef} className="mt-8 scroll-mt-6">
                <DynamicCoursewareDemo
                  knowledgePointCode={courseware.knowledge_point_code}
                  knowledgePointName={courseware.knowledge_point_name}
                  slideTitle={activeSlide.title}
                  slideContent={activeSlide.content}
                  interactiveHtml={courseware.interactive_html}
                  dynamicStoryboards={courseware.dynamic_storyboards}
                  initialStepIndex={focusedPracticeReplaySuggestion?.stepIndex}
                />
              </div>

              {activeSlide.teacher_notes ? (
                <div className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
                  <p className="text-sm font-semibold text-indigo-900">老师提示</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-indigo-800">
                    {activeSlide.teacher_notes}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-5">
              <button
                type="button"
                onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}
                disabled={activeIndex === 0}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                上一页
              </button>
              <button
                type="button"
                onClick={() =>
                  setActiveIndex((index) => Math.min(courseware.slides.length - 1, index + 1))
                }
                disabled={activeIndex === courseware.slides.length - 1}
                className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                下一页
              </button>
            </div>
          </article>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div>
              <p className="text-sm font-semibold text-white">学习进度</p>
              <p className="mt-1 text-sm text-slate-400">
                最近浏览到第 {activeIndex + 1} 页，共 {courseware.slides.length} 页。
              </p>
            </div>
            <button
              type="button"
              onClick={() => void saveProgress(courseware.slides.length - 1, true)}
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              标记完成学习
            </button>
          </div>

          <StudentCoursewareFeedbackPanel
            coursewareId={coursewareId}
            initialFeedback={initialFeedback}
          />

          <section className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-sm font-semibold text-teal-100">学习目标</p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
                {courseware.learning_goals.map((goal) => (
                  <li key={goal}>{goal}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-sm font-semibold text-sky-100">核心概念</p>
              <p className="mt-3 text-sm font-medium text-white">
                {courseware.core_concept.title}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {courseware.core_concept.explanation}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-sm font-semibold text-violet-100">课后巩固</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
                {courseware.review_plan.slice(0, 3).map((item) => (
                  <li key={`${item.timing}-${item.task}`}>
                    <span className="font-medium text-white">{item.timing}：</span>
                    {item.task}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">基础练习</p>
                <p className="mt-1 text-sm text-slate-400">
                  完成练习后会自动生成复习任务，帮助你按天和周巩固基础知识。
                </p>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">
                {courseware.practice_items.length} 题
              </span>
            </div>

            {focusPracticeIndex !== null ? (
              <div className="mt-4 rounded-xl border border-amber-300/40 bg-amber-300/10 p-4">
                <p className="text-sm font-semibold text-amber-100">
                  正在重看第 {focusPracticeIndex + 1} 题
                </p>
                <p className="mt-1 text-sm leading-6 text-amber-50/80">
                  先对照上方讲解和动态演示，再回到这道题复盘错误原因。
                </p>
                {focusedPracticeReplaySuggestion ? (
                  <div className="mt-2 rounded-lg bg-white/10 px-3 py-2 text-sm leading-6 text-amber-50">
                    <p>
                      建议回看动态演示第 {focusedPracticeReplaySuggestion.stepIndex + 1} 步：
                      {focusedPracticeReplaySuggestion.stepTitle}。
                      {focusedPracticeReplaySuggestion.reason}
                    </p>
                    <button
                      type="button"
                      onClick={scrollToDynamicReplay}
                      className="mt-2 rounded-lg bg-amber-300 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-amber-200"
                    >
                      查看动态演示第 {focusedPracticeReplaySuggestion.stepIndex + 1} 步
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="mt-5 grid gap-4">
              {courseware.practice_items.map((item, index) => {
                const key = practiceKey(coursewareId, index);
                const savedRecord = practiceByKey.get(key) ?? null;
                const practiceState = practiceStates[key] ?? {
                  loading: false,
                  error: null,
                  record: savedRecord,
                  expectedAnswer: savedRecord?.expected_answer ?? null,
                  explanation: null,
                };
                const answerValue = answers[key] ?? savedRecord?.student_answer ?? "";
                const isFocusedPractice = focusPracticeIndex === index;
                const replaySuggestion = buildPracticeReplaySuggestion({
                  knowledgePointCode: courseware.knowledge_point_code,
                  practiceItem: item,
                  storyboards: courseware.dynamic_storyboards,
                });

                return (
                  <div
                    key={`${item.question}-${index}`}
                    id={`practice-${index + 1}`}
                    ref={(node) => {
                      practiceRefs.current[index] = node;
                    }}
                    className={`rounded-2xl bg-white p-5 text-slate-950 transition ${
                      isFocusedPractice
                        ? "ring-4 ring-amber-300 shadow-2xl shadow-amber-950/20"
                        : ""
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-100">
                        第 {index + 1} 题
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {item.difficulty}
                      </span>
                      {practiceState.record ? (
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            practiceState.record.is_correct
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {practiceState.record.is_correct ? "已掌握" : "需复习"}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-4 text-base font-semibold leading-7">{item.question}</p>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <input
                        value={answerValue}
                        onChange={(event) =>
                          setAnswers((current) => ({
                            ...current,
                            [key]: event.target.value,
                          }))
                        }
                        placeholder="输入你的答案"
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => submitPractice(index)}
                        disabled={practiceState.loading}
                        className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-teal-300"
                      >
                        {practiceState.loading ? "提交中..." : "提交答案"}
                      </button>
                    </div>
                    {practiceState.error ? (
                      <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                        {practiceState.error}
                      </p>
                    ) : null}
                    {practiceState.record ? (
                      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                        <p
                          className={
                            practiceState.record.is_correct
                              ? "font-semibold text-emerald-700"
                              : "font-semibold text-rose-700"
                          }
                        >
                          {practiceState.record.is_correct ? "回答正确" : "需要再复习"}
                        </p>
                        <p className="mt-2 text-slate-600">
                          你的答案：{practiceState.record.student_answer}
                        </p>
                        <p className="mt-1 text-slate-600">
                          标准答案：
                          {practiceState.expectedAnswer ?? practiceState.record.expected_answer}
                        </p>
                        {practiceState.record.error_reason ? (
                          <p className="mt-1 text-slate-600">
                            错误原因：{practiceState.record.error_reason}
                          </p>
                        ) : null}
                        {practiceState.explanation ? (
                          <p className="mt-1 leading-6 text-slate-600">
                            解析：{practiceState.explanation}
                          </p>
                        ) : null}
                        {!practiceState.record.is_correct && replaySuggestion ? (
                          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
                            <p className="font-semibold">
                              建议回看动态演示第 {replaySuggestion.stepIndex + 1} 步：
                              {replaySuggestion.stepTitle}
                            </p>
                            <p className="mt-1">{replaySuggestion.reason}</p>
                            <button
                              type="button"
                              onClick={scrollToDynamicReplay}
                              className="mt-2 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-600"
                            >
                              查看动态演示第 {replaySuggestion.stepIndex + 1} 步
                            </button>
                          </div>
                        ) : null}
                        {!practiceState.record.is_correct ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Link
                              href={`/student/review?code=${encodeURIComponent(
                                item.knowledge_point_code
                              )}`}
                              className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700"
                            >
                              复习这个知识点
                            </Link>
                            <Link
                              href={`/student/knowledge?code=${encodeURIComponent(
                                item.knowledge_point_code
                              )}#practice`}
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-white"
                            >
                              继续基础练习
                            </Link>
                          </div>
                        ) : null}
                        <p className="mt-2 text-xs text-slate-400">
                          记录时间：{formatCreatedAt(practiceState.record.created_at)}
                        </p>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
