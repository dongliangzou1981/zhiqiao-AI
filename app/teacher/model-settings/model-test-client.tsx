"use client";

import { useState } from "react";
import type { AIModelConfig, AITask } from "@/lib/ai";

type ModelTaskOption = {
  task: AITask;
  label: string;
};

type TestState = {
  loading: boolean;
  error: string | null;
  output: string | null;
  config: AIModelConfig | null;
};

const initialState: TestState = {
  loading: false,
  error: null,
  output: null,
  config: null,
};

export function ModelTestClient({ tasks }: { tasks: ModelTaskOption[] }) {
  const [selectedTask, setSelectedTask] = useState<AITask>(tasks[0]?.task ?? "courseware");
  const [prompt, setPrompt] = useState(
    "请用一句中文说明你如何帮助老师把初中数学知识点讲清楚。"
  );
  const [state, setState] = useState<TestState>(initialState);

  async function testModel() {
    setState({ ...initialState, loading: true });

    try {
      const response = await fetch("/api/ai-model-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: selectedTask,
          prompt,
        }),
      });
      const payload = (await response.json()) as {
        output?: string;
        config?: AIModelConfig;
        error?: string;
      };

      if (!response.ok || !payload.output || !payload.config) {
        throw new Error(payload.error || "模型测试失败");
      }

      setState({
        loading: false,
        error: null,
        output: payload.output,
        config: payload.config,
      });
    } catch (error) {
      setState({
        loading: false,
        error: error instanceof Error ? error.message : "模型测试失败",
        output: null,
        config: null,
      });
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-indigo-600">连通性测试</p>
        <h2 className="text-lg font-bold text-slate-900">按任务测试当前模型</h2>
        <p className="text-sm leading-6 text-slate-500">
          只发送一条短提示词，用于确认模型、Base URL 和密钥配置可用。不要在这里输入学生隐私或敏感数据。
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[260px_1fr]">
        <div>
          <label htmlFor="task" className="text-sm font-medium text-slate-700">
            测试任务
          </label>
          <select
            id="task"
            value={selectedTask}
            onChange={(event) => setSelectedTask(event.target.value as AITask)}
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
          >
            {tasks.map((task) => (
              <option key={task.task} value={task.task}>
                {task.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="prompt" className="text-sm font-medium text-slate-700">
            测试提示词
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={3}
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-6 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void testModel()}
          disabled={state.loading}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
        >
          {state.loading ? "测试中..." : "测试模型"}
        </button>
        {state.config ? (
          <span className="text-xs text-slate-500">
            {state.config.provider} / {state.config.model}
          </span>
        ) : null}
      </div>

      {state.error ? (
        <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}

      {state.output ? (
        <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
          <p className="text-xs font-semibold text-emerald-700">模型返回</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">{state.output}</p>
        </div>
      ) : null}
    </section>
  );
}
