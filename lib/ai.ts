import OpenAI from "openai";

export type AIProvider = "deepseek" | "openai" | "openai-compatible" | "ofox";

export const AI_TASKS = [
  "lesson-plan",
  "student-qa",
  "knowledge-explain",
  "courseware",
  "courseware-json",
  "courseware-html",
] as const;

export type AITask = (typeof AI_TASKS)[number];

export type AIModelConfig = {
  provider: AIProvider;
  model: string;
  baseURL?: string;
};

const providerDefaults: Record<AIProvider, { baseURL?: string; model?: string }> = {
  deepseek: {
    baseURL: "https://api.deepseek.com",
    model: "deepseek-v4-flash",
  },
  openai: {
    model: "gpt-4.1-mini",
  },
  "openai-compatible": {},
  ofox: {},
};

let configuredProxyUrl: string | undefined;

function clean(value: string | undefined) {
  return value?.trim() || undefined;
}

function requireValue(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`${name} is not set`);
  }

  return value;
}

function normalizeProvider(value: string | undefined): AIProvider {
  const provider = clean(value)?.toLowerCase();

  if (
    provider === "deepseek" ||
    provider === "openai" ||
    provider === "openai-compatible" ||
    provider === "ofox"
  ) {
    return provider;
  }

  return "deepseek";
}

function getTaskModelEnvName(task?: AITask) {
  if (!task) {
    return undefined;
  }

  return `AI_${task.replaceAll("-", "_").toUpperCase()}_MODEL`;
}

function getProviderApiKey(provider: AIProvider) {
  if (provider === "deepseek") {
    return clean(process.env.AI_API_KEY) || clean(process.env.DEEPSEEK_API_KEY);
  }

  if (provider === "openai") {
    return clean(process.env.AI_API_KEY) || clean(process.env.OPENAI_API_KEY);
  }

  if (provider === "ofox") {
    return clean(process.env.AI_API_KEY) || clean(process.env.OFOX_API_KEY);
  }

  return clean(process.env.AI_API_KEY);
}

function getProviderBaseURL(provider: AIProvider) {
  if (provider === "deepseek") {
    return (
      clean(process.env.AI_BASE_URL) ||
      clean(process.env.DEEPSEEK_BASE_URL) ||
      providerDefaults.deepseek.baseURL
    );
  }

  if (provider === "ofox") {
    return clean(process.env.AI_BASE_URL) || clean(process.env.OFOX_BASE_URL);
  }

  if (provider === "openai-compatible") {
    return clean(process.env.AI_BASE_URL);
  }

  return clean(process.env.AI_BASE_URL);
}

function getProviderModel(provider: AIProvider, task?: AITask) {
  const taskModelEnvName = getTaskModelEnvName(task);
  const taskModel = taskModelEnvName ? clean(process.env[taskModelEnvName]) : undefined;

  if (taskModel) {
    return taskModel;
  }

  if (provider === "deepseek") {
    return (
      clean(process.env.AI_MODEL) ||
      clean(process.env.DEEPSEEK_MODEL) ||
      providerDefaults.deepseek.model
    );
  }

  if (provider === "openai") {
    return clean(process.env.AI_MODEL) || clean(process.env.OPENAI_MODEL) || providerDefaults.openai.model;
  }

  if (provider === "ofox") {
    return clean(process.env.AI_MODEL) || clean(process.env.OFOX_MODEL);
  }

  return clean(process.env.AI_MODEL);
}

async function configureOptionalProxy() {
  const proxyUrl = clean(process.env.AI_PROXY_URL);

  if (!proxyUrl || configuredProxyUrl === proxyUrl) {
    return;
  }

  const { ProxyAgent, setGlobalDispatcher } = await import("undici");
  setGlobalDispatcher(new ProxyAgent(proxyUrl));
  configuredProxyUrl = proxyUrl;
}

export function getAIModelConfig(task?: AITask): AIModelConfig {
  const provider = normalizeProvider(process.env.AI_PROVIDER);
  const model = requireValue(getProviderModel(provider, task), "AI_MODEL");
  const baseURL = getProviderBaseURL(provider);

  if ((provider === "deepseek" || provider === "openai-compatible" || provider === "ofox") && !baseURL) {
    throw new Error("AI_BASE_URL is not set");
  }

  return {
    provider,
    model,
    baseURL,
  };
}

export async function getAIClient(): Promise<OpenAI> {
  await configureOptionalProxy();
  const provider = normalizeProvider(process.env.AI_PROVIDER);
  const apiKey = requireValue(getProviderApiKey(provider), "AI_API_KEY");
  const baseURL = getProviderBaseURL(provider);

  if ((provider === "deepseek" || provider === "openai-compatible" || provider === "ofox") && !baseURL) {
    throw new Error("AI_BASE_URL is not set");
  }

  return new OpenAI({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
  });
}

export function getAIModel(task?: AITask): string {
  return getAIModelConfig(task).model;
}

export function getAIConfigLabel(task?: AITask) {
  const config = getAIModelConfig(task);
  return `${config.provider}:${config.model}`;
}

export function shouldUseAIJsonResponseFormat() {
  const value = clean(process.env.AI_JSON_RESPONSE_FORMAT)?.toLowerCase();
  return value !== "disabled" && value !== "false" && value !== "off";
}
