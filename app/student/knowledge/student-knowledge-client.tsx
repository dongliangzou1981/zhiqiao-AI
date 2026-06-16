"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  getCoursewareAssetMetadata,
  type CoursewareAssetMetadata,
} from "@/lib/courseware-asset";
import {
  getCoursewareRecommendation,
  getCoursewareRecommendationReasons,
  sortCoursewareResources,
} from "@/lib/courseware-ranking";
import type { CoursewareJson } from "@/lib/courseware-types";

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

type GenerationState = {
  loading: boolean;
  error: string | null;
  content: string | null;
  recordId: string | null;
};

type PracticeState = {
  loading: boolean;
  error: string | null;
  record: StudentPracticeRecord | null;
  expectedAnswer: string | null;
  explanation: string | null;
};

type StudentKnowledgeClientProps = {
  points: KnowledgePoint[];
  explanations: KnowledgeExplanationRecord[];
  coursewares: CoursewareLearningResource[];
  practiceRecords: StudentPracticeRecord[];
  initialCode?: string;
};

function initialState(content: string | null = null, recordId: string | null = null): GenerationState {
  return {
    loading: false,
    error: null,
    content,
    recordId,
  };
}

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

const sourceLabels: Record<CoursewareAssetMetadata["source_type"], string> = {
  teacher_generated: "老师课件",
  platform_curated: "平台精选",
  official_seed: "官方基础资源",
};

const qualityLabels: Record<CoursewareAssetMetadata["quality_status"], string> = {
  draft: "待老师确认",
  teacher_verified: "老师已确认",
  platform_verified: "平台已确认",
};

const recommendationToneClass = {
  strong: "bg-indigo-100 text-indigo-700",
  good: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  muted: "bg-slate-100 text-slate-600",
  neutral: "bg-slate-100 text-slate-600",
};

export function StudentKnowledgeClient({
  points,
  explanations,
  coursewares,
  practiceRecords,
  initialCode,
}: StudentKnowledgeClientProps) {
  const defaultPoint =
    points.find((point) => point.code === initialCode) ??
    points.find(
      (point) =>
        ["J-MATH-RJ-71-01-03", "J-MATH-RJ-71-05-03"].includes(point.code) &&
        coursewares.some((record) => record.knowledge_point_code === point.code)
    ) ??
    points.find((point) =>
      coursewares.some((record) => record.knowledge_point_code === point.code)
    ) ??
    points.find((point) => point.code === "J-MATH-RJ-71-01-03") ??
    points[0];

  const [selectedCode, setSelectedCode] = useState(defaultPoint?.code ?? "");
  const [selectedCoursewareIds, setSelectedCoursewareIds] = useState<Record<string, string>>({});
  const [states, setStates] = useState<Record<string, GenerationState>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [practiceStates, setPracticeStates] = useState<Record<string, PracticeState>>({});

  const explanationByCode = useMemo(() => {
    return new Map(explanations.map((record) => [record.knowledge_point_code, record]));
  }, [explanations]);

  const coursewaresByCode = useMemo(() => {
    const grouped = new Map<string, CoursewareLearningResource[]>();

    for (const record of coursewares) {
      const current = grouped.get(record.knowledge_point_code) ?? [];
      current.push(record);
      grouped.set(record.knowledge_point_code, current);
    }

    for (const [code, records] of grouped.entries()) {
      grouped.set(code, sortCoursewareResources(records));
    }

    return grouped;
  }, [coursewares]);

  const practiceByKey = useMemo(() => {
    return new Map(
      practiceRecords.map((record) => [
        practiceKey(record.courseware_id ?? "none", record.practice_item_index),
        record,
      ])
    );
  }, [practiceRecords]);

  const selectedPoint = points.find((point) => point.code === selectedCode) ?? points[0];
  const explanation = selectedPoint ? explanationByCode.get(selectedPoint.code) ?? null : null;
  const selectedCoursewares = selectedPoint
    ? coursewaresByCode.get(selectedPoint.code) ?? []
    : [];
  const selectedCoursewareId = selectedPoint
    ? selectedCoursewareIds[selectedPoint.code]
    : undefined;
  const courseware =
    selectedCoursewares.find((record) => record.id === selectedCoursewareId) ??
    selectedCoursewares[0] ??
    null;
  const coursewareMetadata = courseware
    ? getCoursewareAssetMetadata(courseware.content_json)
    : null;
  const coursewareRecommendation = courseware
    ? getCoursewareRecommendation({ ...courseware, is_published: true })
    : null;
  const coursewareRecommendationReasons = courseware
    ? getCoursewareRecommendationReasons({ ...courseware, is_published: true })
    : [];
  const generationState =
    selectedPoint && states[selectedPoint.id]
      ? states[selectedPoint.id]
      : initialState(explanation?.content ?? null, explanation?.id ?? null);

  async function generate(point: KnowledgePoint) {
    setStates((current) => ({
      ...current,
      [point.id]: { ...initialState(), loading: true },
    }));

    try {
      const response = await fetch("/api/knowledge-explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: point.code,
          name: point.name,
          description: point.description,
          subject: point.subject,
          grade: point.grade,
          semester: point.semester,
          chapter: point.chapter,
        }),
      });

      const payload = (await response.json()) as {
        content?: string;
        recordId?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "知识点讲解生成失败");
      }

      setStates((current) => ({
        ...current,
        [point.id]: {
          loading: false,
          error: null,
          content: payload.content ?? "",
          recordId: payload.recordId ?? null,
        },
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "知识点讲解生成失败";
      setStates((current) => ({
        ...current,
        [point.id]: {
          loading: false,
          error: message,
          content: null,
          recordId: null,
        },
      }));
    }
  }

  async function submitPractice(coursewareId: string, index: number) {
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

      setPracticeStates((current) => ({
        ...current,
        [key]: {
          loading: false,
          error: null,
          record: payload.record ?? null,
          expectedAnswer: payload.expectedAnswer ?? payload.record?.expected_answer ?? null,
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

  if (!selectedPoint) {
    return null;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <p className="text-sm font-semibold text-slate-900">选择知识点</p>
        <div className="mt-4 space-y-2">
          {points.map((point) => {
            const pointCoursewareCount = coursewaresByCode.get(point.code)?.length ?? 0;
            const hasCourseware = pointCoursewareCount > 0;
            const isSelected = point.code === selectedPoint.code;

            return (
              <button
                key={point.id}
                type="button"
                onClick={() => setSelectedCode(point.code)}
                className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                  isSelected
                    ? "border-teal-300 bg-white shadow-sm"
                    : "border-transparent bg-white/60 hover:border-teal-200 hover:bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{point.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {point.grade} · {point.chapter}
                    </p>
                  </div>
                  {hasCourseware ? (
                    <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                      {pointCoursewareCount} 份
                    </span>
                  ) : null}
                </div>
                <code className="mt-2 inline-block rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
                  {point.code}
                </code>
              </button>
            );
          })}
        </div>
      </aside>

      <article className="space-y-5">
        {initialCode && selectedPoint.code === initialCode ? (
          <section className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  正在巩固一个弱项知识点
                </p>
                <p className="mt-1 text-sm leading-6 text-amber-800">
                  先看学习包，再完成下面的基础练习；系统会根据练习结果更新掌握信号。
                </p>
              </div>
              <code className="w-fit rounded bg-white px-2 py-1 font-mono text-xs text-amber-700 ring-1 ring-amber-100">
                {initialCode}
              </code>
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl border border-teal-200/70 bg-gradient-to-br from-teal-50 to-white p-6 shadow-sm">
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            <span className="rounded-full bg-teal-100 px-2.5 py-1 text-teal-700">
              {selectedPoint.subject}
            </span>
            <span className="rounded-full bg-slate-200 px-2.5 py-1 text-slate-700">
              {selectedPoint.grade}
            </span>
            <span className="rounded-full bg-white px-2.5 py-1 text-slate-600 ring-1 ring-slate-200">
              {selectedPoint.semester}
            </span>
          </div>
          <p className="mt-4 text-sm font-medium text-slate-500">{selectedPoint.chapter}</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">{selectedPoint.name}</h2>
          <code className="mt-2 inline-block rounded bg-white px-2 py-0.5 font-mono text-xs text-teal-800 ring-1 ring-teal-200">
            {selectedPoint.code}
          </code>
          <p className="mt-4 leading-7 text-slate-600">{selectedPoint.description}</p>
        </section>

        {courseware ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-emerald-600">
                  基础知识学习包
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">
                  目标、例题、易错点和基础练习
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                  {formatCreatedAt(courseware.created_at)}
                </span>
                {coursewareMetadata ? (
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 ring-1 ring-sky-200">
                    {sourceLabels[coursewareMetadata.source_type]} ·{" "}
                    {qualityLabels[coursewareMetadata.quality_status]}
                  </span>
                ) : null}
                {coursewareRecommendation ? (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      recommendationToneClass[coursewareRecommendation.tone]
                    }`}
                  >
                    {coursewareRecommendation.label}
                  </span>
                ) : null}
                <Link
                  href={`/student/courseware/${courseware.id}`}
                  className="rounded-full bg-teal-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-teal-700"
                >
                  打开课件学习
                </Link>
              </div>
            </div>

            {coursewareRecommendationReasons.length > 0 ? (
              <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                <p className="text-sm font-semibold text-slate-900">为什么推荐这份学习包</p>
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-slate-600">
                  {coursewareRecommendationReasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {selectedCoursewares.length > 1 ? (
              <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">选择学习课件</p>
                    <p className="mt-1 text-xs text-slate-500">
                      同一知识点下可切换不同老师或平台沉淀的课件，优先使用已发布资源，减少重复生成成本。
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
                    {selectedCoursewares.length} 份可选
                  </span>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {selectedCoursewares.map((item, index) => {
                    const metadata = getCoursewareAssetMetadata(item.content_json);
                    const recommendation = getCoursewareRecommendation({
                      ...item,
                      is_published: true,
                    });
                    const isActive = item.id === courseware.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          setSelectedCoursewareIds((current) => ({
                            ...current,
                            [item.knowledge_point_code]: item.id,
                          }))
                        }
                        className={`rounded-lg border px-3 py-3 text-left transition ${
                          isActive
                            ? "border-emerald-300 bg-white shadow-sm"
                            : "border-transparent bg-white/70 hover:border-emerald-200 hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-900">
                            课件 {index + 1}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              recommendationToneClass[recommendation.tone]
                            }`}
                          >
                            {recommendation.label}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-600">
                          {sourceLabels[metadata.source_type]} ·{" "}
                          {qualityLabels[metadata.quality_status]}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {formatCreatedAt(item.created_at)} · 推荐分 {recommendation.score}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">学习目标</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {courseware.content_json.learning_goals.length}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">例题</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {courseware.content_json.examples.length}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">基础练习</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {courseware.content_json.practice_items.length}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-6">
              <section>
                <h4 className="text-sm font-semibold text-slate-900">学习目标</h4>
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-slate-700">
                  {courseware.content_json.learning_goals.map((goal) => (
                    <li key={goal}>{goal}</li>
                  ))}
                </ul>
              </section>

              <section className="rounded-xl bg-teal-50/60 p-4">
                <h4 className="text-sm font-semibold text-slate-900">
                  {courseware.content_json.core_concept.title}
                </h4>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {courseware.content_json.core_concept.explanation}
                </p>
              </section>

              <section>
                <h4 className="text-sm font-semibold text-slate-900">典型例题</h4>
                <div className="mt-3 space-y-3">
                  {courseware.content_json.examples.slice(0, 2).map((example) => (
                    <div key={example.title} className="rounded-xl border border-slate-100 p-4">
                      <p className="font-medium text-slate-900">{example.title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{example.question}</p>
                      <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-6 text-slate-600">
                        {example.solution_steps.map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ol>
                      <p className="mt-3 text-sm font-medium text-teal-700">
                        答案：{example.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h4 className="text-sm font-semibold text-slate-900">易错点提醒</h4>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {courseware.content_json.common_mistakes.slice(0, 3).map((mistake) => (
                    <div key={mistake.mistake} className="rounded-xl bg-amber-50 p-4">
                      <p className="text-sm font-semibold text-amber-900">{mistake.mistake}</p>
                      <p className="mt-2 text-xs leading-5 text-amber-800">
                        原因：{mistake.reason}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-amber-800">
                        纠正：{mistake.correction}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section id="practice">
                <h4 className="text-sm font-semibold text-slate-900">基础练习</h4>
                <div className="mt-3 space-y-3">
                  {courseware.content_json.practice_items.map((item, index) => {
                    const key = practiceKey(courseware.id, index);
                    const savedRecord = practiceByKey.get(key) ?? null;
                    const practiceState = practiceStates[key] ?? {
                      loading: false,
                      error: null,
                      record: savedRecord,
                      expectedAnswer: savedRecord?.expected_answer ?? null,
                      explanation: null,
                    };
                    const answerValue = answers[key] ?? savedRecord?.student_answer ?? "";

                    return (
                      <div key={`${item.question}-${index}`} className="rounded-xl bg-slate-50 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                            {item.difficulty}
                          </span>
                          <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-500 ring-1 ring-slate-200">
                            {item.knowledge_point_code}
                          </code>
                          {practiceState.record ? (
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                practiceState.record.is_correct
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-rose-100 text-rose-700"
                              }`}
                            >
                              {practiceState.record.is_correct ? "已掌握" : "需复习"}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-3 text-sm font-medium text-slate-900">
                          {index + 1}. {item.question}
                        </p>
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                          <input
                            value={answerValue}
                            onChange={(event) =>
                              setAnswers((current) => ({
                                ...current,
                                [key]: event.target.value,
                              }))
                            }
                            placeholder="输入你的答案"
                            className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
                          />
                          <button
                            type="button"
                            onClick={() => submitPractice(courseware.id, index)}
                            disabled={practiceState.loading}
                            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-teal-300"
                          >
                            {practiceState.loading ? "提交中..." : "提交答案"}
                          </button>
                        </div>
                        {practiceState.error ? (
                          <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
                            {practiceState.error}
                          </p>
                        ) : null}
                        {practiceState.record ? (
                          <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-sm">
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
                              {practiceState.expectedAnswer ??
                                practiceState.record.expected_answer}
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
                                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                  继续基础练习
                                </Link>
                                <Link
                                  href={`/student/courseware/${courseware.id}?practice=${index}#practice-${
                                    index + 1
                                  }`}
                                  className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
                                >
                                  打开课件重看本题
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
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
            该知识点暂无老师发布的结构化学习包。可以先查看知识点说明，等待老师发布课件后再做练习。
          </section>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-teal-600">
                AI讲解
              </p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">
                用更简单的话把知识点讲清楚
              </h3>
            </div>
            <button
              type="button"
              onClick={() => generate(selectedPoint)}
              disabled={generationState.loading}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-teal-300"
            >
              {generationState.loading
                ? "生成中..."
                : generationState.content
                  ? "重新生成讲解"
                  : "生成讲解"}
            </button>
          </div>

          {generationState.error ? (
            <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {generationState.error}
            </p>
          ) : null}

          {generationState.content ? (
            <div className="mt-5 rounded-xl border border-teal-100 bg-teal-50/40 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">讲解内容</p>
                {generationState.recordId ? (
                  <span className="text-xs text-slate-400">已保存</span>
                ) : null}
              </div>
              <div className="prose prose-sm max-w-none text-slate-700">
                <ReactMarkdown>{generationState.content}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-slate-500">
              可以生成一份更适合自学的知识点讲解，帮助你先把概念和步骤弄明白。
            </p>
          )}
        </section>
      </article>
    </div>
  );
}
