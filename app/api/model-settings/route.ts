import { readFile, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { AI_TASKS, getAIModelConfig, type AIProvider } from "@/lib/ai";
import { getProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RequestBody = {
  provider?: string;
  baseURL?: string;
  defaultModel?: string;
  jsonResponseFormat?: string;
  proxyUrl?: string;
  taskModels?: Partial<Record<(typeof AI_TASKS)[number], string>>;
};

const allowedProviders = new Set<AIProvider>([
  "deepseek",
  "openai",
  "openai-compatible",
  "ofox",
]);

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function taskEnvName(task: (typeof AI_TASKS)[number]) {
  return `AI_${task.replaceAll("-", "_").toUpperCase()}_MODEL`;
}

function envFilePath() {
  return path.join(process.cwd(), ".env.local");
}

async function requireTeacher() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: NextResponse.json({ error: "请先登录" }, { status: 401 }) };
  }

  const profile = await getProfile(supabase, user.id);
  if (!profile || profile.role !== "teacher") {
    return { error: NextResponse.json({ error: "只有教师可以修改模型设置" }, { status: 403 }) };
  }

  return { user };
}

function snapshotConfig() {
  return {
    provider: process.env.AI_PROVIDER ?? "",
    baseURL: process.env.AI_BASE_URL ?? "",
    defaultModel: process.env.AI_MODEL ?? "",
    jsonResponseFormat: process.env.AI_JSON_RESPONSE_FORMAT ?? "enabled",
    proxyUrl: process.env.AI_PROXY_URL ?? "",
    taskModels: Object.fromEntries(
      AI_TASKS.map((task) => [task, process.env[taskEnvName(task)] ?? ""])
    ),
    effectiveTasks: AI_TASKS.map((task) => {
      try {
        return { task, config: getAIModelConfig(task), error: null };
      } catch (error) {
        return {
          task,
          config: null,
          error: error instanceof Error ? error.message : "模型配置读取失败",
        };
      }
    }),
  };
}

async function updateEnvFile(values: Record<string, string>) {
  let raw = "";
  try {
    raw = await readFile(envFilePath(), "utf8");
  } catch {
    raw = "";
  }

  const seen = new Set<string>();
  const nextLines = raw.split(/\r?\n/).map((line) => {
    const match = line.match(/^([^#=\s][^=]*)=(.*)$/);
    if (!match) {
      return line;
    }

    const key = match[1].trim();
    if (!(key in values)) {
      return line;
    }

    seen.add(key);
    return `${key}=${values[key]}`;
  });

  for (const [key, value] of Object.entries(values)) {
    if (!seen.has(key)) {
      nextLines.push(`${key}=${value}`);
    }
  }

  await writeFile(envFilePath(), nextLines.join("\n"), "utf8");
}

export async function GET() {
  const auth = await requireTeacher();
  if ("error" in auth) return auth.error;

  return NextResponse.json(snapshotConfig());
}

export async function POST(request: Request) {
  const auth = await requireTeacher();
  if ("error" in auth) return auth.error;

  const body = (await request.json().catch(() => ({}))) as RequestBody;
  const provider = clean(body.provider) as AIProvider;
  const baseURL = clean(body.baseURL);
  const defaultModel = clean(body.defaultModel);
  const jsonResponseFormat = clean(body.jsonResponseFormat) || "enabled";
  const proxyUrl = clean(body.proxyUrl);

  if (!allowedProviders.has(provider)) {
    return NextResponse.json({ error: "不支持的模型服务商" }, { status: 400 });
  }

  if (!defaultModel) {
    return NextResponse.json({ error: "请填写默认模型" }, { status: 400 });
  }

  if ((provider === "deepseek" || provider === "openai-compatible" || provider === "ofox") && !baseURL) {
    return NextResponse.json({ error: "当前服务商需要填写 Base URL" }, { status: 400 });
  }

  const taskModels = body.taskModels ?? {};
  const updates: Record<string, string> = {
    AI_PROVIDER: provider,
    AI_BASE_URL: baseURL,
    AI_MODEL: defaultModel,
    AI_JSON_RESPONSE_FORMAT: jsonResponseFormat,
    AI_PROXY_URL: proxyUrl,
  };

  for (const task of AI_TASKS) {
    updates[taskEnvName(task)] = clean(taskModels[task]) || defaultModel;
  }

  await updateEnvFile(updates);

  for (const [key, value] of Object.entries(updates)) {
    process.env[key] = value;
  }

  return NextResponse.json(snapshotConfig());
}
