import OpenAI from "openai";

export type GenerateLessonPlanParams = {
  code: string;
  name: string;
  description: string;
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

/** DeepSeek 客户端（OpenAI 兼容），供其他模块复用 */
export function getDeepSeekClient(): OpenAI {
  return new OpenAI({
    apiKey: requireEnv("DEEPSEEK_API_KEY"),
    baseURL: requireEnv("DEEPSEEK_BASE_URL"),
  });
}

export function getDeepSeekModel(): string {
  return requireEnv("DEEPSEEK_MODEL");
}

function buildUserPrompt(params: GenerateLessonPlanParams): string {
  const { code, name, description } = params;

  return `请根据以下知识点信息，生成一份适用于中国 K12 课堂的完整教案，使用 Markdown 格式输出。

- 知识点编码：${code}
- 知识点名称：${name}
- 知识点说明：${description}

请严格按以下六个部分组织内容：

## 1. 教学目标
可观测、可评估的学习目标（2–4 条）

## 2. 教学重点
本课必须掌握的核心内容与技能

## 3. 教学难点
学生易混淆或难理解之处，并给出简要突破策略

## 4. 教学过程
分环节设计（如导入、新授、练习、小结等），含时间建议、教师活动与学生活动

## 5. 课堂互动
提问、讨论、小组活动、展示等具体互动设计

## 6. 课后巩固
与知识点对应的作业、练习或拓展建议

要求：紧扣知识点说明与课标要求，语言简洁专业，可直接用于备课。仅输出 Markdown 正文，不要前言或结语。`;
}

const SYSTEM_PROMPT =
  "你是一位经验丰富的中国 K12 学科教师，擅长编写结构清晰、可直接落地的教案。";

/**
 * 调用 DeepSeek（OpenAI 兼容接口）生成 K12 教案 Markdown。
 */
export async function generateLessonPlan(params: GenerateLessonPlanParams): Promise<string> {
  const client = getDeepSeekClient();
  const model = getDeepSeekModel();

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(params) },
    ],
    temperature: 0.7,
  });

  const markdown = response.choices[0]?.message?.content?.trim();
  if (!markdown) {
    throw new Error("DeepSeek API returned an empty lesson plan");
  }

  return markdown;
}
