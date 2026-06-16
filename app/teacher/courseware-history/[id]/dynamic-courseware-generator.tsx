"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type DynamicCoursewareGeneratorProps = {
  coursewareId: string;
  initialMarkdown: string;
  mode?: "create" | "regenerate";
};

export function DynamicCoursewareGenerator({
  coursewareId,
  initialMarkdown,
  mode = "create",
}: DynamicCoursewareGeneratorProps) {
  const router = useRouter();
  const [content, setContent] = useState(initialMarkdown);
  const [showSource, setShowSource] = useState(mode === "create");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isRegenerate = mode === "regenerate";

  async function generate() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/courseware/${coursewareId}/dynamic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentMarkdown: content }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "动态课件生成失败");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "动态课件生成失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className={`rounded-2xl border p-6 shadow-sm ${
        isRegenerate
          ? "border-cyan-200 bg-cyan-50"
          : "border-amber-200 bg-amber-50"
      }`}
    >
      <p
        className={`text-xs font-medium uppercase tracking-wider ${
          isRegenerate ? "text-cyan-700" : "text-amber-700"
        }`}
      >
        {isRegenerate ? "重新生成动态课件" : "生成动态课件"}
      </p>
      <h3 className="mt-2 text-base font-semibold text-slate-900">
        {isRegenerate
          ? "让 AI 直接产出新的互动幻灯片"
          : "确认内容后生成互动幻灯片"}
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {isRegenerate
          ? "新方式会让模型直接生成可播放的 HTML 动态课件，系统只负责安全展示和保存。旧版固定播放器不会继续展示。"
          : "系统会基于老师确认后的文本，让模型直接生成适合课堂展示的互动幻灯片。"}
      </p>

      <button
        type="button"
        onClick={() => setShowSource((current) => !current)}
        className="mt-4 text-sm font-semibold text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
      >
        {showSource ? "收起生成依据" : "高级：调整生成依据"}
      </button>

      {showSource ? (
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={10}
          className={`mt-3 w-full rounded-xl border bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:ring-2 ${
            isRegenerate
              ? "border-cyan-200 focus:border-cyan-400 focus:ring-cyan-500/20"
              : "border-amber-200 focus:border-amber-400 focus:ring-amber-500/20"
          }`}
        />
      ) : null}

      <button
        type="button"
        onClick={() => void generate()}
        disabled={loading}
        className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed ${
          isRegenerate
            ? "bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-300"
            : "bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300"
        }`}
      >
        {loading
          ? isRegenerate
            ? "正在重新生成互动幻灯片..."
            : "正在生成互动幻灯片..."
          : isRegenerate
            ? "重新生成互动幻灯片"
            : "生成互动幻灯片"}
      </button>
      {error ? (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
    </section>
  );
}
