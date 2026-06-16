import { readFile } from "fs/promises";
import path from "path";
import { getAIClient, getAIModel } from "@/lib/ai";

export type GenerateLessonPlanParams = {
  code: string;
  name: string;
  description: string;
};

const SYSTEM_PROMPT =
  "你是一位经验丰富的中国 K12 学科教师，擅长编写结构清晰、可直接落地的教案。";

let cachedPromptTemplate: string | null = null;

async function getPromptTemplate() {
  if (cachedPromptTemplate) {
    return cachedPromptTemplate;
  }

  const promptPath = path.join(process.cwd(), "prompts", "lesson-generator.md");
  cachedPromptTemplate = await readFile(promptPath, "utf8");
  return cachedPromptTemplate;
}

function replaceAll(input: string, replacements: Record<string, string>) {
  return Object.entries(replacements).reduce(
    (content, [key, value]) => content.replaceAll(`{${key}}`, value),
    input
  );
}

/**
 * 调用统一 AI 模型网关生成 K12 教案 Markdown。
 */
export async function generateLessonPlan(params: GenerateLessonPlanParams): Promise<string> {
  const normalized = {
    code: params.code.trim(),
    name: params.name.trim(),
    description: params.description.trim(),
  };

  for (const [key, value] of Object.entries(normalized)) {
    if (!value) {
      throw new Error(`${key} is required`);
    }
  }

  const promptTemplate = await getPromptTemplate();
  const userPrompt = replaceAll(promptTemplate, normalized);
  const client = await getAIClient();
  const model = getAIModel("lesson-plan");

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
  });

  const markdown = response.choices[0]?.message?.content?.trim();
  if (!markdown) {
    throw new Error("AI model returned an empty lesson plan");
  }

  return markdown;
}
