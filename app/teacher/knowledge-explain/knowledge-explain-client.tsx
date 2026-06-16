"use client";

import Link from "next/link";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

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

type GenerationState = {
  loading: boolean;
  error: string | null;
  content: string | null;
  recordId: string | null;
};

type KnowledgeExplainClientProps = {
  points: KnowledgePoint[];
};

function initialState(): GenerationState {
  return {
    loading: false,
    error: null,
    content: null,
    recordId: null,
  };
}

function buildCoursewareHref(code: string) {
  const params = new URLSearchParams({
    knowledgePointCode: code,
    source: "knowledge-explain",
  });

  return `/teacher/courseware?${params.toString()}`;
}

export function KnowledgeExplainClient({ points }: KnowledgeExplainClientProps) {
  const [states, setStates] = useState<Record<string, GenerationState>>({});

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

  return (
    <>
      {points.map((point) => {
        const state = states[point.id] ?? initialState();

        return (
          <article
            key={point.id}
            className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 transition hover:border-indigo-200 hover:bg-indigo-50/40"
          >
            <div className="flex flex-wrap gap-2 text-xs font-medium">
              <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-indigo-700">
                {point.subject}
              </span>
              <span className="rounded-full bg-slate-200 px-2.5 py-1 text-slate-700">
                {point.grade}
              </span>
              <span className="rounded-full bg-white px-2.5 py-1 text-slate-600 ring-1 ring-slate-200">
                {point.semester}
              </span>
            </div>
            <p className="mt-4 text-sm font-medium text-slate-500">{point.chapter}</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">{point.name}</h2>
            <p className="mt-1 text-xs text-slate-400">{point.code}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{point.description}</p>

            <button
              type="button"
              onClick={() => generate(point)}
              disabled={state.loading}
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              {state.loading ? "生成中..." : "生成讲解"}
            </button>

            {state.error ? (
              <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {state.error}
              </p>
            ) : null}

            {state.content ? (
              <div className="mt-5 rounded-xl border border-indigo-100 bg-white p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">生成结果</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {state.recordId ? (
                      <span className="text-xs text-slate-400">记录已保存</span>
                    ) : null}
                    <Link
                      href={buildCoursewareHref(point.code)}
                      className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200 transition hover:bg-indigo-100"
                    >
                      生成课件
                    </Link>
                  </div>
                </div>
                <div className="prose prose-sm max-w-none text-slate-700">
                  <ReactMarkdown>{state.content}</ReactMarkdown>
                </div>
              </div>
            ) : null}
          </article>
        );
      })}
    </>
  );
}
