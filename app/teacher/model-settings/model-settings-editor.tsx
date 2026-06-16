"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AITask } from "@/lib/ai";

type Provider = "deepseek" | "openai" | "openai-compatible" | "ofox";

type TaskOption = {
  task: AITask;
  label: string;
};

type ModelSettingsValue = {
  provider: string;
  baseURL: string;
  defaultModel: string;
  jsonResponseFormat: string;
  proxyUrl: string;
  taskModels: Record<AITask, string>;
};

type ModelSettingsEditorProps = {
  initialValue: ModelSettingsValue;
  tasks: TaskOption[];
};

const providerPresets: Record<
  Provider,
  { label: string; baseURL: string; model: string; jsonResponseFormat: string }
> = {
  ofox: {
    label: "ofox / GPT",
    baseURL: "https://api.ofox.ai/v1",
    model: "gpt-5.5",
    jsonResponseFormat: "enabled",
  },
  deepseek: {
    label: "DeepSeek",
    baseURL: "https://api.deepseek.com",
    model: "deepseek-v4-pro",
    jsonResponseFormat: "enabled",
  },
  openai: {
    label: "OpenAI",
    baseURL: "",
    model: "gpt-5.5",
    jsonResponseFormat: "enabled",
  },
  "openai-compatible": {
    label: "OpenAI-compatible",
    baseURL: "",
    model: "gpt-5.5",
    jsonResponseFormat: "enabled",
  },
};

const highValueTaskHints: Partial<Record<AITask, string>> = {
  "lesson-plan": "建议用质量更好的模型，减少模板味。",
  courseware: "建议优先给课件生成分配更强模型。",
  "courseware-json": "结构化 JSON 要稳定，切模型后必须重测。",
  "student-qa": "学生高频使用，建议默认低成本模型。",
};

function normalizeTaskModels(tasks: TaskOption[], value: ModelSettingsValue) {
  return Object.fromEntries(
    tasks.map((item) => [item.task, value.taskModels[item.task] || value.defaultModel])
  ) as Record<AITask, string>;
}

export function ModelSettingsEditor({ initialValue, tasks }: ModelSettingsEditorProps) {
  const router = useRouter();
  const [provider, setProvider] = useState<Provider>(
    (initialValue.provider || "deepseek") as Provider
  );
  const [baseURL, setBaseURL] = useState(initialValue.baseURL);
  const [defaultModel, setDefaultModel] = useState(initialValue.defaultModel);
  const [jsonResponseFormat, setJsonResponseFormat] = useState(
    initialValue.jsonResponseFormat || "enabled"
  );
  const [proxyUrl, setProxyUrl] = useState(initialValue.proxyUrl);
  const [taskModels, setTaskModels] = useState<Record<AITask, string>>(() =>
    normalizeTaskModels(tasks, initialValue)
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedPreset = providerPresets[provider];
  const effectiveSummary = useMemo(
    () => tasks.map((item) => `${item.label}: ${taskModels[item.task] || defaultModel}`),
    [defaultModel, taskModels, tasks]
  );

  function applyPreset(nextProvider: Provider) {
    const preset = providerPresets[nextProvider];
    setProvider(nextProvider);
    setBaseURL(preset.baseURL);
    setDefaultModel(preset.model);
    setJsonResponseFormat(preset.jsonResponseFormat);
    setTaskModels(
      Object.fromEntries(tasks.map((item) => [item.task, preset.model])) as Record<AITask, string>
    );
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/model-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          baseURL,
          defaultModel,
          jsonResponseFormat,
          proxyUrl,
          taskModels,
        }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "保存模型设置失败");
      }

      setMessage("模型设置已保存，新的生成请求会使用当前配置。");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存模型设置失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold text-indigo-600">模型选择</p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">按任务切换教案、课件和答疑模型</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            这里只保存服务商、模型名和 Base URL，不保存 API Key。教案和课件可以用更强模型，学生高频答疑建议保留低成本模型。
          </p>
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-100">
          当前：{selectedPreset.label}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {Object.entries(providerPresets).map(([key, preset]) => (
          <button
            key={key}
            type="button"
            onClick={() => applyPreset(key as Provider)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition ${
              provider === key
                ? "bg-indigo-600 text-white ring-indigo-600"
                : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">服务商</span>
          <select
            value={provider}
            onChange={(event) => setProvider(event.target.value as Provider)}
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
          >
            {Object.entries(providerPresets).map(([key, preset]) => (
              <option key={key} value={key}>
                {preset.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">默认模型</span>
          <input
            value={defaultModel}
            onChange={(event) => setDefaultModel(event.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
            placeholder="gpt-5.5"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-slate-700">Base URL</span>
          <input
            value={baseURL}
            onChange={(event) => setBaseURL(event.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
            placeholder="https://api.ofox.ai/v1"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">JSON response_format</span>
          <select
            value={jsonResponseFormat}
            onChange={(event) => setJsonResponseFormat(event.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="enabled">启用</option>
            <option value="disabled">禁用</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">本地代理，可留空</span>
          <input
            value={proxyUrl}
            onChange={(event) => setProxyUrl(event.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
            placeholder="http://127.0.0.1:7897"
          />
        </label>
      </div>

      <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-900">任务级模型</p>
        <div className="mt-4 grid gap-3">
          {tasks.map((item) => (
            <label key={item.task} className="grid gap-2 md:grid-cols-[180px_1fr] md:items-center">
              <span>
                <span className="block text-sm font-medium text-slate-700">{item.label}</span>
                {highValueTaskHints[item.task] ? (
                  <span className="text-xs text-slate-400">{highValueTaskHints[item.task]}</span>
                ) : null}
              </span>
              <input
                value={taskModels[item.task] || ""}
                onChange={(event) =>
                  setTaskModels((current) => ({
                    ...current,
                    [item.task]: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                placeholder={defaultModel}
              />
            </label>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
        >
          {saving ? "保存中..." : "保存模型设置"}
        </button>
        <p className="text-xs leading-5 text-slate-500">
          生效摘要：{effectiveSummary.join("；")}
        </p>
      </div>

      {message ? (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
    </section>
  );
}
