import { readFile } from "fs/promises";
import path from "path";
import { getAIClient, getAIModel } from "@/lib/ai";

export type GenerateStudentAnswerParams = {
  question: string;
  knowledgeContext?: string;
};

const SYSTEM_PROMPT =
  "你是知桥AI的 K12 学习助手，擅长把基础知识讲清楚，帮助初中生独立理解问题。";

let cachedPromptTemplate: string | null = null;

async function getPromptTemplate() {
  if (cachedPromptTemplate) {
    return cachedPromptTemplate;
  }

  const promptPath = path.join(process.cwd(), "prompts", "student-qa.md");
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
 * 调用统一 AI 模型网关生成学生答疑 Markdown。
 */
export async function generateStudentAnswer(
  params: GenerateStudentAnswerParams
): Promise<string> {
  const question = params.question?.trim();
  if (!question) {
    throw new Error("question is required");
  }

  const client = await getAIClient();
  const model = getAIModel("student-qa");
  const promptTemplate = await getPromptTemplate();
  const contextualQuestion = params.knowledgeContext?.trim()
    ? `${question}\n\n可参考的知识库上下文：\n${params.knowledgeContext.trim()}`
    : question;
  const userPrompt = replaceAll(promptTemplate, { question: contextualQuestion });

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
    throw new Error("AI model returned an empty answer");
  }

  return markdown;
}
