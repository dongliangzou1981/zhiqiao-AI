"use client";

import { useMemo, useState } from "react";
import {
  buildCoursewareFeedbackStatus,
  type CoursewareFeedbackLevel,
} from "@/lib/student-courseware-feedback";

export type StudentCoursewareFeedback = {
  id: string;
  courseware_id: string;
  knowledge_point_code: string;
  knowledge_point_name: string;
  understanding_level: CoursewareFeedbackLevel;
  need_teacher_help: boolean;
  feedback_text: string | null;
  updated_at: string;
};

type StudentCoursewareFeedbackPanelProps = {
  coursewareId: string;
  initialFeedback: StudentCoursewareFeedback | null;
};

const LEVEL_OPTIONS: Array<{
  value: CoursewareFeedbackLevel;
  label: string;
  description: string;
}> = [
  {
    value: "understood",
    label: "学懂了",
    description: "我能说清楚这个知识点，并愿意继续练习。",
  },
  {
    value: "partly_understood",
    label: "有点懂",
    description: "大概跟上了，但还有步骤需要再看一遍。",
  },
  {
    value: "not_understood",
    label: "没看懂",
    description: "这份课件还没把我讲明白，需要重新解释。",
  },
];

function feedbackToneClass(tone: "positive" | "warning" | "critical") {
  if (tone === "positive") {
    return "border-emerald-300/30 bg-emerald-400/10 text-emerald-100";
  }

  if (tone === "warning") {
    return "border-amber-300/30 bg-amber-400/10 text-amber-100";
  }

  return "border-rose-300/30 bg-rose-400/10 text-rose-100";
}

export function StudentCoursewareFeedbackPanel({
  coursewareId,
  initialFeedback,
}: StudentCoursewareFeedbackPanelProps) {
  const [feedback, setFeedback] = useState<StudentCoursewareFeedback | null>(initialFeedback);
  const [level, setLevel] = useState<CoursewareFeedbackLevel>(
    initialFeedback?.understanding_level ?? "understood"
  );
  const [needTeacherHelp, setNeedTeacherHelp] = useState(
    initialFeedback?.need_teacher_help ?? false
  );
  const [feedbackText, setFeedbackText] = useState(initialFeedback?.feedback_text ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = useMemo(
    () => buildCoursewareFeedbackStatus(level, needTeacherHelp),
    [level, needTeacherHelp]
  );

  async function submitFeedback() {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/student-courseware-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coursewareId,
          understandingLevel: level,
          needTeacherHelp,
          feedbackText,
        }),
      });

      const payload = (await response.json()) as {
        feedback?: StudentCoursewareFeedback;
        error?: string;
      };

      if (!response.ok || !payload.feedback) {
        throw new Error(payload.error || "保存反馈失败");
      }

      setFeedback(payload.feedback);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "保存反馈失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">这份课件你学懂了吗？</p>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            这里不会影响成绩，只是帮助老师知道哪里还需要讲得更清楚。
          </p>
        </div>
        {feedback ? (
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">
            已保存反馈
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {LEVEL_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setLevel(option.value)}
            className={`rounded-2xl border p-4 text-left transition ${
              level === option.value
                ? "border-teal-300 bg-teal-300/10 text-white"
                : "border-white/10 bg-white/[0.03] text-slate-200 hover:border-white/25"
            }`}
          >
            <span className="text-sm font-semibold">{option.label}</span>
            <span className="mt-2 block text-xs leading-5 text-slate-400">
              {option.description}
            </span>
          </button>
        ))}
      </div>

      <label className="mt-4 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-200">
        <input
          type="checkbox"
          checked={needTeacherHelp}
          onChange={(event) => setNeedTeacherHelp(event.target.checked)}
          className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-teal-500"
        />
        <span>
          <span className="block font-semibold text-white">希望老师再讲一次</span>
          <span className="mt-1 block text-xs leading-5 text-slate-400">
            如果你觉得某一步卡住了，可以勾选，老师之后能看到这个信号。
          </span>
        </span>
      </label>

      <textarea
        value={feedbackText}
        onChange={(event) => setFeedbackText(event.target.value)}
        maxLength={600}
        placeholder="可选：写下你没看懂的地方，例如“去括号这一步为什么要变号？”"
        className="mt-4 min-h-24 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-500 focus:border-teal-300 focus:ring-2 focus:ring-teal-400/20"
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className={`rounded-xl border px-3 py-2 text-xs ${feedbackToneClass(status.tone)}`}>
          <span className="font-semibold">{status.label}</span>
          <span className="ml-2 text-current/80">{status.summary}</span>
        </div>
        <button
          type="button"
          onClick={submitFeedback}
          disabled={saving}
          className="rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:bg-teal-900 disabled:text-teal-100"
        >
          {saving ? "正在保存..." : feedback ? "更新反馈" : "提交反馈"}
        </button>
      </div>

      {error ? (
        <p className="mt-3 rounded-xl bg-rose-400/10 px-3 py-2 text-sm text-rose-100">
          {error}
        </p>
      ) : null}
    </section>
  );
}
