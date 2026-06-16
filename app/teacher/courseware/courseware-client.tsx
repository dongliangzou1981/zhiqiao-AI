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

type CoursewareRecord = {
  id: string;
  created_at: string;
};

type CoursewareResult = {
  point: KnowledgePoint;
  content: string;
  record: CoursewareRecord | null;
  dynamicReady: boolean;
};

type CoursewareClientProps = {
  points: KnowledgePoint[];
  initialKnowledgePointCode?: string;
  source?: string;
  modelLabel: string;
};

const SAMPLE_CODES = new Set(["J-MATH-RJ-71-01-03", "J-MATH-RJ-71-05-03"]);

function isSamplePoint(point: KnowledgePoint) {
  return SAMPLE_CODES.has(point.code);
}

function toTeacherEditableText(markdown: string) {
  return markdown
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/^\s*---+\s*$/gm, "")
    .replace(/^\s*[-*]\s+/gm, "· ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getSourceLabel(source: string | undefined) {
  if (source === "lesson-plan") {
    return "已从教案生成流程进入。建议先确认教案内容，再围绕同一知识点生成课件。";
  }

  if (source === "knowledge-explain") {
    return "已从知识点讲解流程进入。建议把讲解中最关键的步骤转成课件页。";
  }

  if (source === "analytics") {
    return "已从学情入口进入。建议优先为薄弱知识点生成可复用课件。";
  }

  return "";
}

export function CoursewareClient({
  points,
  initialKnowledgePointCode,
  source,
  modelLabel,
}: CoursewareClientProps) {
  const initialPoint = initialKnowledgePointCode
    ? points.find((point) => point.code === initialKnowledgePointCode)
    : null;
  const defaultPoint =
    initialPoint ?? points.find((point) => point.code === "J-MATH-RJ-71-01-03") ?? points[0];
  const [selectedCode, setSelectedCode] = useState(defaultPoint?.code ?? "");
  const [result, setResult] = useState<CoursewareResult | null>(null);
  const [editableContent, setEditableContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dynamicMessage, setDynamicMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dynamicLoading, setDynamicLoading] = useState(false);

  const selectedPoint = points.find((point) => point.code === selectedCode) ?? null;
  const sourceLabel = getSourceLabel(source);

  async function generateTextCourseware() {
    if (!selectedPoint) {
      setError("请先选择知识点");
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    setDynamicMessage(null);
    setResult(null);
    setEditableContent("");

    try {
      const response = await fetch("/api/courseware", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: selectedPoint.code,
          name: selectedPoint.name,
          description: selectedPoint.description,
          subject: selectedPoint.subject,
          grade: selectedPoint.grade,
          semester: selectedPoint.semester,
          chapter: selectedPoint.chapter,
        }),
      });

      const payload = (await response.json()) as {
        courseware?: string;
        record?: CoursewareRecord;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "生成文本课件失败");
      }

      if (!payload.courseware) {
        throw new Error("模型没有返回课件内容");
      }

      setEditableContent(toTeacherEditableText(payload.courseware));
      setResult({
        point: selectedPoint,
        content: payload.courseware,
        record: payload.record ?? null,
        dynamicReady: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成文本课件失败");
    } finally {
      setLoading(false);
    }
  }

  async function generateDynamicCourseware() {
    if (!result?.record) {
      setError("文本课件尚未保存，不能生成动态课件");
      return;
    }

    const content = editableContent.trim();
    if (!content) {
      setError("文本课件为空，请先生成或填写文本课件");
      return;
    }

    setDynamicLoading(true);
    setError(null);
    setDynamicMessage(null);

    try {
      const response = await fetch(`/api/courseware/${result.record.id}/dynamic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentMarkdown: content }),
      });
      const payload = (await response.json()) as {
        coursewareJson?: unknown;
        error?: string;
      };

      if (!response.ok || !payload.coursewareJson) {
        throw new Error(payload.error || "生成动态课件失败");
      }

      setResult({
        ...result,
        content,
        dynamicReady: true,
      });
      setDynamicMessage("动态课件已生成并保存。可以进入课件详情预览幻灯片式演示。");
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成动态课件失败");
    } finally {
      setDynamicLoading(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-indigo-600">
            P2 阶段2
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">知识点导向课件</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            当前文本课件模型：<span className="font-semibold text-emerald-700">{modelLabel}</span>
            。先让模型生成文本，老师确认后再生成动态课件。
          </p>
        </div>

        <div className="mt-5 grid gap-2 text-xs">
          <div className="rounded-lg bg-indigo-50 px-3 py-2 font-medium text-indigo-700">
            1. 选择知识点
          </div>
          <div className="rounded-lg bg-emerald-50 px-3 py-2 font-medium text-emerald-700">
            2. 生成并调整文本课件
          </div>
          <div className="rounded-lg bg-sky-50 px-3 py-2 font-medium text-sky-700">
            3. 确认文本后生成动态课件
          </div>
        </div>

        {sourceLabel ? (
          <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
            {sourceLabel}
          </p>
        ) : null}

        <label htmlFor="knowledge-point" className="mt-6 block text-sm font-medium text-slate-700">
          知识点
        </label>
        <select
          id="knowledge-point"
          value={selectedCode}
          onChange={(event) => {
            setSelectedCode(event.target.value);
            setError(null);
            setDynamicMessage(null);
            setResult(null);
            setEditableContent("");
          }}
          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
        >
          {points.map((point) => (
            <option key={point.id} value={point.code}>
              {isSamplePoint(point) ? "样板 | " : ""}
              {point.grade} | {point.chapter} | {point.name}
            </option>
          ))}
        </select>

        {selectedPoint ? (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap gap-2 text-xs font-medium">
              <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-indigo-700">
                {selectedPoint.subject}
              </span>
              <span className="rounded-full bg-slate-200 px-2.5 py-1 text-slate-700">
                {selectedPoint.grade}
              </span>
              {isSamplePoint(selectedPoint) ? (
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700">
                  样板优先
                </span>
              ) : null}
            </div>
            <p className="mt-4 text-sm font-medium text-slate-500">{selectedPoint.chapter}</p>
            <h3 className="mt-1 text-base font-semibold text-slate-900">{selectedPoint.name}</h3>
            <code className="mt-2 inline-block rounded bg-white px-2 py-0.5 font-mono text-xs text-slate-700 ring-1 ring-slate-200">
              {selectedPoint.code}
            </code>
            <p className="mt-3 text-sm leading-6 text-slate-600">{selectedPoint.description}</p>
          </div>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={generateTextCourseware}
          disabled={loading || !selectedPoint}
          className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
        >
          {loading ? `${modelLabel} 正在生成文本课件...` : "生成文本课件"}
        </button>

        <p className="mt-4 text-xs leading-5 text-slate-400">
          GPT-5.5 生成较详细文本时可能需要 1-3 分钟。请等待结果出现，不要重复点击。
        </p>
      </section>

      <section className="min-h-[420px]">
        {!result && !loading ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/70 p-8 text-center">
            <p className="text-base font-semibold text-slate-700">尚未开始生成文本课件</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              当前只是从教案流程带入并预选了知识点。为避免误触产生模型费用，需要老师点击按钮后才会调用 {modelLabel}。
            </p>
            <button
              type="button"
              onClick={generateTextCourseware}
              disabled={!selectedPoint}
              className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              现在生成文本课件
            </button>
            <p className="mt-3 text-xs leading-5 text-slate-400">
              开始后按钮会显示“正在生成”，通常需要 1 分钟左右。
            </p>
          </div>
        ) : null}

        {loading ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
            <p className="mt-4 text-sm text-slate-500">正在调用 {modelLabel} 生成文本课件...</p>
            <p className="mt-1 text-xs text-slate-400">
              当前只生成文本课件，确认后再生成动态课件。
            </p>
          </div>
        ) : null}

        {result && !loading ? (
          <article className="space-y-4">
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-indigo-600">
                    文本课件已生成
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-slate-900">
                    {result.point.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {result.point.grade} | {result.point.semester} | {result.point.chapter}
                  </p>
                </div>
                {result.record ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                      已保存
                    </span>
                    <Link
                      href={`/teacher/courseware-history/${result.record.id}`}
                      className="rounded-full bg-white px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200 transition hover:bg-indigo-50"
                    >
                      查看详情
                    </Link>
                  </div>
                ) : null}
              </div>
              <code className="mt-3 inline-block rounded bg-white/80 px-2 py-0.5 font-mono text-xs text-indigo-800 ring-1 ring-indigo-200">
                {result.point.code}
              </code>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-sm font-semibold text-slate-900">
                第二步：老师确认或调整课件正文
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                这里只改实际内容。标题、加粗、分隔线等格式符号由系统处理，避免误删符号影响后续生成。
              </p>
              <textarea
                value={editableContent}
                onChange={(event) => setEditableContent(event.target.value)}
                rows={18}
                className="mt-4 w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm leading-7 text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20"
              />
              <p className="mt-2 text-xs leading-5 text-slate-500">
                已隐藏 Markdown 格式符号，例如 ##、**、---。老师只需要检查讲解、例题、步骤和练习是否准确。
              </p>
              <button
                type="button"
                onClick={generateDynamicCourseware}
                disabled={dynamicLoading || !result.record}
                className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                {dynamicLoading ? "正在生成动态课件..." : "确认文本并生成动态课件"}
              </button>
              {dynamicMessage ? (
                <p className="mt-3 rounded-lg bg-emerald-100 px-3 py-2 text-sm text-emerald-800">
                  {dynamicMessage}
                </p>
              ) : null}
              {result.dynamicReady && result.record ? (
                <Link
                  href={`/teacher/courseware-history/${result.record.id}`}
                  className="mt-3 inline-flex rounded-lg bg-white px-3 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-50"
                >
                  进入详情预览动态课件
                </Link>
              ) : null}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="mb-4 text-sm font-semibold text-slate-900">文本课件预览</p>
              <div className="prose prose-sm max-w-none text-slate-700">
                <ReactMarkdown>{editableContent}</ReactMarkdown>
              </div>
            </div>
          </article>
        ) : null}
      </section>
    </div>
  );
}
