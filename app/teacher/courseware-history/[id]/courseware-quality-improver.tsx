"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getCoursewareImproveButtonLabel,
  getCoursewareImproveProgressMessage,
} from "@/lib/courseware-improve-ui";
import { coursewareImprovePresets } from "@/lib/courseware-improve-presets";

type CoursewareQualityImproverProps = {
  coursewareId: string;
  issueCount: number;
  passedRequired: boolean;
  initialInstruction?: string;
};

export function CoursewareQualityImprover({
  coursewareId,
  issueCount,
  passedRequired,
  initialInstruction = "",
}: CoursewareQualityImproverProps) {
  const router = useRouter();
  const [instruction, setInstruction] = useState(initialInstruction);
  const [loading, setLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) {
      setElapsedSeconds(0);
      return;
    }

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [loading]);

  async function improve() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/courseware/${coursewareId}/improve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "生成优化候选版失败，请稍后再试。");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成优化候选版失败，请稍后再试。");
    } finally {
      setLoading(false);
    }
  }

  const buttonLabel = getCoursewareImproveButtonLabel({
    loading,
    issueCount,
    passedRequired,
  });

  function applyPreset(presetInstruction: string) {
    setInstruction((current) =>
      current.trim() ? `${current.trim()}\n${presetInstruction}` : presetInstruction
    );
  }

  return (
    <div className="mt-5 rounded-xl bg-white/85 p-4 ring-1 ring-black/5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex-1">
          <label
            htmlFor="courseware-quality-instruction"
            className="text-sm font-semibold text-slate-900"
          >
            老师补充优化要求
          </label>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            这里写给 AI 的补充要求，例如“例题推导更完整”“少一点套话”“把易错点讲慢一点”。
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {coursewareImprovePresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.instruction)}
                className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
              >
                {preset.label}
              </button>
            ))}
          </div>
          <textarea
            id="courseware-quality-instruction"
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            rows={3}
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
            placeholder="例如：重点补全去括号和移项的每一步理由，减少 AI 腔，页面更适合投屏。"
          />
        </div>

        <button
          type="button"
          onClick={() => void improve()}
          disabled={loading}
          className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
        >
          {buttonLabel}
        </button>
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        生成结果会作为“优化候选版”保存。老师确认采用前，不会覆盖当前课件，也不会影响学生端。
      </p>

      {loading ? (
        <p className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs leading-5 text-indigo-800">
          {getCoursewareImproveProgressMessage(elapsedSeconds)}
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
