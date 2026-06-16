import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { AI_TASKS, getAIModelConfig, type AIModelConfig, type AITask } from "@/lib/ai";
import { ModelSettingsEditor } from "./model-settings-editor";
import { ModelTestClient } from "./model-test-client";

export const metadata: Metadata = {
  title: "AI模型设置 · 知桥AI",
  description: "查看知桥AI各任务当前模型配置并测试连通性",
};

const taskLabels: Record<AITask, string> = {
  "lesson-plan": "教案生成",
  "student-qa": "学生答疑",
  "knowledge-explain": "知识点讲解",
  courseware: "课件 Markdown",
  "courseware-json": "课件结构化 JSON",
  "courseware-html": "互动课件 HTML",
};

const taskHints: Record<AITask, string> = {
  "lesson-plan": "面向教师备课，要求结构稳定、教学目标清楚。",
  "student-qa": "面向学生自学，要求解释耐心、低成本、响应快。",
  "knowledge-explain": "用于基础知识讲解，要求步骤完整、易错点清楚。",
  courseware: "生成中文课件正文，要求围绕知识点完整展开。",
  "courseware-json": "生成学生端可复用结构，要求 JSON 稳定、字段完整。",
  "courseware-html": "生成课堂投屏和 PPT-ready 互动课件，建议使用质量更好的模型。",
};

type TaskConfigView = {
  task: AITask;
  label: string;
  hint: string;
  config: AIModelConfig | null;
  error: string | null;
};

function getTaskConfig(task: AITask): TaskConfigView {
  try {
    return {
      task,
      label: taskLabels[task],
      hint: taskHints[task],
      config: getAIModelConfig(task),
      error: null,
    };
  } catch (error) {
    return {
      task,
      label: taskLabels[task],
      hint: taskHints[task],
      config: null,
      error: error instanceof Error ? error.message : "模型配置读取失败",
    };
  }
}

function ConfigBadge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
      {children}
    </span>
  );
}

export default function ModelSettingsPage() {
  const taskConfigs = AI_TASKS.map(getTaskConfig);
  const availableTaskOptions = taskConfigs
    .filter((item) => item.config)
    .map((item) => ({ task: item.task, label: item.label }));
  const configErrors = taskConfigs.filter((item) => item.error);
  const taskModels = Object.fromEntries(
    AI_TASKS.map((task) => [
      task,
      process.env[`AI_${task.replaceAll("-", "_").toUpperCase()}_MODEL`] ?? "",
    ])
  ) as Record<AITask, string>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">
      <header className="border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <div>
            <Link
              href="/teacher"
              className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
            >
              <span aria-hidden>←</span>
              返回教师工作台
            </Link>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
              AI模型设置
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              查看不同任务当前使用的模型，并做小样本连通性测试。正式生成的课件、讲解和练习仍会保存到资源库，学生端优先复用已发布资源，避免重复消耗高价模型。
            </p>
          </div>
          <Link
            href="/teacher/courseware-library"
            className="hidden shrink-0 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:inline-flex"
          >
            查看资源库
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <ModelSettingsEditor
          tasks={availableTaskOptions}
          initialValue={{
            provider: process.env.AI_PROVIDER ?? "",
            baseURL: process.env.AI_BASE_URL ?? "",
            defaultModel: process.env.AI_MODEL ?? "",
            jsonResponseFormat: process.env.AI_JSON_RESPONSE_FORMAT ?? "enabled",
            proxyUrl: process.env.AI_PROXY_URL ?? "",
            taskModels,
          }}
        />

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">配置范围</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{taskConfigs.length}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">覆盖教案、答疑、讲解和课件链路</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">可测试任务</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {availableTaskOptions.length}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">只使用短提示词检查连通性</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">安全策略</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">只读</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">密钥继续通过环境变量配置</p>
          </div>
        </section>

        <section className="rounded-2xl border border-amber-100 bg-amber-50/70 p-5">
          <h2 className="text-base font-semibold text-slate-900">成本与安全原则</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            这里不提供给老师直接填写 API Key 的入口。模型供应商、Base URL、密钥和任务级模型仍由部署环境统一配置；老师生成出的高质量课件会进入课件资源库，学生端默认读取已保存资源，降低重复推理成本。
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-indigo-600">当前模型矩阵</p>
            <h2 className="text-lg font-bold text-slate-900">按任务查看模型配置</h2>
          </div>

          <div className="mt-5 grid gap-3">
            {taskConfigs.map((item) => (
              <div
                key={item.task}
                className="rounded-xl border border-slate-100 bg-slate-50/70 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{item.label}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{item.hint}</p>
                    <code className="mt-2 inline-block rounded bg-white px-2 py-0.5 font-mono text-xs text-slate-500 ring-1 ring-slate-200">
                      {item.task}
                    </code>
                  </div>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    {item.config ? (
                      <>
                        <ConfigBadge>{item.config.provider}</ConfigBadge>
                        <ConfigBadge>{item.config.model}</ConfigBadge>
                        {item.config.baseURL ? <ConfigBadge>Base URL 已配置</ConfigBadge> : null}
                      </>
                    ) : (
                      <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700">
                        {item.error}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {configErrors.length > 0 ? (
          <section className="rounded-2xl border border-rose-100 bg-rose-50 p-5">
            <h2 className="text-base font-semibold text-rose-900">配置异常</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-rose-800">
              {configErrors.map((item) => (
                <li key={item.task}>
                  {item.label}：{item.error}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {availableTaskOptions.length > 0 ? (
          <ModelTestClient tasks={availableTaskOptions} />
        ) : (
          <section className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            当前没有可测试的模型配置，请先在部署环境中配置 AI_PROVIDER、AI_API_KEY 和 AI_MODEL。
          </section>
        )}
      </main>
    </div>
  );
}
