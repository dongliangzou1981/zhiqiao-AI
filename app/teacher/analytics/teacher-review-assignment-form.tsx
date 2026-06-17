"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";

type TeacherReviewAssignmentFormProps = {
  knowledgePointCode: string;
  studentIds: string[];
  label?: string;
};

type SubmitState = {
  loading: boolean;
  message: string | null;
  tone: "idle" | "success" | "error";
};

function getDefaultDueDate() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function TeacherReviewAssignmentForm({
  knowledgePointCode,
  studentIds,
  label = "布置复习",
}: TeacherReviewAssignmentFormProps) {
  const [dueDate, setDueDate] = useState(getDefaultDueDate);
  const [state, setState] = useState<SubmitState>({
    loading: false,
    message: null,
    tone: "idle",
  });
  const normalizedStudentIds = useMemo(
    () => [...new Set(studentIds.filter(Boolean))],
    [studentIds]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ loading: true, message: null, tone: "idle" });

    try {
      const response = await fetch("/api/teacher-review-assignment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          knowledgePointCode,
          studentIds: normalizedStudentIds,
          dueDate,
        }),
      });
      const payload = (await response.json()) as { error?: string; tasks?: unknown[] };

      if (!response.ok) {
        throw new Error(payload.error || "布置复习失败");
      }

      setState({
        loading: false,
        message: `已布置 ${payload.tasks?.length ?? normalizedStudentIds.length} 个任务`,
        tone: "success",
      });
    } catch (error) {
      setState({
        loading: false,
        message: error instanceof Error ? error.message : "布置复习失败",
        tone: "error",
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-[14rem] flex-col gap-1.5">
      <div className="flex flex-wrap gap-1.5">
        <input
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          className="min-h-8 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          aria-label="复习到期日"
        />
        <button
          type="submit"
          disabled={state.loading || normalizedStudentIds.length === 0}
          className="min-h-8 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
        >
          {state.loading ? "布置中..." : label}
        </button>
      </div>
      {state.message ? (
        <p
          className={`text-xs ${
            state.tone === "success" ? "text-emerald-700" : "text-rose-700"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
