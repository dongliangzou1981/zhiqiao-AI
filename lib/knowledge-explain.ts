import { readFile } from "fs/promises";
import path from "path";
import { getAIClient, getAIModel } from "@/lib/ai";

export type GenerateKnowledgeExplanationParams = {
  subject: string;
  grade: string;
  semester: string;
  chapter: string;
  knowledge_point_code: string;
  knowledge_point_name: string;
  description: string;
};

const SYSTEM_PROMPT =
  "你是一位经验丰富的 K12 学科教师，擅长把教材知识点讲得清楚、具体、适合学生自学。";

let cachedPromptTemplate: string | null = null;

async function getPromptTemplate() {
  if (cachedPromptTemplate) {
    return cachedPromptTemplate;
  }

  const promptPath = path.join(process.cwd(), "prompts", "knowledge-explain.md");
  cachedPromptTemplate = await readFile(promptPath, "utf8");
  return cachedPromptTemplate;
}

function replaceAll(input: string, replacements: Record<string, string>) {
  return Object.entries(replacements).reduce(
    (content, [key, value]) => content.replaceAll(`{${key}}`, value),
    input
  );
}

function normalizeParams(params: GenerateKnowledgeExplanationParams) {
  return {
    subject: params.subject.trim(),
    grade: params.grade.trim(),
    semester: params.semester.trim(),
    chapter: params.chapter.trim(),
    knowledge_point_code: params.knowledge_point_code.trim(),
    knowledge_point_name: params.knowledge_point_name.trim(),
    description: params.description.trim(),
  };
}

export async function generateKnowledgeExplanation(
  params: GenerateKnowledgeExplanationParams
): Promise<string> {
  const normalized = normalizeParams(params);

  for (const [key, value] of Object.entries(normalized)) {
    if (!value) {
      throw new Error(`${key} is required`);
    }
  }

  const promptTemplate = await getPromptTemplate();
  const userPrompt = replaceAll(promptTemplate, normalized);
  const client = await getAIClient();
  const model = getAIModel("knowledge-explain");

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.6,
  });

  const markdown = response.choices[0]?.message?.content?.trim();
  if (!markdown) {
    throw new Error("AI model returned an empty knowledge explanation");
  }

  return markdown;
}
