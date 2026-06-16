import { readFile } from "fs/promises";
import path from "path";
import { getAIClient, getAIModel } from "@/lib/ai";

export type GenerateCoursewareParams = {
  subject: string;
  grade: string;
  semester: string;
  chapter: string;
  knowledge_point_code: string;
  knowledge_point_name: string;
  description: string;
};

const SYSTEM_PROMPT =
  "你是一名经验丰富的一线初中数学教师和课件设计师。请用自然、清楚、适合课堂使用的中文生成文本课件，重点是帮助老师讲清基础知识、帮助学生听懂并练会。不要输出 JSON、HTML、PPT 代码或动态脚本。";

let cachedPromptTemplate: string | null = null;

async function getPromptTemplate() {
  if (cachedPromptTemplate) {
    return cachedPromptTemplate;
  }

  const promptPath = path.join(process.cwd(), "prompts", "courseware.md");
  cachedPromptTemplate = await readFile(promptPath, "utf8");
  return cachedPromptTemplate;
}

function replaceAll(input: string, replacements: Record<string, string>) {
  return Object.entries(replacements).reduce(
    (content, [key, value]) => content.replaceAll(`{${key}}`, value),
    input
  );
}

function normalizeParams(params: GenerateCoursewareParams) {
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

export async function generateCourseware(
  params: GenerateCoursewareParams
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
  const model = getAIModel("courseware");

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.5,
  });

  const markdown = response.choices[0]?.message?.content?.trim();
  if (!markdown) {
    throw new Error("AI model returned an empty courseware");
  }

  return markdown;
}
