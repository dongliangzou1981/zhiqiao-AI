"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { StudentReviewTask } from "./page";

type StudentReviewClientProps = {
  tasks: StudentReviewTask[];
  focusCode?: string;
};

type TaskState = {
  loading: boolean;
  error: string | null;
};

function taskTypeLabel(type: StudentReviewTask["task_type"]) {
  return type === "mistake_review" ? "错题复习" : "一周回顾";
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSourcePracticeHref(task: StudentReviewTask) {
  const source = task.source_practice_record;
  if (!source?.courseware_id) return null;

  return `/student/courseware/${source.courseware_id}?practice=${
    source.practice_item_index
  }#practice-${source.practice_item_index + 1}`;
}

export function StudentReviewClient({ tasks, focusCode }: StudentReviewClientProps) {
  const [localTasks, setLocalTasks] = useState(tasks);
  const [states, setStates] = useState<Record<string, TaskState>>({});

  const focusTasks = useMemo(
    () =>
      focusCode
        ? localTasks.filter((task) => task.knowledge_point_code === focusCode)
        : localTasks,
    [focusCode, localTasks]
  );
  const pendingTasks = useMemo(
    () => focusTasks.filter((task) => task.status === "pending"),
    [focusTasks]
  );
  const completedTasks = useMemo(
    () => focusTasks.filter((task) => task.status === "completed").slice(0, 5),
    [focusTasks]
  );

  async function completeTask(taskId: string) {
    setStates((current) => ({
      ...current,
      [taskId]: { loading: true, error: null },
    }));

    try {
      const response = await fetch("/api/student-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });

      const payload = (await response.json()) as {
        task?: StudentReviewTask;
        error?: string;
      };

      if (!response.ok || !payload.task) {
        throw new Error(payload.error || "完成复习任务失败");
      }

      setLocalTasks((current) =>
        current.map((task) =>
          task.id === taskId
            ? {
                ...task,
                ...payload.task!,
                source_practice_record:
                  payload.task!.source_practice_record ?? task.source_practice_record,
              }
            : task
        )
      );
      setStates((current) => ({
        ...current,
        [taskId]: { loading: false, error: null },
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "完成复习任务失败";
      setStates((current) => ({
        ...current,
        [taskId]: { loading: false, error: message },
      }));
    }
  }

  if (localTasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
        <p className="text-sm font-semibold text-slate-700">暂无复习任务</p>
        <p className="mt-2 text-sm text-slate-500">
          完成基础练习后，系统会按错题和一周回顾生成复习任务。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {focusCode ? (
        <section className="rounded-xl border border-teal-100 bg-teal-50/70 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-teal-900">正在聚焦一个弱项知识点</p>
              <code className="mt-1 inline-block rounded bg-white px-2 py-0.5 font-mono text-xs text-teal-700 ring-1 ring-teal-100">
                {focusCode}
              </code>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/student/knowledge?code=${encodeURIComponent(focusCode)}#practice`}
                className="rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-teal-700"
              >
                去做基础练习
              </Link>
              <Link
                href="/student/review"
                className="rounded-lg border border-teal-200 bg-white px-3 py-2 text-xs font-semibold text-teal-700 transition hover:bg-teal-50"
              >
                查看全部复习
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {focusCode && focusTasks.length === 0 ? (
        <section className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
          <p className="text-sm font-semibold text-slate-700">这个知识点暂无复习任务</p>
          <p className="mt-2 text-sm text-slate-500">
            可以先回到知识点学习包完成基础练习，系统会根据练习结果生成复习任务。
          </p>
          <Link
            href={`/student/knowledge?code=${encodeURIComponent(focusCode)}#practice`}
            className="mt-4 inline-flex rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
          >
            去做基础练习
          </Link>
        </section>
      ) : null}

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">待复习</h2>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
            {pendingTasks.length} 个任务
          </span>
        </div>

        {pendingTasks.length === 0 ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-6 text-sm text-emerald-700">
            今天没有待复习任务。
          </div>
        ) : (
          <ul className="space-y-3">
            {pendingTasks.map((task) => {
              const state = states[task.id] ?? { loading: false, error: null };
              const sourcePracticeHref = getSourcePracticeHref(task);

              return (
                <li
                  key={task.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            task.task_type === "mistake_review"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-sky-100 text-sky-700"
                          }`}
                        >
                          {taskTypeLabel(task.task_type)}
                        </span>
                        <span className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-600 ring-1 ring-slate-200">
                          {formatDate(task.due_date)}
                        </span>
                      </div>
                      <p className="mt-3 font-semibold text-slate-900">
                        {task.knowledge_point_name}
                      </p>
                      <code className="mt-2 inline-block rounded bg-white px-2 py-0.5 font-mono text-xs text-slate-500 ring-1 ring-slate-200">
                        {task.knowledge_point_code}
                      </code>
                      {task.source_practice_record ? (
                        <div className="mt-3 rounded-lg border border-rose-100 bg-white p-3 text-xs leading-5 text-slate-600">
                          <p className="font-semibold text-slate-800">错题来源</p>
                          <p className="mt-1 line-clamp-2">
                            {task.source_practice_record.question}
                          </p>
                          <p className="mt-1">
                            你的答案：{task.source_practice_record.student_answer}
                          </p>
                          <p className="mt-1">
                            标准答案：{task.source_practice_record.expected_answer}
                          </p>
                          {task.source_practice_record.error_reason ? (
                            <p className="mt-1">
                              错误原因：{task.source_practice_record.error_reason}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      {sourcePracticeHref ? (
                        <Link
                          href={sourcePracticeHref}
                          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
                        >
                          重看错题课件
                        </Link>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => completeTask(task.id)}
                        disabled={state.loading}
                        className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-teal-300"
                      >
                        {state.loading ? "保存中..." : "完成复习"}
                      </button>
                    </div>
                  </div>
                  {state.error ? (
                    <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
                      {state.error}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-slate-900">最近完成</h2>
        {completedTasks.length === 0 ? (
          <p className="rounded-xl bg-slate-50 px-4 py-5 text-sm text-slate-500">
            还没有完成的复习任务。
          </p>
        ) : (
          <ul className="space-y-2">
            {completedTasks.map((task) => {
              const sourcePracticeHref = getSourcePracticeHref(task);

              return (
                <li
                  key={task.id}
                  className="rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-slate-800">
                      {task.knowledge_point_name}
                    </span>
                    <span className="text-xs text-slate-400">
                      {task.completed_at ? formatDateTime(task.completed_at) : "已完成"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {taskTypeLabel(task.task_type)} · {task.knowledge_point_code}
                  </p>
                  {task.source_practice_record ? (
                    <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/70 p-3 text-xs leading-5 text-slate-600">
                      <p className="font-semibold text-slate-800">已复盘的错题来源</p>
                      <p className="mt-1 line-clamp-2">
                        {task.source_practice_record.question}
                      </p>
                      <p className="mt-1">
                        你的答案：{task.source_practice_record.student_answer}
                      </p>
                      {task.source_practice_record.error_reason ? (
                        <p className="mt-1">
                          错误原因：{task.source_practice_record.error_reason}
                        </p>
                      ) : null}
                      {sourcePracticeHref ? (
                        <Link
                          href={sourcePracticeHref}
                          className="mt-2 inline-flex rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                        >
                          重看错题课件
                        </Link>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
